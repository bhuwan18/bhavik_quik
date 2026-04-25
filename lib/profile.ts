import { prisma } from "@/lib/db";
import { CATEGORIES } from "@/lib/utils";

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export type ProfileQuizlet = {
  name: string;
  icon: string;
  rarity: string;
};

export type ProfileData = {
  id: string;
  name: string | null;
  image: string | null;
  coins: number;
  totalCoinsEarned: number;
  currentStreak: number;
  longestStreak: number;
  totalCorrect: number;
  totalAnswered: number;
  accuracy: number;
  isOnline: boolean;
  isPro: boolean;
  isMax: boolean;
  isBlacksmith: boolean;
  proExpiresAt: Date | null;
  maxExpiresAt: Date | null;
  blacksmithExpiresAt: Date | null;
  createdAt: Date;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  ownedQuizletsCount: number;
  recentQuizlets: ProfileQuizlet[];
  mostPlayedCategory: string | null;
  lastPlayedCategory: string | null;
  totalQuizzes: number;
};

export async function getProfileData(
  profileUserId: string,
  viewerUserId: string | null,
): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: profileUserId },
    select: {
      id: true,
      name: true,
      image: true,
      isAdmin: true,
      coins: true,
      totalCoinsEarned: true,
      currentStreak: true,
      longestStreak: true,
      totalCorrect: true,
      totalAnswered: true,
      lastSeenAt: true,
      isPro: true,
      isMax: true,
      isBlacksmith: true,
      proExpiresAt: true,
      maxExpiresAt: true,
      blacksmithExpiresAt: true,
      createdAt: true,
      _count: { select: { quizAttempts: true } },
    },
  });

  if (!user || user.isAdmin) return null;

  const canCheckFollow =
    viewerUserId !== null && viewerUserId !== profileUserId;

  const [
    followerCount,
    followingCount,
    followRecord,
    recentQuizletRows,
    allAttempts,
    lastAttempt,
    ownedCount,
  ] = await Promise.all([
    prisma.userFollow.count({ where: { followingId: profileUserId } }),
    prisma.userFollow.count({ where: { followerId: profileUserId } }),
    canCheckFollow
      ? prisma.userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerUserId!,
              followingId: profileUserId,
            },
          },
        })
      : Promise.resolve(null),
    prisma.userQuizlet.findMany({
      where: { userId: profileUserId },
      orderBy: { obtainedAt: "desc" },
      take: 6,
      include: { quizlet: { select: { name: true, icon: true, rarity: true } } },
    }),
    prisma.quizAttempt.findMany({
      where: { userId: profileUserId },
      select: { quiz: { select: { category: true } } },
    }),
    prisma.quizAttempt.findFirst({
      where: { userId: profileUserId },
      orderBy: { completedAt: "desc" },
      include: { quiz: { select: { category: true } } },
    }),
    prisma.userQuizlet.count({ where: { userId: profileUserId } }),
  ]);

  // Most-played category
  const catCounts: Record<string, number> = {};
  for (const a of allAttempts) {
    catCounts[a.quiz.category] = (catCounts[a.quiz.category] ?? 0) + 1;
  }
  const mostPlayedSlug =
    Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mostPlayedCategory = mostPlayedSlug
    ? (CATEGORIES.find((c) => c.slug === mostPlayedSlug)?.label ?? mostPlayedSlug)
    : null;

  const lastPlayedSlug = lastAttempt?.quiz.category ?? null;
  const lastPlayedCategory = lastPlayedSlug
    ? (CATEGORIES.find((c) => c.slug === lastPlayedSlug)?.label ?? lastPlayedSlug)
    : null;

  const isOnline =
    !!user.lastSeenAt &&
    Date.now() - new Date(user.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

  const accuracy =
    user.totalAnswered > 0
      ? Math.round((user.totalCorrect / user.totalAnswered) * 100)
      : 0;

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    coins: user.coins,
    totalCoinsEarned: user.totalCoinsEarned,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalCorrect: user.totalCorrect,
    totalAnswered: user.totalAnswered,
    accuracy,
    isOnline,
    isPro: user.isPro,
    isMax: user.isMax,
    isBlacksmith: user.isBlacksmith,
    proExpiresAt: user.proExpiresAt,
    maxExpiresAt: user.maxExpiresAt,
    blacksmithExpiresAt: user.blacksmithExpiresAt,
    createdAt: user.createdAt,
    followerCount,
    followingCount,
    isFollowing: !!followRecord,
    ownedQuizletsCount: ownedCount,
    recentQuizlets: recentQuizletRows.map((r) => r.quizlet),
    mostPlayedCategory,
    lastPlayedCategory,
    totalQuizzes: user._count.quizAttempts,
  };
}
