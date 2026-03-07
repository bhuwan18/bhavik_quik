import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Image from "next/image";

export default async function LeaderboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin ?? false;

  const users = await prisma.user.findMany({
    where: {
      NOT: { email: process.env.ADMIN_EMAIL ?? "admin@quizlet.internal" },
    },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      coins: true,
      totalCorrect: true,
      totalAnswered: true,
      createdAt: true,
      _count: { select: { ownedQuizlets: true, quizAttempts: true } },
    },
    orderBy: { coins: "desc" },
    take: 50,
  });

  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
        <p className="text-gray-400 mt-1">Top players ranked by coins earned</p>
      </div>

      {/* Top 3 podium */}
      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[users[1], users[0], users[2]].map((user, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ["h-28", "h-36", "h-24"];
            const gradients = [
              "from-gray-400/20 to-gray-500/10 border-gray-400/40",
              "from-yellow-500/30 to-orange-500/20 border-yellow-500/60",
              "from-orange-700/20 to-orange-800/10 border-orange-700/40",
            ];
            return (
              <div key={user.id} className={`flex flex-col items-center gap-2 ${i === 1 ? "order-first" : ""}`}>
                <span className="text-3xl">{MEDALS[actualRank - 1]}</span>
                {user.image ? (
                  <Image src={user.image} alt={user.name ?? ""} width={48} height={48} className="rounded-full ring-2 ring-white/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg">
                    {user.name?.[0] ?? "?"}
                  </div>
                )}
                <p className="text-white font-semibold text-sm text-center">{user.name ?? "Anonymous"}</p>
                <p className="text-yellow-400 font-bold text-sm">🪙 {user.coins.toLocaleString()}</p>
                <div className={`w-full ${heights[i]} bg-gradient-to-t ${gradients[i]} border rounded-t-2xl flex items-center justify-center`}>
                  <span className="text-2xl font-black text-white/40">#{actualRank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className={`grid ${isAdmin ? "grid-cols-[3rem_1fr_1fr_1fr_1fr_1fr_1fr]" : "grid-cols-[3rem_1fr_1fr_1fr_1fr_1fr]"} gap-0`}>
          {/* Header */}
          <div className="col-span-full grid grid-cols-subgrid bg-white/5 px-4 py-3 border-b border-white/10">
            <div className="text-xs text-gray-500 font-semibold">#</div>
            <div className="text-xs text-gray-500 font-semibold">Player</div>
            <div className="text-xs text-gray-500 font-semibold text-right">Coins</div>
            <div className="text-xs text-gray-500 font-semibold text-right">Correct</div>
            <div className="text-xs text-gray-500 font-semibold text-right">Accuracy</div>
            <div className="text-xs text-gray-500 font-semibold text-right">Quizlets</div>
            {isAdmin && <div className="text-xs text-gray-500 font-semibold text-right">Details</div>}
          </div>

          {users.map((user, idx) => {
            const accuracy = user.totalAnswered > 0
              ? Math.round((user.totalCorrect / user.totalAnswered) * 100)
              : 0;
            const isCurrentUser = user.id === session?.user?.id;

            return (
              <div
                key={user.id}
                className={`col-span-full grid grid-cols-subgrid px-4 py-3 border-b border-white/5 last:border-0 transition-colors
                  ${isCurrentUser ? "bg-purple-500/10 border-purple-500/20" : "hover:bg-white/5"}`}
              >
                <div className="text-sm text-gray-500 flex items-center">
                  {idx < 3 ? MEDALS[idx] : <span className="text-gray-600">{idx + 1}</span>}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  {user.image ? (
                    <Image src={user.image} alt={user.name ?? ""} width={28} height={28} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <span className={`text-sm font-medium truncate ${isCurrentUser ? "text-purple-300" : "text-white"}`}>
                    {user.name ?? "Anonymous"}
                    {isCurrentUser && <span className="text-xs text-purple-400 ml-1">(you)</span>}
                  </span>
                </div>
                <div className="text-sm text-yellow-400 font-bold text-right flex items-center justify-end">
                  🪙 {user.coins.toLocaleString()}
                </div>
                <div className="text-sm text-green-400 text-right flex items-center justify-end">
                  {user.totalCorrect.toLocaleString()}
                </div>
                <div className="text-sm text-right flex items-center justify-end">
                  <span className={accuracy >= 70 ? "text-green-400" : accuracy >= 50 ? "text-yellow-400" : "text-red-400"}>
                    {accuracy}%
                  </span>
                </div>
                <div className="text-sm text-purple-400 text-right flex items-center justify-end">
                  🎴 {user._count.ownedQuizlets}
                </div>
                {isAdmin && (
                  <div className="text-xs text-gray-500 text-right flex flex-col items-end justify-center gap-0.5">
                    <span className="text-gray-400">{user.email}</span>
                    <span>{user._count.quizAttempts} attempts</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">🏆</p>
            <p>No players yet. Be the first to earn coins!</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <p className="mt-4 text-xs text-purple-400/60 text-right">Admin view — emails and details visible</p>
      )}
    </div>
  );
}
