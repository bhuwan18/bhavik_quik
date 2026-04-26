import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProfileData } from "@/lib/profile";
import { RARITY_COLORS } from "@/lib/utils";
import FollowButton from "@/components/profile/FollowButton";
import FollowListModal from "@/components/profile/FollowListModal";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await auth();

  const data = await getProfileData(userId, session?.user?.id ?? null);
  if (!data) notFound();

  const isOwnProfile = session?.user?.id === userId;
  const canView = session?.user?.isAdmin === true || isOwnProfile;

  const isMaxActive = data.isMax && (!data.maxExpiresAt || data.maxExpiresAt > new Date());
  const isProActive = !isMaxActive && data.isPro && (!data.proExpiresAt || data.proExpiresAt > new Date());
  const isBlacksmithActive = data.isBlacksmith && (!data.blacksmithExpiresAt || data.blacksmithExpiresAt > new Date());

  const stats = [
    { label: "Current Streak", value: `🔥 ${data.currentStreak}d`, color: "text-orange-400" },
    { label: "Longest Streak", value: `📈 ${data.longestStreak}d`, color: "text-amber-400" },
    { label: "Accuracy", value: `🎯 ${data.accuracy}%`, color: data.accuracy >= 70 ? "text-green-400" : data.accuracy >= 50 ? "text-yellow-400" : "text-red-400" },
    { label: "Quizlets Owned", value: `🎴 ${data.ownedQuizletsCount}`, color: "text-purple-400" },
    { label: "Total Quizzes", value: `📝 ${data.totalQuizzes}`, color: "text-blue-400" },
  ];

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {data.image ? (
                <Image
                  src={data.image}
                  alt={data.name ?? ""}
                  width={72}
                  height={72}
                  className="rounded-full ring-2 ring-white/20"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                  {data.name?.[0] ?? "?"}
                </div>
              )}
              {data.isOnline && (
                <span
                  className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-[var(--background)] shadow-sm shadow-green-400/60"
                  title="Online now"
                />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{data.name ?? "Anonymous"}</h1>
                {isMaxActive && (
                  <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-bold">
                    👑 Max
                  </span>
                )}
                {isProActive && (
                  <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-400 text-black px-2 py-0.5 rounded-full font-bold">
                    ⭐ Pro
                  </span>
                )}
                {isBlacksmithActive && (
                  <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-black px-2 py-0.5 rounded-full font-bold">
                    🔨 Blacksmith
                  </span>
                )}
                {isOwnProfile && (
                  <span className="text-xs text-purple-400 font-medium">(you)</span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                Member since {new Date(data.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
              {data.isOnline && (
                <p className="text-green-400 text-xs mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                  Online now
                </p>
              )}
            </div>
          </div>

          {/* Follow button + friend streak badge */}
          {!isOwnProfile && (
            <div className="flex flex-col items-end gap-2">
              <FollowButton
                targetUserId={data.id}
                initialIsFollowing={data.isFollowing}
              />
              {data.mutualStreakWithViewer && (
                <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl px-3 py-1.5">
                  <span className="text-base leading-none">🔥</span>
                  <div>
                    <p className="text-sm font-extrabold text-orange-400 leading-none">
                      {data.mutualStreakWithViewer.count} day streak
                    </p>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Best: {data.mutualStreakWithViewer.longestCount}d
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Follower / following counts — clickable for admins and own profile */}
        <FollowListModal
          userId={userId}
          followerCount={data.followerCount}
          followingCount={data.followingCount}
          canView={canView}
        />
      </div>

      {/* Stats grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Stats</h2>
        {/* Coins card — full width, shows balance + lifetime */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xl font-bold text-yellow-400">🪙 {data.coins.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Current Balance</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-yellow-600">🏆 {data.totalCoinsEarned.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Lifetime Earned</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category activity */}
      {(data.mostPlayedCategory || data.lastPlayedCategory) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.mostPlayedCategory && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-white font-semibold">{data.mostPlayedCategory}</p>
                  <p className="text-xs text-gray-500">Most played category</p>
                </div>
              </div>
            )}
            {data.lastPlayedCategory && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">🕹️</span>
                <div>
                  <p className="text-white font-semibold">{data.lastPlayedCategory}</p>
                  <p className="text-xs text-gray-500">Last played category</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Quizlets */}
      {data.recentQuizlets.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Quizlets
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.recentQuizlets.map((q) => {
              const rc = RARITY_COLORS[q.rarity] ?? RARITY_COLORS.common;
              return (
                <div
                  key={q.name}
                  className={`bg-white/5 border ${rc.border} rounded-xl p-3 flex items-center gap-2.5 ${rc.glow}`}
                >
                  <span className="text-2xl flex-shrink-0">{q.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{q.name}</p>
                    <p className={`text-xs ${rc.text} capitalize`}>{q.rarity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state if no quizlets */}
      {data.recentQuizlets.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-3xl mb-2">🎴</p>
          <p className="text-gray-400 text-sm">No quizlets collected yet</p>
        </div>
      )}

      {/* Friend Streaks — own profile only */}
      {isOwnProfile && data.friendStreaks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Friend Streaks
          </h2>
          <div className="space-y-2">
            {data.friendStreaks.map((s) => (
              <Link
                key={s.friendId}
                href={`/profile/${s.friendId}`}
                className="flex items-center gap-3 bg-white/5 border border-orange-500/20 rounded-xl p-3 hover:bg-white/[0.08] transition-colors"
              >
                {s.friendImage ? (
                  <Image
                    src={s.friendImage}
                    alt={s.friendName ?? ""}
                    width={36}
                    height={36}
                    className="rounded-full ring-1 ring-white/20 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {s.friendName?.[0] ?? "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {s.friendName ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">Best: {s.longestCount} days</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-extrabold text-orange-400">🔥 {s.count}</p>
                  <p className="text-[10px] text-gray-600">day streak</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
