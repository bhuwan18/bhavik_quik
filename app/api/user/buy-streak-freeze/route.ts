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
    select: { coins: true, streakFreezes: true, dailyCoinsSpent: true, dailySpentReset: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.streakFreezes >= STREAK_FREEZE_MAX) {
    return NextResponse.json({ error: "Maximum streak freezes already owned" }, { status: 400 });
  }

  const cost = user.streakFreezes === 0 ? STREAK_FREEZE_COST_1 : STREAK_FREEZE_COST_2;

  if (user.coins < cost) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  const now = new Date();
  const spentResetDate = new Date(user.dailySpentReset);
  const isNewSpendDay =
    now.getUTCFullYear() !== spentResetDate.getUTCFullYear() ||
    now.getUTCMonth() !== spentResetDate.getUTCMonth() ||
    now.getUTCDate() !== spentResetDate.getUTCDate();
  const newDailySpent = (isNewSpendDay ? 0 : user.dailyCoinsSpent) + cost;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      coins: { decrement: cost },
      streakFreezes: { increment: 1 },
      dailyCoinsSpent: isNewSpendDay ? cost : { increment: cost },
      ...(isNewSpendDay ? { dailySpentReset: now } : {}),
    },
    select: { streakFreezes: true, coins: true },
  });

  // "Spending Machine": grant mystical quizlet if 5000+ coins spent today
  if (newDailySpent >= 5000) {
    Promise.resolve().then(async () => {
      const spendingMachine = await prisma.quizlet.findFirst({ where: { name: "Spending Machine" } });
      if (!spendingMachine) return;
      const alreadyOwns = await prisma.userQuizlet.findFirst({
        where: { userId: session.user.id, quizletId: spendingMachine.id },
      });
      if (alreadyOwns) return;
      await prisma.userQuizlet.create({ data: { userId: session.user.id, quizletId: spendingMachine.id } });
      prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "milestone",
          message: `✨ Mystical Quizlet unlocked: "Spending Machine"! A rare achievement quizlet is now in your collection.`,
        },
      }).catch(() => {});
      prisma.feedActivity.create({
        data: {
          userId: session.user.id,
          type: "quizlet_earned",
          data: { quizletName: spendingMachine.name, rarity: "mystical", icon: spendingMachine.icon, colorFrom: spendingMachine.colorFrom, colorTo: spendingMachine.colorTo, source: "mystical" },
        },
      }).catch(() => {});
    }).catch(() => {});
  }

  return NextResponse.json({
    streakFreezes: updated.streakFreezes,
    coinsSpent: cost,
    coinsRemaining: updated.coins,
  });
}
