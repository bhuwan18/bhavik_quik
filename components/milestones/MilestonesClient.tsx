"use client";

import { useState } from "react";
import { MILESTONES, TIER_COLORS, type MilestoneDef, type MilestoneTier } from "@/lib/milestones-data";

interface EarnedMilestone {
  threshold: number;
  earnedAt: string;
}

interface Props {
  earned: EarnedMilestone[];
  totalCoinsEarned: number;
}

const TIERS: { value: MilestoneTier | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "bronze",   label: "Bronze" },
  { value: "silver",   label: "Silver" },
  { value: "gold",     label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond",  label: "Diamond" },
];

function BadgeCard({ badge, earnedAt }: { badge: MilestoneDef; earnedAt?: string }) {
  const tierStyle = TIER_COLORS[badge.tier];
  const isEarned = !!earnedAt;

  return (
    <div
      className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
        isEarned
          ? `${tierStyle.border} ${badge.animationClass ?? ""}`
          : "border-white/10 grayscale opacity-40"
      }`}
      style={
        isEarned
          ? { background: `linear-gradient(135deg, ${badge.colorFrom}, ${badge.colorTo})` }
          : { background: `linear-gradient(135deg, #1a1a2e, #16213e)` }
      }
    >
      {/* Earned checkmark */}
      {isEarned && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-10">
          <span className="text-white text-[10px] font-bold">✓</span>
        </div>
      )}

      <div className="p-4 flex flex-col items-center text-center gap-1.5">
        {/* Icon */}
        <span className="text-3xl">{isEarned ? badge.emoji : "🔒"}</span>

        {/* Name */}
        <p className="text-white font-bold text-sm leading-tight">{badge.name}</p>

        {/* Tier label */}
        <p className={`text-xs font-semibold ${isEarned ? tierStyle.text : "text-gray-500"}`}>
          {tierStyle.label}
        </p>

        {/* Threshold */}
        <p className="text-white/70 text-xs">{badge.threshold.toLocaleString()} coins</p>

        {/* Earned date or coins needed */}
        {isEarned ? (
          <p className="text-white/50 text-[10px] mt-0.5">
            {new Date(earnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        ) : (
          <p className="text-gray-600 text-[10px] mt-0.5">Locked</p>
        )}
      </div>
    </div>
  );
}

export default function MilestonesClient({ earned, totalCoinsEarned }: Props) {
  const [activeTier, setActiveTier] = useState<MilestoneTier | "all">("all");

  const earnedMap = new Map(earned.map((e) => [e.threshold, e.earnedAt]));
  const earnedCount = earned.length;

  // Next milestone to unlock
  const nextMilestone = MILESTONES.find((m) => !earnedMap.has(m.threshold));
  const progressPct = nextMilestone
    ? Math.min(100, Math.round((totalCoinsEarned / nextMilestone.threshold) * 100))
    : 100;

  const filtered = activeTier === "all"
    ? MILESTONES
    : MILESTONES.filter((m) => m.tier === activeTier);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Milestones</h1>
        <p className="text-gray-400 text-sm">Earn lifetime coins to unlock collectible badges.</p>
      </div>

      {/* Stats + Progress */}
      <div className="mb-8 p-5 rounded-2xl border border-white/10 bg-white/5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Count */}
        <div>
          <p className="text-gray-400 text-sm mb-1">Badges Earned</p>
          <p className="text-white text-3xl font-bold">
            {earnedCount} <span className="text-gray-500 text-xl font-normal">/ 50</span>
          </p>
        </div>

        {/* Next milestone progress */}
        <div>
          {nextMilestone ? (
            <>
              <p className="text-gray-400 text-sm mb-1">
                Next: <span className="text-white font-semibold">{nextMilestone.name}</span>
                {" "}({nextMilestone.threshold.toLocaleString()} coins)
              </p>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {totalCoinsEarned.toLocaleString()} / {nextMilestone.threshold.toLocaleString()} coins ({progressPct}%)
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <p className="text-yellow-400 font-bold">All milestones unlocked!</p>
            </div>
          )}
        </div>
      </div>

      {/* Tier Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TIERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTier(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeTier === t.value
                ? "bg-white/15 border-white/30 text-white"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((badge) => (
          <BadgeCard
            key={badge.threshold}
            badge={badge}
            earnedAt={earnedMap.get(badge.threshold)}
          />
        ))}
      </div>
    </div>
  );
}
