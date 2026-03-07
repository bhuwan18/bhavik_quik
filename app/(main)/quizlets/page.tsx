import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import QuizletsClient from "@/components/quizlets/QuizletsClient";

export default async function QuizletsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const owned = await prisma.userQuizlet.findMany({
    where: { userId: session.user.id },
    include: { quizlet: true },
    orderBy: { obtainedAt: "desc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  const allCount = await prisma.quizlet.count({ where: { isHidden: false } });

  return (
    <QuizletsClient
      ownedQuizlets={owned.map((r) => ({ ...r.quizlet, obtainedAt: r.obtainedAt.toISOString() }))}
      userCoins={user?.coins ?? 0}
      totalPublicQuizlets={allCount}
    />
  );
}
