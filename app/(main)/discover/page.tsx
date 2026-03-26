import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { CATEGORIES, cn } from "@/lib/utils";
import { PREMIUM_TIER_NAMES, PREMIUM_TIER_UNLOCK_COINS } from "@/lib/game-config";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const session = await auth();

  const quizzes = await prisma.quiz.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: [{ isOfficial: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  // Fetch quizzes the current user has attempted (any score) and completed (perfect score)
  let completedQuizIds = new Set<string>();
  let attemptedQuizIds = new Set<string>();
  let totalCoinsEarned = 0;
  if (session?.user?.id) {
    const [allAttempts, userData] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { userId: session.user.id },
        select: { quizId: true, score: true, total: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { totalCoinsEarned: true },
      }),
    ]);
    completedQuizIds = new Set(
      allAttempts.filter((a) => a.score === a.total).map((a) => a.quizId)
    );
    attemptedQuizIds = new Set(allAttempts.map((a) => a.quizId));
    totalCoinsEarned = userData?.totalCoinsEarned ?? 0;
  }

  /** Returns true if the user has unlocked the given premium tier */
  const isTierUnlocked = (tier: 1 | 2 | 3) =>
    totalCoinsEarned >= PREMIUM_TIER_UNLOCK_COINS[tier];

  const difficultyLabel = (d: number) => {
    const labels = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
    return labels[d] ?? "Medium";
  };
  const difficultyColor = (d: number) => {
    const colors = ["", "text-green-400", "text-green-300", "text-yellow-400", "text-orange-400", "text-red-400"];
    return colors[d] ?? "text-yellow-400";
  };

  const activeCat = CATEGORIES.find((c) => c.slug === category);
  const ActiveCatIcon = activeCat?.icon;

  return (
    <div className="p-4 pb-24 md:p-8 md:pb-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Discover Quizzes</h1>
        <p className="text-gray-400 mt-1">Browse official and community quizzes</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-nowrap overflow-x-auto md:flex-wrap pb-2 mb-6 scrollbar-hide">
        <Link
          href="/discover"
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            !category ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => {
          const { slug, label, icon: Icon, color } = cat;
          const premiumTier = "premiumTier" in cat ? (cat.premiumTier as 1 | 2 | 3) : undefined;
          const locked = premiumTier !== undefined && !isTierUnlocked(premiumTier);
          return (
            <Link
              key={slug}
              href={`/discover?category=${slug}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                category === slug
                  ? "bg-indigo-600 text-white"
                  : locked
                  ? "bg-white/5 text-gray-600 cursor-pointer"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {locked ? (
                <>
                  <span className="text-xs">🔒</span>
                  <span>{label}</span>
                </>
              ) : (
                <>
                  <Icon size={14} className={category === slug ? "text-white" : color} /> {label}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Search form */}
      <form className="mb-6">
        {category && <input type="hidden" name="category" value={category} />}
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search quizzes..."
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </form>

      {activeCat && ActiveCatIcon && (
        <div className="mb-6 flex items-center gap-3">
          {"premiumTier" in activeCat && !isTierUnlocked(activeCat.premiumTier as 1 | 2 | 3) ? (
            <>
              <span className="text-3xl">🔒</span>
              <div>
                <h2 className="text-xl font-bold text-white">{activeCat.label}</h2>
                <p className="text-gray-400 text-sm">
                  {PREMIUM_TIER_NAMES[activeCat.premiumTier as 1 | 2 | 3]} category —{" "}
                  unlock at {PREMIUM_TIER_UNLOCK_COINS[activeCat.premiumTier as 1 | 2 | 3].toLocaleString()} total coins earned
                </p>
              </div>
            </>
          ) : (
            <>
              <ActiveCatIcon size={28} className={activeCat.color} />
              <div>
                <h2 className="text-xl font-bold text-white">{activeCat.label}</h2>
                <p className="text-gray-400 text-sm">{quizzes.length} quizzes available</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {quizzes.map((quiz) => {
          const cat = CATEGORIES.find((c) => c.slug === quiz.category);
          const QuizIcon = cat?.icon;
          const premiumTier = cat && "premiumTier" in cat ? (cat.premiumTier as 1 | 2 | 3) : undefined;
          const isPremiumLocked = premiumTier !== undefined && !isTierUnlocked(premiumTier);
          const isCompleted = completedQuizIds.has(quiz.id);
          const isNew = quiz.isNew && !attemptedQuizIds.has(quiz.id);

          if (isPremiumLocked) {
            const tierName = PREMIUM_TIER_NAMES[premiumTier];
            const requiredCoins = PREMIUM_TIER_UNLOCK_COINS[premiumTier];
            return (
              <div
                key={quiz.id}
                className="relative bg-white/3 border border-white/5 rounded-2xl p-5 opacity-60 select-none"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm gap-2 z-10">
                  <span className="text-3xl">🔒</span>
                  <span className="text-sm font-semibold text-white">{tierName}</span>
                  <span className="text-xs text-gray-400 text-center px-4">
                    Earn {requiredCoins.toLocaleString()} coins to unlock
                  </span>
                  <span className="text-xs text-gray-500">
                    You have {totalCoinsEarned.toLocaleString()} coins
                  </span>
                </div>
                {/* Blurred background content */}
                <div className="blur-sm pointer-events-none">
                  <div className="flex items-start justify-between mb-3">
                    {QuizIcon ? <QuizIcon size={22} className={cn("shrink-0 mt-0.5", cat!.color)} /> : <span className="text-2xl">📝</span>}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{quiz.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{quiz._count.questions} questions</span>
                    <span>{quiz._count.attempts.toLocaleString()} plays</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={quiz.id}
              href={`/quiz/${quiz.id}`}
              className={`relative bg-white/5 hover:bg-white/8 border rounded-2xl p-5 transition-all hover:shadow-lg group ${
                isCompleted
                  ? "border-green-500/40 hover:border-green-500/60 hover:shadow-green-500/10"
                  : isNew
                  ? "border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/10"
                  : "border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/10"
              }`}
            >
              {isCompleted && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  ✓ Completed
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                {QuizIcon ? <QuizIcon size={22} className={cn("shrink-0 mt-0.5", cat!.color)} /> : <span className="text-2xl">📝</span>}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {isNew && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                      ✨ New
                    </span>
                  )}
                  {!isCompleted && !isNew && quiz.isOfficial && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      Official
                    </span>
                  )}
                  {!isCompleted && (
                    <span className={`text-xs font-medium ${difficultyColor(quiz.difficulty)}`}>
                      {difficultyLabel(quiz.difficulty)}
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`font-semibold transition-colors mb-1 ${isCompleted ? "text-green-300 group-hover:text-green-200" : "text-white group-hover:text-indigo-300"}`}>
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{quiz.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{quiz._count.questions} questions</span>
                <span>{quiz._count.attempts.toLocaleString()} plays</span>
                <span>by {quiz.author.name?.split(" ")[0] ?? "Unknown"}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-lg">No quizzes found. Try a different search!</p>
        </div>
      )}
    </div>
  );
}
