import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

const PAGE_SIZE = 15;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin ?? false;
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@quizlet.internal";
  const where = { NOT: { email: adminEmail } };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        coins: true,
        totalCoinsEarned: true,
        totalCorrect: true,
        totalAnswered: true,
        lastSeenAt: true,
        createdAt: true,
        isPro: true,
        isMax: true,
        _count: { select: { ownedQuizlets: true, quizAttempts: true } },
      },
      orderBy: { totalCoinsEarned: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const MEDALS = ["🥇", "🥈", "🥉"];
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const isOnline = (lastSeen: Date | null) => !!lastSeen && lastSeen > fiveMinsAgo;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
        <p className="text-gray-400 mt-1">Top players ranked by total coins ever earned</p>
      </div>

      {/* Top 3 podium — page 1 only */}
      {page === 1 && users.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {([users[1], users[0], users[2]] as (typeof users)[number][]).map((user, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const podiumHeights = ["h-24", "h-32", "h-20"];
            const podiumGradients = [
              "from-gray-400/20 to-gray-500/10 border-gray-400/30",
              "from-yellow-500/30 to-orange-500/20 border-yellow-500/50",
              "from-orange-700/20 to-orange-800/10 border-orange-700/30",
            ];
            const online = isOnline(user.lastSeenAt);
            return (
              <div key={user.id} className="flex flex-col items-center gap-1.5">
                <span className="text-2xl md:text-3xl">{MEDALS[actualRank - 1]}</span>
                <div className="relative">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? ""}
                      width={44}
                      height={44}
                      className="rounded-full ring-2 ring-white/20"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-base">
                      {user.name?.[0] ?? "?"}
                    </div>
                  )}
                  {online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[var(--background)]" />
                  )}
                </div>
                <p className="text-white font-semibold text-xs md:text-sm text-center leading-tight px-1 line-clamp-1">
                  {user.name ?? "Anonymous"}
                </p>
                <p className="text-yellow-400 font-bold text-xs md:text-sm">
                  🪙 {user.totalCoinsEarned.toLocaleString()}
                </p>
                <div
                  className={`w-full ${podiumHeights[i]} bg-gradient-to-t ${podiumGradients[i]} border rounded-t-2xl flex items-center justify-center`}
                >
                  <span className="text-xl md:text-2xl font-black text-white/30">#{actualRank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-left w-10">#</th>
                <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-left">Player</th>
                <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-right whitespace-nowrap">
                  Coins Earned
                </th>
                <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-right hidden sm:table-cell">
                  Correct
                </th>
                <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-right hidden sm:table-cell">
                  Accuracy
                </th>
                <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-right hidden md:table-cell">
                  Quizlets
                </th>
                <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-right hidden md:table-cell">
                  Quizzes
                </th>
                {isAdmin && (
                  <th className="px-3 md:px-4 py-3 text-xs text-gray-500 font-semibold text-right hidden lg:table-cell">
                    Details
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const rank = skip + idx + 1;
                const accuracy =
                  user.totalAnswered > 0
                    ? Math.round((user.totalCorrect / user.totalAnswered) * 100)
                    : 0;
                const isCurrentUser = user.id === session?.user?.id;
                const online = isOnline(user.lastSeenAt);

                return (
                  <tr
                    key={user.id}
                    className={`border-b border-white/5 last:border-0 transition-colors
                      ${isCurrentUser ? "bg-purple-500/10" : "hover:bg-white/[0.03]"}`}
                  >
                    {/* Rank */}
                    <td className="px-3 md:px-4 py-3 text-sm">
                      {rank <= 3 ? (
                        MEDALS[rank - 1]
                      ) : (
                        <span className="text-gray-500 font-mono">{rank}</span>
                      )}
                    </td>

                    {/* Player */}
                    <td className="px-3 md:px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name ?? ""}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                              {user.name?.[0] ?? "?"}
                            </div>
                          )}
                          {online && (
                            <span
                              className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[var(--background)] shadow-sm shadow-green-400/60"
                              title="Active now"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-sm font-medium truncate max-w-[120px] md:max-w-none ${
                              isCurrentUser ? "text-purple-300" : "text-white"
                            }`}
                          >
                            {user.name ?? "Anonymous"}
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs text-purple-400 shrink-0">(you)</span>
                          )}
                          {user.isMax && (
                            <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">
                              👑
                            </span>
                          )}
                          {!user.isMax && user.isPro && (
                            <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-400 text-black px-1.5 py-0.5 rounded-full font-bold shrink-0">
                              ⭐
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Coins earned */}
                    <td className="px-3 md:px-4 py-3 text-sm text-yellow-400 font-bold text-right whitespace-nowrap">
                      🪙 {user.totalCoinsEarned.toLocaleString()}
                    </td>

                    {/* Correct */}
                    <td className="px-3 md:px-4 py-3 text-sm text-green-400 text-right hidden sm:table-cell">
                      {user.totalCorrect.toLocaleString()}
                    </td>

                    {/* Accuracy */}
                    <td className="px-3 md:px-4 py-3 text-sm text-right hidden sm:table-cell">
                      <span
                        className={
                          accuracy >= 70
                            ? "text-green-400"
                            : accuracy >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {accuracy}%
                      </span>
                    </td>

                    {/* Quizlets */}
                    <td className="px-3 md:px-4 py-3 text-sm text-purple-400 text-right hidden md:table-cell">
                      🎴 {user._count.ownedQuizlets}
                    </td>

                    {/* Quizzes */}
                    <td className="px-3 md:px-4 py-3 text-sm text-blue-400 text-right hidden md:table-cell">
                      {user._count.quizAttempts}
                    </td>

                    {/* Admin details */}
                    {isAdmin && (
                      <td className="px-3 md:px-4 py-3 text-xs text-right hidden lg:table-cell">
                        <div className="text-gray-400">{user.email}</div>
                        <div className="text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">🏆</p>
            <p>No players yet. Be the first to earn coins!</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Link
            href={`?page=${page - 1}`}
            className={`px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors ${
              page <= 1 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            ← Prev
          </Link>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <Link
                  key={p}
                  href={`?page=${p}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm transition-colors ${
                    p === page
                      ? "bg-purple-600 text-white font-semibold"
                      : "bg-white/5 hover:bg-white/10 text-gray-400"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>

          <Link
            href={`?page=${page + 1}`}
            className={`px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors ${
              page >= totalPages ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Next →
          </Link>
        </div>
      )}

      {/* Footer legend */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-400 rounded-full inline-block shadow-sm shadow-green-400/60" />
          Online in the last 5 minutes
        </div>
        <div className="text-xs text-gray-600">
          {total} player{total !== 1 ? "s" : ""} · Page {page} of {totalPages || 1}
        </div>
        {isAdmin && (
          <p className="text-xs text-purple-400/60">Admin view — emails visible</p>
        )}
      </div>
    </div>
  );
}
