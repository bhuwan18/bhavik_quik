import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MilestonesClient from "@/components/milestones/MilestonesClient";

export default async function MilestonesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [earned, user, totalQuizzes, totalCorrectAnswers, distinctQuizIds] = await Promise.all([
    prisma.userMilestone.findMany({
      where: { userId: session.user.id },
      select: { threshold: true, earnedAt: true, milestoneType: true },
      orderBy: { threshold: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totalCoinsEarned: true, longestStreak: true },
    }),
    prisma.quizAttempt.count({ where: { userId: session.user.id } }),
    prisma.correctAnswer.count({ where: { userId: session.user.id } }),
    prisma.quizAttempt.findMany({
      where: { userId: session.user.id },
      select: { quizId: true },
      distinct: ["quizId"],
    }),
  ]);

  const quizCategories = distinctQuizIds.length > 0
    ? await prisma.quiz.findMany({
        where: { id: { in: distinctQuizIds.map((q) => q.quizId) } },
        select: { category: true },
      })
    : [];
  const distinctCategories = new Set(quizCategories.map((q) => q.category)).size;

  return (
    <MilestonesClient
      earned={earned.map((e) => ({
        threshold: e.threshold,
        earnedAt: e.earnedAt.toISOString(),
        milestoneType: e.milestoneType,
      }))}
      totalCoinsEarned={user?.totalCoinsEarned ?? 0}
      longestStreak={user?.longestStreak ?? 0}
      totalQuizzes={totalQuizzes}
      totalCorrectAnswers={totalCorrectAnswers}
      distinctCategories={distinctCategories}
    />
  );
}
