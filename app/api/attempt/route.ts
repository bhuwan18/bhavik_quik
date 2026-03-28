import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCHOOL_EMAIL_DOMAIN, isSchoolHours, getISTDateString } from "@/lib/time";
import { getSchoolHoursEnabled, getRetakeCoinsEnabled } from "@/lib/app-settings";
import {
  COINS_BY_DIFFICULTY,
  DAILY_LIMIT_REGULAR,
  DAILY_LIMIT_PRO,
  DAILY_LIMIT_MAX,
  MULTIPLIER_REGULAR,
  MULTIPLIER_PRO,
  MULTIPLIER_MAX,
  STREAK_MILESTONES,
} from "@/lib/game-config";
import { MILESTONE_THRESHOLDS, getMilestoneByThreshold } from "@/lib/milestones-data";

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
      currentStreak: true,
      longestStreak: true,
      lastStreakDate: true,
      streakFreezes: true,
    },
  });

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  // School hours check: Oberoi International School students
  const isOberoi = (dbUser.email ?? "").endsWith(SCHOOL_EMAIL_DOMAIN);
  const schoolHoursEnabled = await getSchoolHoursEnabled();
  if (isOberoi && !dbUser.schoolAccessOverride && schoolHoursEnabled && isSchoolHours()) {
    return NextResponse.json({ error: "School hours restriction active" }, { status: 403 });
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
    const question = quiz.questions.find((q) => q.id === answer.questionId);
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
  const multiplier = isMaxActive ? MULTIPLIER_MAX : isProActive ? MULTIPLIER_PRO : MULTIPLIER_REGULAR;
  const dailyLimit = isMaxActive ? DAILY_LIMIT_MAX : isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;

  // No-duplicate-coins: only award coins for newly correct questions
  const correctQuestionIds = answers
    .filter((a) => quiz.questions.find((q) => q.id === a.questionId)?.correctIndex === a.selectedIndex)
    .map((a) => a.questionId);

  // Check which are NEW (not already in CorrectAnswer)
  const existing = await prisma.correctAnswer.findMany({
    where: { userId: session.user.id, questionId: { in: correctQuestionIds } },
    select: { questionId: true },
  });
  const existingIds = new Set(existing.map((e) => e.questionId));
  const newCorrectIds = correctQuestionIds.filter((id) => !existingIds.has(id));

  // Award coins for all correct answers or only new ones, depending on admin setting
  const retakeCoinsEnabled = await getRetakeCoinsEnabled();
  const coinsBase = retakeCoinsEnabled ? correctQuestionIds.length : newCorrectIds.length;
  const rawCoinsEarned = Math.round(coinsBase * coinsPerCorrect * multiplier);

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

  // ── Streak update ──────────────────────────────────────────────────────────
  const todayIST = getISTDateString(now);
  const oldStreak = dbUser.currentStreak;
  let newStreak = oldStreak;
  let newLongest = dbUser.longestStreak;
  let newFreezes = dbUser.streakFreezes;
  let streakFreezeUsed = false;
  let streakUpdated = false;

  if (!dbUser.lastStreakDate) {
    // First ever quiz completion
    newStreak = 1;
    streakUpdated = true;
  } else {
    const lastDateIST = getISTDateString(dbUser.lastStreakDate);
    if (lastDateIST !== todayIST) {
      streakUpdated = true;
      const last = new Date(lastDateIST);
      const today = new Date(todayIST);
      const diffDays = Math.round((today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        newStreak = oldStreak + 1;
      } else {
        // Missed at least one day
        if (dbUser.streakFreezes > 0) {
          // Auto-apply one freeze
          newFreezes = dbUser.streakFreezes - 1;
          streakFreezeUsed = true;
          // Streak count unchanged
        } else {
          // Streak broken
          newStreak = 1;
        }
      }
    }
  }

  if (newStreak > newLongest) newLongest = newStreak;

  if (streakUpdated) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastStreakDate: now,
        ...(streakFreezeUsed ? { streakFreezes: newFreezes } : {}),
      },
    });

    // Streak milestone notifications
    const crossedStreakMilestones = STREAK_MILESTONES.filter(
      (t) => t > oldStreak && t <= newStreak
    );
    if (crossedStreakMilestones.length > 0) {
      const highest = Math.max(...crossedStreakMilestones);
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "streak_milestone",
          message: `🔥 ${highest}-day streak! You've been playing every day for ${highest} days!`,
        },
      });
      import("@/lib/push").then(({ sendPushToUser }) => {
        sendPushToUser(session.user.id, `🔥 ${highest}-Day Streak!`, `You've kept your streak alive for ${highest} days!`, "/dashboard").catch(() => {});
      }).catch(() => {});
    }
  }

  // Record new correct answers
  if (newCorrectIds.length > 0) {
    await prisma.correctAnswer.createMany({
      data: newCorrectIds.map((questionId) => ({ userId: session.user.id, questionId })),
      skipDuplicates: true,
    });
  }

  // Milestone rewards: check if any thresholds were crossed
  if (coinsEarned > 0) {
    const oldTotal = dbUser.totalCoinsEarned;
    const newTotal = oldTotal + coinsEarned;
    const crossed = MILESTONE_THRESHOLDS.filter((t) => t > oldTotal && t <= newTotal);
    if (crossed.length > 0) {
      await prisma.userMilestone.createMany({
        data: crossed.map((t) => ({ userId: session.user.id, threshold: t })),
        skipDuplicates: true,
      });
      const highest = Math.max(...crossed);
      const badge = getMilestoneByThreshold(highest);
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "milestone",
          message: `🏅 Milestone unlocked: ${badge.name}! You've earned ${highest.toLocaleString()} lifetime coins.`,
        },
      });
      import("@/lib/push").then(({ sendPushToUser }) => {
        sendPushToUser(session.user.id, "Milestone unlocked! 🏅", badge.name, "/milestones").catch(() => {});
      }).catch(() => {});
    }
  }

  // Leaderboard notifications: fire-and-forget (don't block response)
  if (coinsEarned > 0) {
    const oldTotal = dbUser.totalCoinsEarned;
    const newTotal = oldTotal + coinsEarned;
    const userName = dbUser.name ?? "Someone";

    // Two targeted queries instead of a full table scan:
    // 1) users whose total was between oldTotal+1 and newTotal (just overtaken)
    // 2) top 3 users by totalCoinsEarned (for top-3 join notification)
    const [overtakenUsers, top3Before] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { not: session.user.id },
          totalCoinsEarned: { gt: oldTotal, lte: newTotal },
        },
        select: { id: true, totalCoinsEarned: true },
      }),
      prisma.user.findMany({
        where: { id: { not: session.user.id } },
        orderBy: { totalCoinsEarned: "desc" },
        take: 3,
        select: { id: true, totalCoinsEarned: true },
      }),
    ]);

    const notificationsToCreate: { userId: string; type: string; message: string }[] = [];

    for (const u of overtakenUsers) {
      notificationsToCreate.push({
        userId: u.id,
        type: "overtaken",
        message: `${userName} just overtook you on the leaderboard! Keep playing to reclaim your spot.`,
      });
    }

    const wasInTop3 = top3Before.length < 3 ? false : oldTotal > top3Before[2].totalCoinsEarned;
    const isInTop3Now = top3Before.length < 3 || newTotal > top3Before[2].totalCoinsEarned;

    if (isInTop3Now && !wasInTop3) {
      for (const u of top3Before) {
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

      // Fire-and-forget push notifications — do not block the response
      import("@/lib/push").then(({ sendPushToUser }) => {
        for (const n of notificationsToCreate) {
          const title =
            n.type === "overtaken"
              ? "You've been overtaken! 😱"
              : "Someone joined the Top 3! 🏆";
          sendPushToUser(n.userId, title, n.message).catch(() => {});
        }
      }).catch(() => {});
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
    currentStreak: newStreak,
    streakFreezeUsed,
  });
}
