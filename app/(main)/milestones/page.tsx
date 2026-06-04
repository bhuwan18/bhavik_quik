import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MilestonesClient from "@/components/milestones/MilestonesClient";

export default async function MilestonesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [earned, user, totalQuizzes, totalCorrectAnswers, categoryCountRows] = await Promise.all([
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
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT q.category)::bigint AS count
      FROM "QuizAttempt" qa
      JOIN "Quiz" q ON qa."quizId" = q.id
      WHERE qa."userId" = ${session.user.id}
    `,
  ]);

  const distinctCategories = Number(categoryCountRows[0]?.count ?? 0);

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
