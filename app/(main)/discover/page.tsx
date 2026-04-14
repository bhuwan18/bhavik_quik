import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Search } from "lucide-react";
import { CATEGORIES } from "@/lib/utils";
import { PREMIUM_TIER_NAMES, PREMIUM_TIER_UNLOCK_COINS } from "@/lib/game-config";
import DiscoverGrid from "@/components/discover/DiscoverGrid";

const PAGE_SIZE = 20;

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const session = await auth();

  let quizzes: Awaited<ReturnType<typeof fetchQuizzes>> = [];
  let hasMore = false;
  let completedQuizIds: string[] = [];
  let attemptedQuizIds: string[] = [];
  let totalCoinsEarned = 0;
  let dbError = false;

  try {
    const rows = await fetchQuizzes(category, search);
    hasMore = rows.length > PAGE_SIZE;
    quizzes = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    if (session?.user?.id) {
      const pageQuizIds = quizzes.map((q) => q.id);
      const [pageAttempts, userData] = await Promise.all([
        prisma.quizAttempt.findMany({
          where: { userId: session.user.id, quizId: { in: pageQuizIds } },
          select: { quizId: true, score: true, total: true },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { totalCoinsEarned: true },
        }),
      ]);
      completedQuizIds = pageAttempts.filter((a) => a.score === a.total).map((a) => a.quizId);
      attemptedQuizIds = pageAttempts.map((a) => a.quizId);
      totalCoinsEarned = userData?.totalCoinsEarned ?? 0;
    }
  } catch {
    dbError = true;
  }

  const isTierUnlocked = (tier: 1 | 2 | 3) => totalCoinsEarned >= PREMIUM_TIER_UNLOCK_COINS[tier];

  const activeCat = CATEGORIES.find((c) => c.slug === category);
  const ActiveCatIcon = activeCat?.icon;
  const isCategoryLocked =
    activeCat && "premiumTier" in activeCat && !isTierUnlocked(activeCat.premiumTier as 1 | 2 | 3);

  return (
    <div className="w-full p-4 pb-24 md:p-8 md:pb-8 max-w-6xl mx-auto overflow-x-hidden">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Discover Quizzes</h1>
        <p className="text-gray-400 mt-1 text-sm md:text-base">Browse official and community quizzes</p>
      </div>

      {/* Category Filter — scrollable on mobile with edge fade */}
      <div className="relative mb-4">
        <div className="flex gap-2 flex-nowrap overflow-x-auto md:flex-wrap pb-2 scrollbar-hide">
          <Link
            href="/discover"
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              !category ? "bg-amber-500 text-black font-semibold" : "bg-white/5 text-gray-400 hover:bg-white/10"
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
                    ? "bg-amber-500 text-black font-semibold"
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
                    <Icon size={14} className={category === slug ? "text-black" : color} /> {label}
                  </>
                )}
              </Link>
            );
          })}
        </div>
        {/* Right-edge fade hint — mobile only */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent md:hidden" />
      </div>

      {/* Search form */}
      <form className="mb-4">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative max-w-md">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search quizzes..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <Search size={18} />
          </button>
        </div>
      </form>

      {/* Active category header */}
      {activeCat && ActiveCatIcon && (
        <div className="mb-4 flex items-center gap-3">
          {isCategoryLocked ? (
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
                <p className="text-gray-400 text-sm">{quizzes.length}{hasMore ? "+" : ""} quizzes available</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* DB error banner */}
      {dbError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Couldn&apos;t load quizzes right now — try refreshing the page.
        </div>
      )}

      {/* Quiz grid — client component handles load-more */}
      {!isCategoryLocked && (
        <DiscoverGrid
          key={`${category ?? "all"}-${search ?? ""}`}
          initialQuizzes={quizzes}
          initialHasMore={hasMore}
          completedQuizIds={completedQuizIds}
          attemptedQuizIds={attemptedQuizIds}
          totalCoinsEarned={totalCoinsEarned}
          category={category}
          search={search}
        />
      )}
    </div>
  );
}

async function fetchQuizzes(category?: string, search?: string) {
  return prisma.quiz.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      author: { select: { name: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: [{ attempts: { _count: "desc" } }],
    take: PAGE_SIZE + 1,
  });
}
