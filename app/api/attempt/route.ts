import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Coins earned per correct answer based on quiz difficulty (1–5)
const COINS_BY_DIFFICULTY: Record<number, number> = {
  1: 3,
  2: 5,
  3: 8,
  4: 12,
  5: 20,
};

const DAILY_LIMIT_REGULAR = 100;
const DAILY_LIMIT_PRO = 500;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch current user state from DB (not just token — authoritative source)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isLocked: true,
      isPro: true,
      proExpiresAt: true,
      dailyCoinsEarned: true,
      dailyCoinsReset: true,
    },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  // Validate request body
  let quizId: string;
  let answers: { questionId: string; selectedIndex: number }[];
  try {
    const body = await req.json();
    quizId = body.quizId;
    answers = body.answers;
    if (typeof quizId !== "string" || !quizId || !Array.isArray(answers)) {
      throw new Error("Invalid body");
    }
    // Validate each answer shape
    for (const a of answers) {
      if (typeof a.questionId !== "string" || typeof a.selectedIndex !== "number") {
        throw new Error("Invalid answer shape");
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Score the attempt
  let score = 0;
  for (const answer of answers) {
    const question = quiz.questions.find((q: any) => q.id === answer.questionId);
    if (question && question.correctIndex === answer.selectedIndex) {
      score++;
    }
  }

  const total = quiz.questions.length;

  // Determine coins per correct answer from difficulty
  const coinsPerCorrect = COINS_BY_DIFFICULTY[quiz.difficulty] ?? 5;
  const rawCoinsEarned = score * coinsPerCorrect;

  // Determine if pro is still active
  const isProActive = dbUser.isPro && (!dbUser.proExpiresAt || dbUser.proExpiresAt > new Date());
  const dailyLimit = isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;

  // Reset daily counter if it's a new day (UTC)
  const now = new Date();
  const resetDate = new Date(dbUser.dailyCoinsReset);
  const isNewDay =
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth() ||
    now.getUTCDate() !== resetDate.getUTCDate();

  const currentDailyEarned = isNewDay ? 0 : dbUser.dailyCoinsEarned;
  const remaining = Math.max(0, dailyLimit - currentDailyEarned);
  const coinsEarned = Math.min(rawCoinsEarned, remaining);

  // Record attempt
  await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      score,
      total,
      coinsEarned,
    },
  });

  // Update user atomically
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      coins: { increment: coinsEarned },
      totalCorrect: { increment: score },
      totalAnswered: { increment: total },
      dailyCoinsEarned: isNewDay ? coinsEarned : { increment: coinsEarned },
      dailyCoinsReset: isNewDay ? now : undefined,
    },
  });

  return NextResponse.json({
    score,
    total,
    coinsEarned,
    dailyLimitReached: coinsEarned < rawCoinsEarned,
    dailyLimit,
    dailyEarned: currentDailyEarned + coinsEarned,
  });
}
