import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true, totalCorrect: true, totalAnswered: true, createdAt: true, name: true },
  });

  const totalQuizlets = await prisma.quizlet.count();
  const ownedQuizlets = await prisma.userQuizlet.count({ where: { userId: session.user.id } });
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id },
    include: { quiz: { select: { title: true, category: true } } },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  const accuracy = user && user.totalAnswered > 0
    ? Math.round((user.totalCorrect / user.totalAnswered) * 100)
    : 0;

  const hasAll = ownedQuizlets >= totalQuizlets && totalQuizlets > 0;
  const year = new Date().getFullYear();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1">Quizlet {year} — Keep playing to collect them all</p>
      </div>

      {/* Completion Certificate Banner */}
      {hasAll && (
        <div className="mb-8 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-yellow-400 font-bold text-xl">🏆 You&apos;ve collected every Quizlet!</p>
            <p className="text-gray-300 mt-1">You have earned the Quizlet {year} Master Certificate.</p>
          </div>
          <Link
            href="/certificate"
            className="px-5 py-2.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
          >
            View Certificate →
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Coins", value: user?.coins?.toLocaleString() ?? "0", icon: "🪙", color: "from-yellow-500/20 to-orange-500/10 border-yellow-500/30" },
          { label: "Correct Answers", value: user?.totalCorrect?.toLocaleString() ?? "0", icon: "✅", color: "from-green-500/20 to-emerald-500/10 border-green-500/30" },
          { label: "Accuracy", value: `${accuracy}%`, icon: "🎯", color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30" },
          { label: "Quizlets Owned", value: `${ownedQuizlets}/${totalQuizlets}`, icon: "🎴", color: "from-purple-500/20 to-pink-500/10 border-purple-500/30" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Collection Progress */}
      <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Collection Progress</h2>
          <span className="text-sm text-gray-400">{ownedQuizlets}/{totalQuizlets} Quizlets</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((ownedQuizlets / Math.max(totalQuizlets, 1)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{Math.round((ownedQuizlets / Math.max(totalQuizlets, 1)) * 100)}% complete</span>
          <Link href="/quizlets" className="text-indigo-400 hover:text-indigo-300">View collection →</Link>
        </div>
      </div>

      {/* Quick Play */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Play by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {CATEGORIES.map(({ slug, label, icon }) => (
            <Link
              key={slug}
              href={`/discover?category=${slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:border-indigo-500/50 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{icon}</span>
              <span className="text-xs text-gray-400 text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentAttempts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentAttempts.map((attempt) => {
              const pct = Math.round((attempt.score / attempt.total) * 100);
              const cat = CATEGORIES.find((c) => c.slug === attempt.quiz.category);
              return (
                <div key={attempt.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat?.icon ?? "📝"}</span>
                    <div>
                      <p className="text-sm text-white font-medium">{attempt.quiz.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(attempt.completedAt).toLocaleDateString()}
                      </p>
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
