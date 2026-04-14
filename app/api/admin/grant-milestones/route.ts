import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  MILESTONE_THRESHOLDS,
  QUIZ_MILESTONE_THRESHOLDS,
  ANSWER_MILESTONE_THRESHOLDS,
  CATEGORY_MILESTONE_THRESHOLDS,
  STREAK_BADGE_MILESTONE_THRESHOLDS,
} from "@/lib/milestones-data";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  if (!dbUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch everything in 4 parallel batch queries instead of N×4 sequential ones
  const [users, quizCountRows, answerCountRows, distinctAttemptRows] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, totalCoinsEarned: true, longestStreak: true },
    }),
    // Quiz count per user
    prisma.quizAttempt.groupBy({
      by: ["userId"],
      _count: { id: true },
    }),
    // Unique correct answers per user
    prisma.correctAnswer.groupBy({
      by: ["userId"],
      _count: { id: true },
    }),
    // Distinct (userId, quizId) pairs with category — for category coverage
    prisma.quizAttempt.findMany({
      select: { userId: true, quizId: true, quiz: { select: { category: true } } },
      distinct: ["userId", "quizId"],
    }),
  ]);

  // Build lookup maps
  const quizCountMap = new Map(quizCountRows.map((r) => [r.userId, r._count.id]));
  const answerCountMap = new Map(answerCountRows.map((r) => [r.userId, r._count.id]));

  // Build category-count map: userId → Set<category>
  const categoryMap = new Map<string, Set<string>>();
  for (const row of distinctAttemptRows) {
    if (!categoryMap.has(row.userId)) categoryMap.set(row.userId, new Set());
    categoryMap.get(row.userId)!.add(row.quiz.category);
  }

  let granted = 0;

  for (const user of users) {
    const milestones: { userId: string; milestoneType: string; threshold: number }[] = [];

    // Coins
    for (const t of MILESTONE_THRESHOLDS) {
      if (user.totalCoinsEarned >= t)
        milestones.push({ userId: user.id, milestoneType: "coins", threshold: t });
    }

    // Streak
    for (const t of STREAK_BADGE_MILESTONE_THRESHOLDS) {
      if (user.longestStreak >= t)
        milestones.push({ userId: user.id, milestoneType: "streak", threshold: t });
    }

    // Quizzes played
    const quizCount = quizCountMap.get(user.id) ?? 0;
    for (const t of QUIZ_MILESTONE_THRESHOLDS) {
      if (quizCount >= t)
        milestones.push({ userId: user.id, milestoneType: "quizzes", threshold: t });
    }

    // Unique correct answers
    const answerCount = answerCountMap.get(user.id) ?? 0;
    for (const t of ANSWER_MILESTONE_THRESHOLDS) {
      if (answerCount >= t)
        milestones.push({ userId: user.id, milestoneType: "answers", threshold: t });
    }

    // Category coverage
    const catCount = categoryMap.get(user.id)?.size ?? 0;
    for (const t of CATEGORY_MILESTONE_THRESHOLDS) {
      if (catCount >= t)
        milestones.push({ userId: user.id, milestoneType: "categories", threshold: t });
    }

    if (milestones.length > 0) {
      const result = await prisma.userMilestone.createMany({ data: milestones, skipDuplicates: true });
      granted += result.count;
    }
  }

  return NextResponse.json({ granted, users: users.length });
}
