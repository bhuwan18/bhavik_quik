import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import QuizletsClient from "@/components/quizlets/QuizletsClient";

export const QUIZLETS_CACHE_TAG = "quizlets-data";

const getAllQuizlets = unstable_cache(
  async () => prisma.quizlet.findMany({
    where: { isHidden: false },
    orderBy: [{ pack: "asc" }, { rarity: "asc" }],
    include: { createdBy: { select: { id: true, name: true } } },
  }),
  ["all-quizlets"],
  { revalidate: 3600, tags: [QUIZLETS_CACHE_TAG] }
);

export default async function QuizletsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [owned, dbUser, allQuizlets, monthlySubmissions] = await Promise.all([
    prisma.userQuizlet.findMany({
      where: { userId: session.user.id },
      select: {
        obtainedAt: true,
        quantity: true,
        quizlet: {
          select: {
            id: true, name: true, icon: true, rarity: true, pack: true,
            colorFrom: true, colorTo: true, description: true,
            isHidden: true, sellValue: true,
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { obtainedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true, isBlacksmith: true, blacksmithExpiresAt: true },
    }),
    getAllQuizlets(),
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
