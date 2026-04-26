import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SCHOOL_EMAIL_DOMAIN, isSchoolHours, getISTDateString, getISOWeek } from "@/lib/time";
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

  // Parse body first (sync) so we can parallelize all initial fetches
  let quizId: string;
  let answers: { questionId: string; selectedIndex: number }[];
  try {
    const body = await req.json();
    quizId = body.quizId;
    answers = body.answers;
    if (typeof quizId !== "string" || !quizId || !Array.isArray(answers)) {
      throw new Error("Invalid body");
    }
    for (const a of answers) {
      if (typeof a.questionId !== "string" || typeof a.selectedIndex !== "number") {
        throw new Error("Invalid answer shape");
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // FIX 1: Parallelize user fetch, quiz fetch, and both settings reads
  const [dbUser, quiz, schoolHoursEnabled, retakeCoinsEnabled] = await Promise.all([
    prisma.user.findUnique({
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
        weeklyCoins: true,
        weeklyCoinsWeek: true,
      },
    }),
    prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        questions: { select: { id: true, correctIndex: true } },
      },
    }),
    getSchoolHoursEnabled(),
    getRetakeCoinsEnabled(),
  ]);

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.isLocked) return NextResponse.json({ error: "Account is locked" }, { status: 403 });

  // School hours check
  const isOberoi = (dbUser.email ?? "").endsWith(SCHOOL_EMAIL_DOMAIN);
  if (isOberoi && !dbUser.schoolAccessOverride && schoolHoursEnabled && isSchoolHours()) {
    return NextResponse.json({ error: "School hours restriction active" }, { status: 403 });
  }

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

  // FIX 2: Compute streak synchronously so we can merge into a single user.update
  const todayIST = getISTDateString(now);
  const oldStreak = dbUser.currentStreak;
  let newStreak = oldStreak;
  let newLongest = dbUser.longestStreak;
  let newFreezes = dbUser.streakFreezes;
  let streakFreezeUsed = false;
  let streakUpdated = false;

  if (!dbUser.lastStreakDate) {
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
        if (dbUser.streakFreezes > 0) {
          newFreezes = dbUser.streakFreezes - 1;
          streakFreezeUsed = true;
        } else {
          newStreak = 1;
        }
      }
    }
  }

  if (newStreak > newLongest) newLongest = newStreak;

  // Weekly coins tracking
  const currentISOWeek = getISOWeek(now);
  const weekChanged = dbUser.weeklyCoinsWeek !== currentISOWeek;

  // Record attempt + update user in parallel (single user.update now covers coins + streak)
  await Promise.all([
    prisma.quizAttempt.create({
      data: { userId: session.user.id, quizId, score, total, coinsEarned },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        coins: { increment: coinsEarned },
        totalCoinsEarned: { increment: coinsEarned },
        totalCorrect: { increment: score },
        totalAnswered: { increment: total },
        dailyCoinsEarned: isNewDay ? coinsEarned : { increment: coinsEarned },
        dailyCoinsReset: isNewDay ? now : undefined,
        weeklyCoins: weekChanged ? coinsEarned : { increment: coinsEarned },
        ...(weekChanged ? { weeklyCoinsWeek: currentISOWeek } : {}),
        ...(streakUpdated
          ? {
              currentStreak: newStreak,
              longestStreak: newLongest,
              lastStreakDate: now,
              ...(streakFreezeUsed ? { streakFreezes: newFreezes } : {}),
            }
          : {}),
      },
    }),
  ]);

  // Feed: quiz_completed — merge into 2-hour window or create new (fire-and-forget)
  (async () => {
    const windowStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const existing = await prisma.feedActivity.findFirst({
      where: { userId: session.user.id, type: "quiz_completed", createdAt: { gte: windowStart } },
      orderBy: { createdAt: "desc" },
    });
    const newQuiz = { quizId: quiz.id, quizTitle: quiz.title, category: quiz.category, score, total, coinsEarned };
    if (existing) {
      const prev = existing.data as Record<string, unknown>;
      const quizzes = (prev.quizzes as typeof newQuiz[]) ?? [];
      await prisma.feedActivity.update({
        where: { id: existing.id },
        data: { data: { quizzes: [...quizzes, newQuiz] } },
      });
    } else {
      await prisma.feedActivity.create({
        data: { userId: session.user.id, type: "quiz_completed", data: { quizzes: [newQuiz] } },
      });
    }
  })().catch(() => {});

  // Record new correct answers
  if (newCorrectIds.length > 0) {
    await prisma.correctAnswer.createMany({
      data: newCorrectIds.map((questionId) => ({ userId: session.user.id, questionId })),
      skipDuplicates: true,
    });
  }

  // FIX 3: Streak milestone notifications — fire-and-forget (don't block response)
  if (streakUpdated) {
    const crossedStreakMilestones = STREAK_MILESTONES.filter(
      (t) => t > oldStreak && t <= newStreak
    );
    if (crossedStreakMilestones.length > 0) {
      const highest = Math.max(...crossedStreakMilestones);

      Promise.resolve().then(async () => {
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
      }).catch(() => {});

      import("@/lib/push").then(({ sendPushToUser }) => {
        sendPushToUser(session.user.id, `🔥 ${highest}-Day Streak!`, `You've kept your streak alive for ${highest} days!`, "/dashboard").catch(() => {});
      }).catch(() => {});

      // Feed: streak_milestone activity
      prisma.feedActivity.create({
        data: { userId: session.user.id, type: "streak_milestone", data: { days: highest } },
      }).catch(() => {});
    }
  }

  // Coin milestone rewards — fire-and-forget for notifications/followers
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

      // Follower fan-out fire-and-forget
      Promise.resolve().then(async () => {
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
      }).catch(() => {});

      import("@/lib/push").then(({ sendPushToUser }) => {
        sendPushToUser(session.user.id, "Milestone unlocked! 🏅", badge.name, "/milestones").catch(() => {});
      }).catch(() => {});

      // Feed: milestone_earned activity
      prisma.feedActivity.create({
        data: {
          userId: session.user.id,
          type: "milestone_earned",
          data: { milestoneName: badge.name, milestoneType: "coins", threshold: highest, tier: badge.tier },
        },
      }).catch(() => {});
    }
  }

  // ── Non-coin milestone checks (quizzes, answers, categories, streak) ─────────
  // Fire-and-forget: these don't affect the response, so don't block the client
  Promise.resolve().then(async () => {
    const [totalQuizzes, totalCorrectCount, distinctAttemptRows, earnedNonCoin] = await Promise.all([
      prisma.quizAttempt.count({ where: { userId: session.user.id } }),
      prisma.correctAnswer.count({ where: { userId: session.user.id } }),
      prisma.quizAttempt.findMany({
        where: { userId: session.user.id },
        select: { quizId: true, quiz: { select: { category: true } } },
        distinct: ["quizId"],
      }),
      prisma.userMilestone.findMany({
        where: { userId: session.user.id, milestoneType: { not: "coins" } },
        select: { threshold: true, milestoneType: true },
      }),
    ]);

    const distinctCategoryCount = new Set(distinctAttemptRows.map((r) => r.quiz.category)).size;

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

      const byType = new Map<string, number[]>();
      for (const m of newNonCoinMilestones) {
        if (!byType.has(m.milestoneType)) byType.set(m.milestoneType, []);
        byType.get(m.milestoneType)!.push(m.threshold);
      }

      for (const [type, thresholds] of byType) {
        const highest = Math.max(...thresholds);
        const badge = getMilestone(type as MilestoneType, highest);

        import("@/lib/push").then(({ sendPushToUser }) => {
          sendPushToUser(session.user.id, "Milestone unlocked! 🏅", badge.name, "/milestones").catch(() => {});
        }).catch(() => {});

        prisma.feedActivity.create({
          data: {
            userId: session.user.id,
            type: "milestone_earned",
            data: { milestoneName: badge.name, milestoneType: type, threshold: highest, tier: badge.tier },
          },
        }).catch(() => {});
      }
    }
  }).catch(() => {});

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
      "world-languages": "Language Nerd",
      "logical-reasoning": "Cerebrix",
    };

    const mysticalQuizletName = CATEGORY_MYSTICAL_MAP[quiz.category];

    const [categoryAttempts, thisQuizAttemptCount, topAttemptedQuiz] = await Promise.all([
      mysticalQuizletName
        ? prisma.quizAttempt.findMany({
            where: { userId: session.user.id, quiz: { category: quiz.category } },
            distinct: ["quizId"],
            select: { quizId: true },
          })
        : Promise.resolve(null),
      prisma.quizAttempt.count({ where: { quizId } }),
      prisma.quizAttempt.groupBy({
        by: ["quizId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
    ]);

    const mysticalToGrant: string[] = [];

    if (mysticalQuizletName && categoryAttempts && categoryAttempts.length >= 10) {
      mysticalToGrant.push(mysticalQuizletName);
    }
    if (thisQuizAttemptCount === 1) {
      mysticalToGrant.push("Atypical Choices");
    }
    if (topAttemptedQuiz.length > 0 && topAttemptedQuiz[0].quizId === quizId) {
      mysticalToGrant.push("Follow the Path");
    }

    if (mysticalToGrant.length > 0) {
      const mysticalQuizlets = await prisma.quizlet.findMany({
        where: { name: { in: mysticalToGrant } },
        select: { id: true, name: true, icon: true, colorFrom: true, colorTo: true, description: true },
      });

      // FIX 5: batch ownership check — one query instead of N individual findUnique calls
      const alreadyOwned = await prisma.userQuizlet.findMany({
        where: { userId: session.user.id, quizletId: { in: mysticalQuizlets.map((q) => q.id) } },
        select: { quizletId: true },
      });
      const ownedIds = new Set(alreadyOwned.map((o) => o.quizletId));
      const toGrant = mysticalQuizlets.filter((mq) => !ownedIds.has(mq.id));

      if (toGrant.length > 0) {
        await prisma.userQuizlet.createMany({
          data: toGrant.map((mq) => ({ userId: session.user.id, quizletId: mq.id })),
          skipDuplicates: true,
        });

        for (const mq of toGrant) {
          mysticalGranted.push({ name: mq.name, icon: mq.icon, colorFrom: mq.colorFrom, colorTo: mq.colorTo, description: mq.description });
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
  }

  // FIX 3: Leaderboard notifications — fully fire-and-forget (only affects other users)
  if (coinsEarned > 0) {
    const oldTotal = dbUser.totalCoinsEarned;
    const newTotal = oldTotal + coinsEarned;
    const userName = dbUser.name ?? "Someone";

    Promise.resolve().then(async () => {
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
        prisma.feedActivity.create({
          data: { userId: session.user.id, type: "leaderboard_top3", data: { rank: 3 } },
        }).catch(() => {});
      }

      if (notificationsToCreate.length > 0) {
        await prisma.notification.createMany({ data: notificationsToCreate });

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
    }).catch(() => {});
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
