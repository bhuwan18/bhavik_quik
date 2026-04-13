import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  EXPLANATION_READ_COINS,
  DAILY_LIMIT_REGULAR,
  DAILY_LIMIT_PRO,
  DAILY_LIMIT_MAX,
  MULTIPLIER_REGULAR,
  MULTIPLIER_PRO,
  MULTIPLIER_MAX,
} from "@/lib/game-config";
import { getISOWeek } from "@/lib/time";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { questionId } = body;
  if (!questionId || typeof questionId !== "string") {
    return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
  }

  const [dbUser, question] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isLocked: true,
        isPro: true,
        proExpiresAt: true,
        isMax: true,
        maxExpiresAt: true,
        dailyCoinsEarned: true,
        dailyCoinsReset: true,
        weeklyCoins: true,
        weeklyCoinsWeek: true,
      },
    }),
    prisma.question.findUnique({
      where: { id: questionId },
      select: { explanation: true },
    }),
  ]);

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account locked" }, { status: 403 });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (!question.explanation) return NextResponse.json({ error: "No explanation" }, { status: 400 });

  // Idempotency: silently succeed if already read
  const existing = await prisma.explanationRead.findUnique({
    where: { userId_questionId: { userId: session.user.id, questionId } },
  });
  if (existing) return NextResponse.json({ coinsEarned: 0, alreadyRead: true });

  // Tier / multiplier
  const isMaxActive = dbUser.isMax && (!dbUser.maxExpiresAt || dbUser.maxExpiresAt > new Date());
  const isProActive = !isMaxActive && dbUser.isPro && (!dbUser.proExpiresAt || dbUser.proExpiresAt > new Date());
  const multiplier = isMaxActive ? MULTIPLIER_MAX : isProActive ? MULTIPLIER_PRO : MULTIPLIER_REGULAR;
  const dailyLimit = isMaxActive ? DAILY_LIMIT_MAX : isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;

  // Daily cap
  const now = new Date();
  const resetDate = new Date(dbUser.dailyCoinsReset);
  const isNewDay =
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth() ||
    now.getUTCDate() !== resetDate.getUTCDate();
  const currentDailyEarned = isNewDay ? 0 : dbUser.dailyCoinsEarned;
  const remaining = Math.max(0, dailyLimit - currentDailyEarned);
  const rawCoins = Math.round(EXPLANATION_READ_COINS * multiplier);
  const coinsEarned = Math.min(rawCoins, remaining);

  // Weekly tracking
  const currentISOWeek = getISOWeek(now);
  const weekChanged = dbUser.weeklyCoinsWeek !== currentISOWeek;

  await prisma.$transaction([
    prisma.explanationRead.create({ data: { userId: session.user.id, questionId } }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        coins: { increment: coinsEarned },
        totalCoinsEarned: { increment: coinsEarned },
        dailyCoinsEarned: isNewDay ? coinsEarned : { increment: coinsEarned },
        dailyCoinsReset: isNewDay ? now : undefined,
        weeklyCoins: weekChanged ? coinsEarned : { increment: coinsEarned },
        ...(weekChanged ? { weeklyCoinsWeek: currentISOWeek } : {}),
      },
    }),
  ]);

  return NextResponse.json({ coinsEarned, alreadyRead: false });
}
