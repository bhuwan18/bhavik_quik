import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STREAK_FREEZE_COST_1, STREAK_FREEZE_COST_2, STREAK_FREEZE_MAX } from "@/lib/game-config";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true, currentStreak: true, longestStreak: true, streakFreezes: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true, streakFreezes: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.streakFreezes >= STREAK_FREEZE_MAX) {
    return NextResponse.json({ error: "Maximum streak freezes already owned" }, { status: 400 });
  }

  const cost = user.streakFreezes === 0 ? STREAK_FREEZE_COST_1 : STREAK_FREEZE_COST_2;

  if (user.coins < cost) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      coins: { decrement: cost },
      streakFreezes: { increment: 1 },
    },
    select: { streakFreezes: true, coins: true },
  });

  return NextResponse.json({
    streakFreezes: updated.streakFreezes,
    coinsSpent: cost,
    coinsRemaining: updated.coins,
  });
}
