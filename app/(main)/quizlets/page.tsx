import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import QuizletsClient from "@/components/quizlets/QuizletsClient";

export default async function QuizletsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [owned, dbUser, allQuizlets, monthlySubmissions] = await Promise.all([
    prisma.userQuizlet.findMany({
      where: { userId: session.user.id },
      include: { quizlet: { include: { createdBy: { select: { id: true, name: true } } } } },
      orderBy: { obtainedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true, isBlacksmith: true, blacksmithExpiresAt: true },
    }),
    prisma.quizlet.findMany({
      where: { isHidden: false },
      orderBy: [{ pack: "asc" }, { rarity: "asc" }],
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.quizletSubmission.findMany({
      where: { userId: session.user.id, createdAt: { gte: monthStart, lt: monthEnd } },
      select: { rarity: true, status: true },
    }),
  ]);

  const isBlacksmithActive = (dbUser?.isBlacksmith ?? false) && (!dbUser?.blacksmithExpiresAt || dbUser.blacksmithExpiresAt > new Date());

  return (
    <QuizletsClient
      ownedQuizlets={owned.map((r) => ({ ...r.quizlet, obtainedAt: r.obtainedAt.toISOString(), quantity: r.quantity }))}
      userCoins={dbUser?.coins ?? 0}
      allQuizlets={allQuizlets}
      isBlacksmithActive={isBlacksmithActive}
      monthlySubmissions={monthlySubmissions}
    />
  );
}
