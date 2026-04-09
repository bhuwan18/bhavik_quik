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

  const users = await prisma.user.findMany({
    select: { id: true, totalCoinsEarned: true, longestStreak: true },
  });

  let granted = 0;

  for (const user of users) {
    const milestones: { userId: string; milestoneType: string; threshold: number }[] = [];

    // Coins
    for (const t of MILESTONE_THRESHOLDS) {
      if (user.totalCoinsEarned >= t) milestones.push({ userId: user.id, milestoneType: "coins", threshold: t });
    }

    // Streak
    for (const t of STREAK_BADGE_MILESTONE_THRESHOLDS) {
      if (user.longestStreak >= t) milestones.push({ userId: user.id, milestoneType: "streak", threshold: t });
    }

    // Quizzes played
    const quizCount = await prisma.quizAttempt.count({ where: { userId: user.id } });
    for (const t of QUIZ_MILESTONE_THRESHOLDS) {
      if (quizCount >= t) milestones.push({ userId: user.id, milestoneType: "quizzes", threshold: t });
    }

    // Unique correct answers
    const answerCount = await prisma.correctAnswer.count({ where: { userId: user.id } });
    for (const t of ANSWER_MILESTONE_THRESHOLDS) {
      if (answerCount >= t) milestones.push({ userId: user.id, milestoneType: "answers", threshold: t });
    }

    // Category coverage
    const attemptedQuizIds = await prisma.quizAttempt.findMany({
      where: { userId: user.id },
      select: { quizId: true },
      distinct: ["quizId"],
    });
    if (attemptedQuizIds.length > 0) {
      const quizCategories = await prisma.quiz.findMany({
        where: { id: { in: attemptedQuizIds.map((q) => q.quizId) } },
        select: { category: true },
      });
      const catCount = new Set(quizCategories.map((q) => q.category)).size;
      for (const t of CATEGORY_MILESTONE_THRESHOLDS) {
        if (catCount >= t) milestones.push({ userId: user.id, milestoneType: "categories", threshold: t });
      }
    }

    if (milestones.length > 0) {
      const result = await prisma.userMilestone.createMany({ data: milestones, skipDuplicates: true });
      granted += result.count;
    }
  }

  return NextResponse.json({ granted, users: users.length });
}
