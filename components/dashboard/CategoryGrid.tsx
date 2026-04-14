"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";
import { PREMIUM_TIER_NAMES, PREMIUM_TIER_UNLOCK_COINS } from "@/lib/game-config";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";

const VISIBLE_COUNT = 5;

export default function CategoryGrid({
  categoriesWithNew,
  totalCoinsEarned,
}: {
  categoriesWithNew: string[];
  totalCoinsEarned: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const newSet = new Set(categoriesWithNew);

  const isTierUnlocked = (tier: 1 | 2 | 3) =>
    totalCoinsEarned >= PREMIUM_TIER_UNLOCK_COINS[tier];

  // Sort: categories with "New" badge first, then the rest in original order
  const sorted = [...CATEGORIES].sort((a, b) => {
    const aNew = newSet.has(a.slug) ? 0 : 1;
    const bNew = newSet.has(b.slug) ? 0 : 1;
    return aNew - bNew;
  });

  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT);
  const hiddenCount = CATEGORIES.length - VISIBLE_COUNT;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Pick a Category</h2>
        <Link
          href="/discover"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          All quizzes &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {visible.map((cat) => {
          const { slug, label, icon: Icon, color } = cat;
          const premiumTier = "premiumTier" in cat ? (cat.premiumTier as 1 | 2 | 3) : undefined;
          const locked = premiumTier !== undefined && !isTierUnlocked(premiumTier);

          if (locked) {
            const tierName = PREMIUM_TIER_NAMES[premiumTier];
            const required = PREMIUM_TIER_UNLOCK_COINS[premiumTier];
            return (
              <Link
                key={slug}
                href={`/discover?category=${slug}`}
                title={`${tierName} — Earn ${required.toLocaleString()} coins to unlock`}
                className="relative flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl transition-all hover:border-amber-500/30 hover:bg-amber-500/5 group"
              >
                <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40">
                  <Lock size={10} className="text-rose-400" />
                </span>
                <Icon size={36} className="text-gray-600 group-hover:text-gray-500 transition-colors" />
                <span className="text-xs text-gray-500 group-hover:text-gray-400 text-center font-medium leading-tight transition-colors">
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={slug}
              href={`/discover?category=${slug}`}
              className="relative flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-gradient-to-br hover:from-purple-600/20 hover:to-pink-600/10 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all group"
            >
              {newSet.has(slug) && (
                <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  New
                </span>
              )}
              <Icon
                size={36}
                className={`group-hover:scale-110 transition-transform ${color}`}
              />
              <span className="text-xs text-gray-400 group-hover:text-purple-300 text-center font-medium leading-tight">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 mx-auto text-sm text-gray-400 hover:text-purple-300 transition-colors"
        >
          {expanded ? (
            <>
              Show less <ChevronUp size={16} />
            </>
          ) : (
            <>
              +{hiddenCount} more categories <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
