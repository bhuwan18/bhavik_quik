import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Image from "next/image";
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
    { label: "Coins Earned", value: `🪙 ${data.totalCoinsEarned.toLocaleString()}`, color: "text-yellow-400" },
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

          {/* Follow button */}
          {!isOwnProfile && (
            <FollowButton
              targetUserId={data.id}
              initialIsFollowing={data.isFollowing}
            />
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
    </div>
  );
}
