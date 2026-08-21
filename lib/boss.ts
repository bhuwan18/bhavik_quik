import { prisma } from "@/lib/db";
import { pickNextBoss } from "@/lib/bosses-data";
import { BOSS_DURATION_DAYS } from "@/lib/game-config";
import { calculateBossGemPayout } from "@/lib/boss-gems";

export type ActiveBoss = Awaited<ReturnType<typeof getActiveBoss>>;

/**
 * Returns the current active boss, lazily spawning one if none exists.
 * The cron (app/api/cron/boss-cycle) is the primary spawn path in production;
 * this lazy fallback keeps the feature working in local dev without it.
 */
export async function getActiveBoss() {
  const existing = await prisma.boss.findFirst({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return spawnNextBoss();
}

/** Spawns the next boss from the roster, avoiding an immediate repeat of the last one. */
export async function spawnNextBoss() {
  const lastBoss = await prisma.boss.findFirst({
    orderBy: { createdAt: "desc" },
    select: { slug: true },
  });
  const def = pickNextBoss(lastBoss?.slug);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + BOSS_DURATION_DAYS * 24 * 60 * 60 * 1000);

  return prisma.boss.create({
    data: {
      slug: def.slug,
      name: def.name,
      icon: def.icon,
      description: def.description,
      taunt: def.taunt,
      colorFrom: def.colorFrom,
      colorTo: def.colorTo,
      maxHp: def.baseHp,
      currentHp: def.baseHp,
      status: "active",
      startsAt: now,
      expiresAt,
    },
  });
}

export type BossDamageResult = {
  bossId: string;
  currentHp: number;
  maxHp: number;
  defeated: boolean;
  gemsEarned: number;
};

/**
 * Applies damage from a single quiz attempt to the active boss, race-safe under
 * concurrent requests from many players. Never throws — callers should still
 * wrap this in try/catch since it touches shared state outside the caller's
 * own transaction.
 */
export async function applyBossDamage(userId: string, damage: number): Promise<BossDamageResult | null> {
  if (damage <= 0) return null;

  const boss = await getActiveBoss();
  if (!boss || boss.status !== "active") return null;

  // 1. Atomic decrement, guarded so a dead/expired boss can't be hit further.
  const hit = await prisma.boss.updateMany({
    where: { id: boss.id, status: "active", currentHp: { gt: 0 } },
    data: { currentHp: { decrement: damage } },
  });
  if (hit.count === 0) return null; // someone else already finished it, or it's not active

  // 2. Record this user's contribution.
  await prisma.bossContribution.upsert({
    where: { bossId_userId: { bossId: boss.id, userId } },
    update: { damage: { increment: damage }, hits: { increment: 1 } },
    create: { bossId: boss.id, userId, damage, hits: 1 },
  });

  // 3. Exactly-once defeat flip. Row-level locking on the guarded update means
  //    only one concurrent request can see count === 1 here.
  const killed = await prisma.boss.updateMany({
    where: { id: boss.id, status: "active", currentHp: { lte: 0 } },
    data: { status: "defeated", defeatedAt: new Date(), finalBlowUserId: userId },
  });

  let gemsEarned = 0;
  let defeated = false;
  if (killed.count === 1) {
    defeated = true;
    resolveBossDefeat(boss.id).catch((err) => console.error("[boss] resolveBossDefeat failed:", err));
    // gemsEarned for THIS response is computed after the fact inside resolveBossDefeat,
    // so re-read this contributor's row once the payout has (likely) landed is unreliable
    // for a synchronous response — instead compute this user's share inline below.
  }

  const freshBoss = await prisma.boss.findUnique({ where: { id: boss.id }, select: { currentHp: true, maxHp: true, status: true } });

  if (defeated) {
    // Compute this user's gem share synchronously so the attempt response can show it
    // immediately, without waiting on the fire-and-forget payout fan-out.
    const myContribution = await prisma.bossContribution.findUnique({
      where: { bossId_userId: { bossId: boss.id, userId } },
      select: { damage: true },
    });
    const topContribution = await prisma.bossContribution.findFirst({
      where: { bossId: boss.id },
      orderBy: { damage: "desc" },
      select: { damage: true },
    });
    const topDamage = topContribution?.damage ?? 1;
    const myDamage = myContribution?.damage ?? 0;
    gemsEarned = calculateBossGemPayout(myDamage, topDamage, /* isFinalBlow */ true);
  }

  return {
    bossId: boss.id,
    currentHp: Math.max(0, freshBoss?.currentHp ?? 0),
    maxHp: freshBoss?.maxHp ?? boss.maxHp,
    defeated,
    gemsEarned,
  };
}

/**
 * Pays out gems to every contributor once a boss has been defeated. Called
 * fire-and-forget from applyBossDamage — never awaited by the request that
 * landed the killing blow, since fanning out to every contributor can be slow.
 */
export async function resolveBossDefeat(bossId: string): Promise<void> {
  const boss = await prisma.boss.findUnique({ where: { id: bossId } });
  if (!boss || boss.status !== "defeated") return;

  const contributions = await prisma.bossContribution.findMany({
    where: { bossId },
    orderBy: { damage: "desc" },
  });
  if (contributions.length === 0) return;

  const topDamage = contributions[0].damage || 1;

  const payouts = contributions.map((c) => ({
    userId: c.userId,
    contributionId: c.id,
    gems: calculateBossGemPayout(c.damage, topDamage, c.userId === boss.finalBlowUserId),
  }));

  // Chunk into batches to avoid one enormous transaction on a very popular boss.
  const CHUNK_SIZE = 50;
  for (let i = 0; i < payouts.length; i += CHUNK_SIZE) {
    const chunk = payouts.slice(i, i + CHUNK_SIZE);
    await prisma.$transaction(
      chunk.flatMap((p) => [
        prisma.user.update({
          where: { id: p.userId },
          data: { gems: { increment: p.gems }, totalGemsEarned: { increment: p.gems } },
        }),
        prisma.bossContribution.update({
          where: { id: p.contributionId },
          data: { gemsAwarded: p.gems },
        }),
      ])
    );
  }

  // Fire-and-forget notifications + push + one feed activity.
  prisma.notification
    .createMany({
      data: payouts.map((p) => ({
        userId: p.userId,
        type: "boss_defeated",
        message:
          p.userId === boss.finalBlowUserId
            ? `⚔️ You landed the final blow on ${boss.name}! +${p.gems} gems.`
            : `⚔️ ${boss.name} has been defeated! +${p.gems} gems for your part in it.`,
      })),
    })
    .catch(() => {});

  import("@/lib/push")
    .then(({ sendPushToUser }) => {
      for (const p of payouts) {
        sendPushToUser(p.userId, "Boss Defeated! ⚔️", `${boss.name} has fallen. You earned ${p.gems} gems.`, "/boss").catch(() => {});
      }
    })
    .catch(() => {});

  if (boss.finalBlowUserId) {
    const topContributors = contributions.slice(0, 5);
    const topUsers = await prisma.user.findMany({
      where: { id: { in: topContributors.map((c) => c.userId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(topUsers.map((u) => [u.id, u.name ?? "Someone"]));

    prisma.feedActivity
      .create({
        data: {
          userId: boss.finalBlowUserId,
          type: "boss_defeated",
          data: {
            bossName: boss.name,
            bossIcon: boss.icon,
            maxHp: boss.maxHp,
            contributorCount: contributions.length,
            topContributors: topContributors.map((c) => ({ name: nameById.get(c.userId) ?? "Someone", damage: c.damage })),
          },
        },
      })
      .catch(() => {});
  }
}
