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
import {
  MILESTONE_THRESHOLDS,
  getMilestoneByThreshold,
  getMilestone,
  QUIZ_MILESTONE_THRESHOLDS,
  ANSWER_MILESTONE_THRESHOLDS,
  CATEGORY_MILESTONE_THRESHOLDS,
  STREAK_BADGE_MILESTONE_THRESHOLDS,
  type MilestoneType,
} from "@/lib/milestones-data";

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

      // Notify followers about streak milestone
      const streakFollowers = await prisma.userFollow.findMany({
        where: { followingId: session.user.id },
        select: { followerId: true },
      });
      if (streakFollowers.length > 0) {
        await prisma.notification.createMany({
          data: streakFollowers.map((f) => ({
            userId: f.followerId,
            type: "follow_streak_milestone",
            message: `🔥 ${dbUser.name ?? "Someone"} just hit a ${highest}-day streak!`,
          })),
        });
      }
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
        data: crossed.map((t) => ({ userId: session.user.id, milestoneType: "coins", threshold: t })),
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

      // Notify followers about coin milestone
      const milestoneFollowers = await prisma.userFollow.findMany({
        where: { followingId: session.user.id },
        select: { followerId: true },
      });
      if (milestoneFollowers.length > 0) {
        await prisma.notification.createMany({
          data: milestoneFollowers.map((f) => ({
            userId: f.followerId,
            type: "follow_milestone",
            message: `🏅 ${dbUser.name ?? "Someone"} just unlocked the "${badge.name}" milestone!`,
          })),
        });
      }
    }
  }

  // ── Non-coin milestone checks (quizzes, answers, categories, streak) ─────────
  {
    const [totalQuizzes, totalCorrectCount, distinctQuizIdRows, earnedNonCoin] = await Promise.all([
      prisma.quizAttempt.count({ where: { userId: session.user.id } }),
      prisma.correctAnswer.count({ where: { userId: session.user.id } }),
      prisma.quizAttempt.findMany({
        where: { userId: session.user.id },
        select: { quizId: true },
        distinct: ["quizId"],
      }),
      prisma.userMilestone.findMany({
        where: { userId: session.user.id, milestoneType: { not: "coins" } },
        select: { threshold: true, milestoneType: true },
      }),
    ]);

    const quizCategories = await prisma.quiz.findMany({
      where: { id: { in: distinctQuizIdRows.map((q) => q.quizId) } },
      select: { category: true },
    });
    const distinctCategoryCount = new Set(quizCategories.map((q) => q.category)).size;

    const earnedByType = new Map<string, Set<number>>();
    for (const m of earnedNonCoin) {
      if (!earnedByType.has(m.milestoneType)) earnedByType.set(m.milestoneType, new Set());
      earnedByType.get(m.milestoneType)!.add(m.threshold);
    }

    const newNonCoinMilestones: { userId: string; milestoneType: string; threshold: number }[] = [];

    for (const t of QUIZ_MILESTONE_THRESHOLDS) {
      if (totalQuizzes >= t && !earnedByType.get("quizzes")?.has(t)) {
        newNonCoinMilestones.push({ userId: session.user.id, milestoneType: "quizzes", threshold: t });
      }
    }
    for (const t of ANSWER_MILESTONE_THRESHOLDS) {
      if (totalCorrectCount >= t && !earnedByType.get("answers")?.has(t)) {
        newNonCoinMilestones.push({ userId: session.user.id, milestoneType: "answers", threshold: t });
      }
    }
    for (const t of CATEGORY_MILESTONE_THRESHOLDS) {
      if (distinctCategoryCount >= t && !earnedByType.get("categories")?.has(t)) {
        newNonCoinMilestones.push({ userId: session.user.id, milestoneType: "categories", threshold: t });
      }
    }
    for (const t of STREAK_BADGE_MILESTONE_THRESHOLDS) {
      if (newLongest >= t && !earnedByType.get("streak")?.has(t)) {
        newNonCoinMilestones.push({ userId: session.user.id, milestoneType: "streak", threshold: t });
      }
    }

    if (newNonCoinMilestones.length > 0) {
      await prisma.userMilestone.createMany({ data: newNonCoinMilestones, skipDuplicates: true });

      // Group by type and send one notification per type (highest threshold)
      const byType = new Map<string, number[]>();
      for (const m of newNonCoinMilestones) {
        if (!byType.has(m.milestoneType)) byType.set(m.milestoneType, []);
        byType.get(m.milestoneType)!.push(m.threshold);
      }
      for (const [type, thresholds] of byType) {
        const highest = Math.max(...thresholds);
        const badge = getMilestone(type as MilestoneType, highest);
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            type: "milestone",
            message: `🏅 Milestone unlocked: ${badge.name}! ${badge.description}`,
          },
        });
        import("@/lib/push").then(({ sendPushToUser }) => {
          sendPushToUser(session.user.id, "Milestone unlocked! 🏅", badge.name, "/milestones").catch(() => {});
        }).catch(() => {});
      }
    }
  }

  // ── Mystical Quizlet grants ────────────────────────────────────────────────
  const mysticalGranted: { name: string; icon: string; colorFrom: string; colorTo: string; description: string }[] = [];
  {
    const CATEGORY_MYSTICAL_MAP: Record<string, string> = {
      "harry-potter": "Hogwarts Legend",
      "avengers": "Arc Reactor",
      "math": "Mathematician",
      "geography": "Global Expert",
      "world-travel": "Master of Travel",
      "memes": "Lord of Laughs",
      "technology": "Technological Wonder",
      "gaming": "Technoblade Never Dies",
      "science": "Newton's Spirit",
      "football": "Back of the Net",
      "cricket": "Out of the Park",
      "flags": "Flag of India",
      "anime": "Senku Ishigami",
      "physics": "Laws of Physics",
      "animals": "Animal Lover",
      "grade-6": "Ready",
      "artists": "Picasso",
      "musicians": "Prodigy",
    };

    const mysticalQuizletName = CATEGORY_MYSTICAL_MAP[quiz.category];

    const [categoryAttempts, thisQuizAttemptCount] = await Promise.all([
      mysticalQuizletName
        ? prisma.quizAttempt.findMany({
            where: { userId: session.user.id, quiz: { category: quiz.category } },
            distinct: ["quizId"],
            select: { quizId: true },
          })
        : Promise.resolve(null),
      // Count attempts for this specific quiz AFTER recording.
      // If it's 1, it had 0 plays before this attempt — definitively the least played.
      quiz.isOfficial
        ? prisma.quizAttempt.count({ where: { quizId } })
        : Promise.resolve(null),
    ]);

    const mysticalToGrant: string[] = [];

    if (mysticalQuizletName && categoryAttempts && categoryAttempts.length >= 10) {
      mysticalToGrant.push(mysticalQuizletName);
    }
    if (thisQuizAttemptCount === 1) {
      // This quiz had 0 plays before this attempt — it was the least played
      mysticalToGrant.push("Atypical Choices");
    }

    if (mysticalToGrant.length > 0) {
      const mysticalQuizlets = await prisma.quizlet.findMany({
        where: { name: { in: mysticalToGrant } },
        select: { id: true, name: true, icon: true, colorFrom: true, colorTo: true, description: true },
      });

      for (const mq of mysticalQuizlets) {
        const alreadyOwned = await prisma.userQuizlet.findUnique({
          where: { userId_quizletId: { userId: session.user.id, quizletId: mq.id } },
        });
        if (!alreadyOwned) {
          await prisma.userQuizlet.create({
            data: { userId: session.user.id, quizletId: mq.id },
          });
          await prisma.notification.create({
            data: {
              userId: session.user.id,
              type: "milestone",
              message: `✨ Mystical Quizlet unlocked: "${mq.name}"! A rare achievement quizlet is now in your collection.`,
            },
          });
          mysticalGranted.push({ name: mq.name, icon: mq.icon, colorFrom: mq.colorFrom, colorTo: mq.colorTo, description: mq.description });
        }
      }
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
    mysticalQuizletsGranted: mysticalGranted,
  });
}
