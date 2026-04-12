"use client";

import { useState } from "react";
import {
  ALL_MILESTONES,
  MILESTONES,
  QUIZ_MILESTONES,
  ANSWER_MILESTONES,
  CATEGORY_MILESTONES,
  STREAK_BADGE_MILESTONES,
  TIER_COLORS,
  type MilestoneDef,
  type MilestoneTier,
  type MilestoneType,
} from "@/lib/milestones-data";

interface EarnedMilestone {
  threshold: number;
  earnedAt: string;
  milestoneType: string;
}

interface Props {
  earned: EarnedMilestone[];
  totalCoinsEarned: number;
  longestStreak: number;
  totalQuizzes: number;
  totalCorrectAnswers: number;
  distinctCategories: number;
}

const TIERS: { value: MilestoneTier | "all"; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "bronze",   label: "Bronze" },
  { value: "silver",   label: "Silver" },
  { value: "gold",     label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond",  label: "Diamond" },
  { value: "cosmic",   label: "Cosmic" },
];

type TypeFilter = MilestoneType | "all";

const TYPE_TABS: { value: TypeFilter; label: string; emoji: string }[] = [
  { value: "all",        label: "All",        emoji: "🏅" },
  { value: "coins",      label: "Coins",      emoji: "🪙" },
  { value: "quizzes",    label: "Quizzes",    emoji: "🎮" },
  { value: "answers",    label: "Answers",    emoji: "🧠" },
  { value: "categories", label: "Categories", emoji: "🗺️" },
  { value: "streak",     label: "Streak",     emoji: "🔥" },
];

const TYPE_MILESTONES: Record<MilestoneType, MilestoneDef[]> = {
  coins:      MILESTONES,
  quizzes:    QUIZ_MILESTONES,
  answers:    ANSWER_MILESTONES,
  categories: CATEGORY_MILESTONES,
  streak:     STREAK_BADGE_MILESTONES,
};

const TYPE_UNIT: Record<MilestoneType, string> = {
  coins:      "lifetime coins",
  quizzes:    "quizzes played",
  answers:    "unique correct answers",
  categories: "categories explored",
  streak:     "day longest streak",
};

function getStatForType(type: MilestoneType, props: Props): number {
  switch (type) {
    case "coins":      return props.totalCoinsEarned;
    case "quizzes":    return props.totalQuizzes;
    case "answers":    return props.totalCorrectAnswers;
    case "categories": return props.distinctCategories;
    case "streak":     return props.longestStreak;
  }
}

const UNIT_SHORT: Record<MilestoneType, string> = {
  coins:      "coins",
  quizzes:    "quizzes",
  answers:    "answers",
  categories: "categories",
  streak:     "day streak",
};

function BadgeCard({
  badge,
  earnedAt,
  onLockedClick,
}: {
  badge: MilestoneDef;
  earnedAt?: string;
  currentStat: number;
  onLockedClick?: () => void;
}) {
  const tierStyle = TIER_COLORS[badge.tier];
  const isEarned = !!earnedAt;

  return (
    <div
      onClick={!isEarned ? onLockedClick : undefined}
      className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
        isEarned
          ? `${tierStyle.border} ${badge.animationClass ?? ""}`
          : "border-white/10 grayscale opacity-40 cursor-pointer hover:opacity-60 hover:border-white/25 hover:scale-[1.02]"
      }`}
      style={
        isEarned
          ? { background: `linear-gradient(135deg, ${badge.colorFrom}, ${badge.colorTo})` }
          : { background: `linear-gradient(135deg, #1a1a2e, #16213e)` }
      }
    >
      {isEarned && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center z-10">
          <span className="text-white text-[10px] font-bold">✓</span>
        </div>
      )}

      <div className="p-4 flex flex-col items-center text-center gap-1.5">
        <span className="text-3xl">{isEarned ? badge.emoji : "🔒"}</span>
        <p className="text-white font-bold text-sm leading-tight">{badge.name}</p>
        <p className={`text-xs font-semibold ${isEarned ? tierStyle.text : "text-gray-500"}`}>
          {tierStyle.label}
        </p>
        <p className="text-white/70 text-xs">
          {badge.threshold.toLocaleString()} {UNIT_SHORT[badge.milestoneType]}
        </p>
        {isEarned ? (
          <p className="text-white/50 text-[10px] mt-0.5">
            {new Date(earnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        ) : (
          <p className="text-gray-600 text-[10px] mt-0.5">Tap for progress</p>
        )}
      </div>
    </div>
  );
}

function ProgressModal({
  badge,
  currentStat,
  onClose,
}: {
  badge: MilestoneDef;
  currentStat: number;
  onClose: () => void;
}) {
  const tierStyle = TIER_COLORS[badge.tier];
  const pct = Math.min(100, Math.round((currentStat / badge.threshold) * 100));
  const remaining = badge.threshold - currentStat;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl"
        style={{ background: "var(--surface, #1a1a2e)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className="p-6 flex flex-col items-center gap-2 text-center"
          style={{ background: `linear-gradient(135deg, ${badge.colorFrom}33, ${badge.colorTo}33)` }}
        >
          <span className="text-5xl grayscale opacity-50">🔒</span>
          <h2 className="text-white font-bold text-lg leading-tight">{badge.name}</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tierStyle.border} ${tierStyle.text}`}>
            {tierStyle.label}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Your progress</span>
            <span className="text-white font-semibold">
              {currentStat.toLocaleString()} / {badge.threshold.toLocaleString()} {UNIT_SHORT[badge.milestoneType]}
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1 text-right">{pct}% complete</p>
          </div>

          {/* Remaining */}
          <p className="text-center text-sm text-gray-300">
            {remaining <= 0 ? (
              <span className="text-green-400 font-semibold">Ready to unlock!</span>
            ) : (
              <>
                <span className="text-white font-semibold">{remaining.toLocaleString()}</span>{" "}
                more {UNIT_SHORT[badge.milestoneType]} to go
              </>
            )}
          </p>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeProgressBar({
  type,
  currentStat,
  earnedThresholds,
}: {
  type: MilestoneType;
  currentStat: number;
  earnedThresholds: Set<number>;
}) {
  const defs = TYPE_MILESTONES[type];
  const next = defs.find((m) => !earnedThresholds.has(m.threshold));
  if (!next) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">✅</span>
        <p className="text-green-400 font-semibold text-sm">All {type} milestones unlocked!</p>
      </div>
    );
  }
  const pct = Math.min(100, Math.round((currentStat / next.threshold) * 100));
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">
        Next: <span className="text-white font-semibold">{next.name}</span>{" "}
        ({next.threshold.toLocaleString()} {TYPE_UNIT[type]})
      </p>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-gray-500 text-[10px] mt-0.5">
        {currentStat.toLocaleString()} / {next.threshold.toLocaleString()} ({pct}%)
      </p>
    </div>
  );
}

export default function MilestonesClient({
  earned,
  totalCoinsEarned,
  longestStreak,
  totalQuizzes,
  totalCorrectAnswers,
  distinctCategories,
}: Props) {
  const [activeType, setActiveType] = useState<TypeFilter>("all");
  const [activeTier, setActiveTier] = useState<MilestoneTier | "all">("all");
  const [focusedBadge, setFocusedBadge] = useState<MilestoneDef | null>(null);

  const props: Props = { earned, totalCoinsEarned, longestStreak, totalQuizzes, totalCorrectAnswers, distinctCategories };

  // Build earned maps: type → Set<threshold>
  const earnedByType = new Map<string, Set<number>>();
  for (const e of earned) {
    if (!earnedByType.has(e.milestoneType)) earnedByType.set(e.milestoneType, new Set());
    earnedByType.get(e.milestoneType)!.add(e.threshold);
  }

  // Key: `${type}-${threshold}` → earnedAt
  const earnedKey = new Map<string, string>();
  for (const e of earned) {
    earnedKey.set(`${e.milestoneType}-${e.threshold}`, e.earnedAt);
  }

  const totalCount = ALL_MILESTONES.length;
  const earnedCount = earned.length;

  // Source milestones based on type filter
  const typeFiltered =
    activeType === "all"
      ? ALL_MILESTONES
      : ALL_MILESTONES.filter((m) => m.milestoneType === activeType);

  const displayed =
    activeTier === "all"
      ? typeFiltered
      : typeFiltered.filter((m) => m.tier === activeTier);

  // Progress info for the stats panel
  const singleType = activeType !== "all" ? (activeType as MilestoneType) : null;

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Milestones</h1>
        <p className="text-gray-400 text-sm">Unlock badges by earning coins, playing quizzes, exploring categories, and keeping streaks.</p>
      </div>

      {/* Stats Panel */}
      <div className="mb-6 p-5 rounded-2xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Badges Earned</p>
            <p className="text-white text-2xl font-bold">
              {earnedCount} <span className="text-gray-500 text-base font-normal">/ {totalCount}</span>
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Lifetime Coins</p>
            <p className="text-white text-2xl font-bold">{totalCoinsEarned.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Quizzes Played</p>
            <p className="text-white text-2xl font-bold">{totalQuizzes.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Unique Correct Answers</p>
            <p className="text-white text-2xl font-bold">{totalCorrectAnswers.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Categories Explored</p>
            <p className="text-white text-2xl font-bold">{distinctCategories} <span className="text-gray-500 text-base font-normal">/ 16</span></p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Longest Streak</p>
            <p className="text-white text-2xl font-bold">{longestStreak} <span className="text-gray-500 text-base font-normal">days</span></p>
          </div>
        </div>

        {/* Progress bar — show for active type, or all 5 types when "all" */}
        {singleType ? (
          <TypeProgressBar
            type={singleType}
            currentStat={getStatForType(singleType, props)}
            earnedThresholds={earnedByType.get(singleType) ?? new Set()}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {(["coins", "quizzes", "answers", "categories", "streak"] as MilestoneType[]).map((type) => (
              <TypeProgressBar
                key={type}
                type={type}
                currentStat={getStatForType(type, props)}
                earnedThresholds={earnedByType.get(type) ?? new Set()}
              />
            ))}
          </div>
        )}
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
              activeType === t.value
                ? "bg-white/15 border-white/30 text-white"
                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tier Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TIERS.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTier(t.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
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
        {displayed.map((badge) => {
          const isEarned = !!earnedKey.get(`${badge.milestoneType}-${badge.threshold}`);
          return (
            <BadgeCard
              key={`${badge.milestoneType}-${badge.threshold}`}
              badge={badge}
              earnedAt={earnedKey.get(`${badge.milestoneType}-${badge.threshold}`)}
              currentStat={getStatForType(badge.milestoneType as MilestoneType, props)}
              onLockedClick={!isEarned ? () => setFocusedBadge(badge) : undefined}
            />
          );
        })}
      </div>

      {/* Progress modal for locked badges */}
      {focusedBadge && (
        <ProgressModal
          badge={focusedBadge}
          currentStat={getStatForType(focusedBadge.milestoneType as MilestoneType, props)}
          onClose={() => setFocusedBadge(null)}
        />
      )}
    </div>
  );
}
