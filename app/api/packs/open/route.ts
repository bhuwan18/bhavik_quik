import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rollPackOpening } from "@/lib/roll";
import { SELL_VALUES } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isLocked: true, dailyCoinsSpent: true, dailySpentReset: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  let packSlug: string;
  let quantity: number;
  try {
    const body = await req.json();
    packSlug = body.packSlug;
    if (typeof packSlug !== "string" || packSlug.length > 100) throw new Error("Invalid packSlug");
    quantity = typeof body.quantity === "number" ? Math.floor(body.quantity) : 1;
    if (quantity < 1) throw new Error("Invalid quantity");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const pack = await prisma.pack.findUnique({ where: { slug: packSlug } });
  if (!pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 });

  const totalCost = pack.cost * quantity;

  // Atomic conditional debit — only succeeds if the user has enough coins right now.
  // This prevents a TOCTOU race where two concurrent requests both pass a balance check
  // and both deduct, resulting in a negative balance.
  const deducted = await prisma.user.updateMany({
    where: { id: session.user.id, coins: { gte: totalCost } },
    data: { coins: { decrement: totalCost } },
  });
  if (deducted.count === 0) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  // Track daily spending for "Spending Machine" mystical quizlet
  const now = new Date();
  const spentResetDate = new Date(dbUser.dailySpentReset);
  const isNewSpendDay =
    now.getUTCFullYear() !== spentResetDate.getUTCFullYear() ||
    now.getUTCMonth() !== spentResetDate.getUTCMonth() ||
    now.getUTCDate() !== spentResetDate.getUTCDate();
  const currentDailySpent = isNewSpendDay ? 0 : dbUser.dailyCoinsSpent;
  const newDailySpent = currentDailySpent + totalCost;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      dailyCoinsSpent: isNewSpendDay ? totalCost : { increment: totalCost },
      ...(isNewSpendDay ? { dailySpentReset: now } : {}),
    },
  });

  const [packQuizlets, allQuizlets] = await Promise.all([
    prisma.quizlet.findMany({ where: { pack: packSlug } }),
    prisma.quizlet.findMany(),
  ]);

  // Roll once per quantity
  const rolled = Array.from({ length: quantity }, () =>
    rollPackOpening(packSlug, packQuizlets, allQuizlets)
  ).flat();

  const ownedIds = new Set(
    (
      await prisma.userQuizlet.findMany({
        where: { userId: session.user.id, quizletId: { in: rolled.map((q) => q.id) } },
        select: { quizletId: true },
      })
    ).map((r) => r.quizletId)
  );

  let refundCoins = 0;
  const newQuizlets: typeof rolled = [];
  const duplicates: typeof rolled = [];
  // Track newly gained quizlets within this roll to avoid double-granting
  const grantedIds = new Set<string>();

  for (const quizlet of rolled) {
    if (ownedIds.has(quizlet.id) || grantedIds.has(quizlet.id)) {
      refundCoins += SELL_VALUES[quizlet.rarity] ?? 10;
      duplicates.push(quizlet);
    } else {
      newQuizlets.push(quizlet);
      grantedIds.add(quizlet.id);
    }
  }

  if (newQuizlets.length > 0) {
    await prisma.userQuizlet.createMany({
      data: newQuizlets.map((q) => ({ userId: session.user.id, quizletId: q.id })),
      skipDuplicates: true,
    });
    // Feed: quizlet_earned activity for each newly obtained quizlet (fire-and-forget)
    for (const q of newQuizlets) {
      prisma.feedActivity.create({
        data: {
          userId: session.user.id,
          type: "quizlet_earned",
          data: { quizletName: q.name, rarity: q.rarity, icon: q.icon, colorFrom: q.colorFrom, colorTo: q.colorTo, source: "pack" },
        },
      }).catch(() => {});
    }
  }

  // Credit back refund coins for duplicates (initial debit already applied above)
  if (refundCoins > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { increment: refundCoins } },
    });
  }

  // ── Mystical quizlet grants from pack opening ──────────────────────────────
  const packMysticalToGrant: string[] = [];

  // "Spending Machine": spent 5000+ coins in a single day
  if (newDailySpent >= 5000) {
    packMysticalToGrant.push("Spending Machine");
  }

  // "Completion": owns all common/uncommon/rare/epic/legendary quizlets
  const COMPLETION_RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
  const [totalEligible, ownedEligibleCount] = await Promise.all([
    prisma.quizlet.count({ where: { rarity: { in: COMPLETION_RARITIES } } }),
    prisma.userQuizlet.count({
      where: { userId: session.user.id, quizlet: { rarity: { in: COMPLETION_RARITIES } } },
    }),
  ]);
  if (ownedEligibleCount >= totalEligible && totalEligible > 0) {
    packMysticalToGrant.push("Completion");
  }

  if (packMysticalToGrant.length > 0) {
    const mysticalQuizlets = await prisma.quizlet.findMany({
      where: { name: { in: packMysticalToGrant } },
      select: { id: true, name: true, icon: true, colorFrom: true, colorTo: true, description: true },
    });
    const alreadyOwned = await prisma.userQuizlet.findMany({
      where: { userId: session.user.id, quizletId: { in: mysticalQuizlets.map((q) => q.id) } },
      select: { quizletId: true },
    });
    const ownedMysticalIds = new Set(alreadyOwned.map((o) => o.quizletId));
    const toGrant = mysticalQuizlets.filter((mq) => !ownedMysticalIds.has(mq.id));

    if (toGrant.length > 0) {
      await prisma.userQuizlet.createMany({
        data: toGrant.map((mq) => ({ userId: session.user.id, quizletId: mq.id })),
        skipDuplicates: true,
      });
      prisma.notification.createMany({
        data: toGrant.map((mq) => ({
          userId: session.user.id,
          type: "milestone",
          message: `✨ Mystical Quizlet unlocked: "${mq.name}"! A rare achievement quizlet is now in your collection.`,
        })),
      }).catch(() => {});
      for (const mq of toGrant) {
        prisma.feedActivity.create({
          data: {
            userId: session.user.id,
            type: "quizlet_earned",
            data: { quizletName: mq.name, rarity: "mystical", icon: mq.icon, colorFrom: mq.colorFrom, colorTo: mq.colorTo, source: "mystical" },
          },
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    results: [
      ...newQuizlets.map((q) => ({ ...q, isDuplicate: false })),
      ...duplicates.map((q) => ({ ...q, isDuplicate: true })),
    ],
    coinsSpent: totalCost,
    coinsRefunded: refundCoins,
  });
}
