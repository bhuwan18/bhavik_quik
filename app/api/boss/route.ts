import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBossBattlesEnabled } from "@/lib/app-settings";
import { getActiveBoss } from "@/lib/boss";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabled = await getBossBattlesEnabled();
  if (!enabled) {
    return NextResponse.json({ boss: null });
  }

  const boss = await getActiveBoss();
  if (!boss) {
    return NextResponse.json({ boss: null });
  }

  const [topContributors, yourContribution, user] = await Promise.all([
    prisma.bossContribution.findMany({
      where: { bossId: boss.id },
      orderBy: { damage: "desc" },
      take: 10,
      select: { userId: true, damage: true, user: { select: { name: true, image: true } } },
    }),
    prisma.bossContribution.findUnique({
      where: { bossId_userId: { bossId: boss.id, userId: session.user.id } },
      select: { damage: true, hits: true, gemsAwarded: true },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { gems: true, totalGemsEarned: true } }),
  ]);

  return NextResponse.json({
    boss: {
      slug: boss.slug,
      name: boss.name,
      icon: boss.icon,
      description: boss.description,
      taunt: boss.taunt,
      colorFrom: boss.colorFrom,
      colorTo: boss.colorTo,
      currentHp: Math.max(0, boss.currentHp),
      maxHp: boss.maxHp,
      expiresAt: boss.expiresAt,
      status: boss.status,
    },
    topContributors: topContributors.map((c) => ({
      userId: c.userId,
      name: c.user.name ?? "Someone",
      image: c.user.image,
      damage: c.damage,
    })),
    yourContribution: yourContribution ?? { damage: 0, hits: 0, gemsAwarded: 0 },
    yourGems: user?.gems ?? 0,
    yourTotalGemsEarned: user?.totalGemsEarned ?? 0,
  });
}
