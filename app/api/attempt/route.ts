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

const DAILY_LIMIT_REGULAR = 500;
const DAILY_LIMIT_PRO = 1000;
const DAILY_LIMIT_MAX = 1500;

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
      isMax: true,
      maxExpiresAt: true,
      schoolAccessOverride: true,
      email: true,
      dailyCoinsEarned: true,
      dailyCoinsReset: true,
      totalCoinsEarned: true,
      name: true,
    },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  // School hours check: Oberoi International School students
  const isOberoi = (dbUser.email ?? "").endsWith("@oberoi-is.net");
  if (isOberoi && !dbUser.schoolAccessOverride) {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const day = istTime.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    const hour = istTime.getUTCHours();
    if (day >= 1 && day <= 5 && hour >= 8 && hour < 15) {
      return NextResponse.json({ error: "School hours restriction active" }, { status: 403 });
    }
  }

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

  // Determine active tier
  const isMaxActive = dbUser.isMax && (!dbUser.maxExpiresAt || dbUser.maxExpiresAt > new Date());
  const isProActive = !isMaxActive && dbUser.isPro && (!dbUser.proExpiresAt || dbUser.proExpiresAt > new Date());
  const multiplier = isMaxActive ? 2 : isProActive ? 1.5 : 1;
  const dailyLimit = isMaxActive ? DAILY_LIMIT_MAX : isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;

  // No-duplicate-coins: only award coins for newly correct questions
  const correctQuestionIds = answers
    .filter((a) => quiz.questions.find((q: any) => q.id === a.questionId)?.correctIndex === a.selectedIndex)
    .map((a) => a.questionId);

  // Check which are NEW (not already in CorrectAnswer)
  const existing = await prisma.correctAnswer.findMany({
    where: { userId: session.user.id, questionId: { in: correctQuestionIds } },
    select: { questionId: true },
  });
  const existingIds = new Set(existing.map((e) => e.questionId));
  const newCorrectIds = correctQuestionIds.filter((id) => !existingIds.has(id));

  // rawCoinsEarned based on new correct answers only
  const rawCoinsEarned = Math.round(newCorrectIds.length * coinsPerCorrect * multiplier);

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
      totalCoinsEarned: { increment: coinsEarned },
      totalCorrect: { increment: score },
      totalAnswered: { increment: total },
      dailyCoinsEarned: isNewDay ? coinsEarned : { increment: coinsEarned },
      dailyCoinsReset: isNewDay ? now : undefined,
    },
  });

  // Record new correct answers
  if (newCorrectIds.length > 0) {
    await prisma.correctAnswer.createMany({
      data: newCorrectIds.map((questionId) => ({ userId: session.user.id, questionId })),
      skipDuplicates: true,
    });
  }

  // Leaderboard notifications: fire-and-forget (don't block response)
  if (coinsEarned > 0) {
    const oldTotal = dbUser.totalCoinsEarned;
    const newTotal = oldTotal + coinsEarned;
    const userName = dbUser.name ?? "Someone";

    // Find users overtaken (their totalCoinsEarned was between old and new)
    const overtakenUsers = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        totalCoinsEarned: { gt: oldTotal, lte: newTotal },
      },
      select: { id: true },
    });

    const notificationsToCreate: { userId: string; type: string; message: string }[] = [];

    if (overtakenUsers.length > 0) {
      for (const u of overtakenUsers) {
        notificationsToCreate.push({
          userId: u.id,
          type: "overtaken",
          message: `${userName} just overtook you on the leaderboard! Keep playing to reclaim your spot.`,
        });
      }
    }

    // Check if user just entered top 3 (wasn't there before, is now)
    const top3Before = await prisma.user.findMany({
      where: { id: { not: session.user.id } },
      orderBy: { totalCoinsEarned: "desc" },
      take: 3,
      select: { id: true, totalCoinsEarned: true },
    });

    const wasInTop3 = top3Before.length < 3 ? false : oldTotal > top3Before[2].totalCoinsEarned;
    const isInTop3Now = top3Before.length < 3 || newTotal > top3Before[2].totalCoinsEarned;

    if (isInTop3Now && !wasInTop3) {
      for (const u of top3Before.slice(0, 3)) {
        // Avoid duplicate notification if already notified via overtaken
        if (!notificationsToCreate.some((n) => n.userId === u.id)) {
          notificationsToCreate.push({
            userId: u.id,
            type: "top3_join",
            message: `${userName} just joined the top 3 on the leaderboard!`,
          });
        }
      }
    }

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({ data: notificationsToCreate });
    }
  }

  return NextResponse.json({
    score,
    total,
    coinsEarned,
    newCorrectAnswers: newCorrectIds.length,
    dailyLimitReached: coinsEarned < rawCoinsEarned,
    dailyLimit,
    dailyEarned: currentDailyEarned + coinsEarned,
  });
}
