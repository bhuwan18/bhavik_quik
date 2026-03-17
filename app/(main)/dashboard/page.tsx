import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";
import { DAILY_LIMIT_REGULAR, DAILY_LIMIT_PRO, DAILY_LIMIT_MAX } from "@/lib/game-config";
import IntroOverlay from "@/components/IntroOverlay";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      coins: true,
      totalCorrect: true,
      totalAnswered: true,
      name: true,
      isPro: true,
      proExpiresAt: true,
      isMax: true,
      maxExpiresAt: true,
      dailyCoinsEarned: true,
      dailyCoinsReset: true,
    },
  });

  const totalQuizlets = await prisma.quizlet.count();
  const ownedQuizlets = await prisma.userQuizlet.count({ where: { userId: session.user.id } });
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    include: { quiz: { select: { title: true, category: true } } },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  const accuracy =
    user && user.totalAnswered > 0
      ? Math.round((user.totalCorrect / user.totalAnswered) * 100)
      : 0;

  const hasAll = ownedQuizlets >= totalQuizlets && totalQuizlets > 0;

  const isMaxActive = user?.isMax && (!user.maxExpiresAt || user.maxExpiresAt > new Date());
  const isProActive = !isMaxActive && user?.isPro && (!user.proExpiresAt || user.proExpiresAt > new Date());
  const dailyLimit = isMaxActive ? DAILY_LIMIT_MAX : isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;
  const now = new Date();
  const resetDate = user?.dailyCoinsReset ? new Date(user.dailyCoinsReset) : new Date(0);
  const isNewDay =
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth() ||
    now.getUTCDate() !== resetDate.getUTCDate();
  const dailyEarned = isNewDay ? 0 : (user?.dailyCoinsEarned ?? 0);

  // Find categories that have new quizzes the user hasn't attempted
  const newQuizzes = await prisma.quiz.findMany({
    where: { isNew: true },
    select: { id: true, category: true },
  });
  const userAttemptedIds = new Set(
    (await prisma.quizAttempt.findMany({
      where: { userId: session.user.id },
      select: { quizId: true },
    })).map((a) => a.quizId)
  );
  const categoriesWithNew = new Set(
    newQuizzes.filter((q) => !userAttemptedIds.has(q.id)).map((q) => q.category)
  );

  const firstName = session.user.name?.split(" ")[0] ?? "Player";

  const stats = [
    { label: "Coins", value: user?.coins?.toLocaleString() ?? "0", icon: "🪙", color: "from-yellow-500/20 to-orange-500/10 border-yellow-500/30", href: "/buy-coins" },
    { label: "Correct Answers", value: user?.totalCorrect?.toLocaleString() ?? "0", icon: "✅", color: "from-green-500/20 to-emerald-500/10 border-green-500/30", href: null },
    { label: "Accuracy", value: `${accuracy}%`, icon: "🎯", color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30", href: null },
    { label: "Quizlets Owned", value: `${ownedQuizlets}/${totalQuizlets}`, icon: "🎴", color: "from-purple-500/20 to-pink-500/10 border-purple-500/30", href: "/quizlets" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <IntroOverlay />

      {/* Completion Certificate Banner */}
      {hasAll && (
        <div className="mb-6 p-5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-yellow-400 font-bold text-lg">🏆 You&apos;ve collected every Quizlet!</p>
            <p className="text-gray-300 text-sm mt-0.5">You have earned the BittsQuiz Master Certificate.</p>
          </div>
          <Link
            href="/certificate"
            className="shrink-0 px-5 py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors text-sm"
          >
            View →
          </Link>
        </div>
      )}

      {/* ── Hero: Play-first CTA ── */}
      <div className="relative overflow-hidden rounded-3xl mb-8 border border-purple-500/25"
        style={{ background: "linear-gradient(135deg, rgba(91,33,182,0.35) 0%, rgba(124,58,237,0.25) 50%, rgba(190,24,93,0.25) 100%)" }}>
        {/* Decorative floating characters */}
        <span className="absolute right-5 top-4 text-5xl opacity-20 select-none pointer-events-none">⚡</span>
        <span className="absolute right-20 top-8 text-3xl opacity-15 select-none pointer-events-none">🎴</span>
        <span className="absolute right-8 bottom-5 text-4xl opacity-15 select-none pointer-events-none">🪙</span>
        <span className="absolute right-28 bottom-4 text-2xl opacity-10 select-none pointer-events-none">🏆</span>

        <div className="relative z-10 p-7 md:p-10">
          <p className="text-sm text-purple-300 font-medium mb-1">👋 Welcome back</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{firstName}!</h1>
          <p className="text-gray-300 mb-7 max-w-md text-sm md:text-base">
            You have{" "}
            <span className="text-yellow-400 font-bold">{user?.coins?.toLocaleString() ?? 0} coins</span>{" "}
            and {ownedQuizlets}/{totalQuizlets} Quizlets. Keep playing to collect them all!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-purple-500/30 text-base"
            >
              ⚡ Play Now
            </Link>
            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/18 transition-all border border-white/20 text-base"
            >
              🎮 Game Modes
            </Link>
          </div>
        </div>
      </div>

      {/* ── Pick a Category ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Pick a Category</h2>
          <Link href="/discover" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            All quizzes →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CATEGORIES.map(({ slug, label, icon }) => (
            <Link
              key={slug}
              href={`/discover?category=${slug}`}
              className="relative flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-gradient-to-br hover:from-purple-600/20 hover:to-pink-600/10 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all group"
            >
              {categoriesWithNew.has(slug) && (
                <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  New
                </span>
              )}
              <span className="text-4xl group-hover:scale-110 transition-transform">{icon}</span>
              <span className="text-xs text-gray-400 group-hover:text-purple-300 text-center font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon, color, href }) => {
          const card = (
            <div className={`bg-gradient-to-br ${color} border rounded-2xl p-5 ${href ? "hover:scale-105 transition-transform" : ""}`}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-sm text-gray-400 mt-1">{label}</div>
            </div>
          );
          return href ? (
            <Link key={label} href={href}>{card}</Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      {/* ── Daily Coins + Collection Progress ── */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Daily Coin Limit */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              🪙 Daily Coins
              {isMaxActive && <span className="text-purple-400 text-xs">(Max)</span>}
              {!isMaxActive && isProActive && <span className="text-yellow-400 text-xs">(Pro)</span>}
            </span>
            <span className="text-sm text-gray-400">{dailyEarned} / {dailyLimit}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all ${isMaxActive ? "bg-gradient-to-r from-purple-500 to-pink-500" : isProActive ? "bg-gradient-to-r from-yellow-500 to-orange-400" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`}
              style={{ width: `${Math.min(100, Math.round((dailyEarned / dailyLimit) * 100))}%` }}
            />
          </div>
          {dailyEarned >= dailyLimit ? (
            <p className="text-xs text-orange-400">
              Daily limit reached — resets tomorrow.{" "}
              {!isProActive && !isMaxActive && <Link href="/shop" className="underline">Upgrade to Pro or Max</Link>} for more.
            </p>
          ) : (
            <p className="text-xs text-gray-500">{dailyLimit - dailyEarned} coins left today</p>
          )}
        </div>

        {/* Collection Progress */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">🎴 Collection</span>
            <span className="text-sm text-gray-400">{ownedQuizlets} / {totalQuizlets}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((ownedQuizlets / Math.max(totalQuizlets, 1)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round((ownedQuizlets / Math.max(totalQuizlets, 1)) * 100)}% complete</span>
            <Link href="/marketplace" className="text-indigo-400 hover:text-indigo-300">Open packs →</Link>
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {recentAttempts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link href="/discover" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Play more →</Link>
          </div>
          <div className="space-y-3">
            {recentAttempts.map((attempt: any) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              const cat = CATEGORIES.find((c) => c.slug === attempt.quiz.category);
              return (
                <div key={attempt.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat?.icon ?? "📝"}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{attempt.quiz.title}</p>
                      <p className="text-xs text-gray-500">{new Date(attempt.completedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${pct >= 70 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {attempt.score}/{attempt.total}
                    </p>
                    <p className="text-xs text-yellow-500">+{attempt.coinsEarned} 🪙</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
