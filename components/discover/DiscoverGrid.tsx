"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CATEGORIES, cn } from "@/lib/utils";
import { PREMIUM_TIER_NAMES, PREMIUM_TIER_UNLOCK_COINS } from "@/lib/game-config";

export type QuizCard = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: number;
  isOfficial: boolean;
  isNew: boolean;
  author: { name: string | null };
  _count: { questions: number; attempts: number };
};

type Props = {
  initialQuizzes: QuizCard[];
  initialHasMore: boolean;
  completedQuizIds: string[];
  attemptedQuizIds: string[];
  totalCoinsEarned: number;
  category?: string;
  search?: string;
};

const difficultyLabel = (d: number) => {
  const labels = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
  return labels[d] ?? "Medium";
};
const difficultyColor = (d: number) => {
  const colors = ["", "text-green-400", "text-green-300", "text-yellow-400", "text-orange-400", "text-red-400"];
  return colors[d] ?? "text-yellow-400";
};

export default function DiscoverGrid({
  initialQuizzes,
  initialHasMore,
  completedQuizIds,
  attemptedQuizIds,
  totalCoinsEarned,
  category,
  search,
}: Props) {
  const [quizzes, setQuizzes] = useState<QuizCard[]>(initialQuizzes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const completedSet = new Set(completedQuizIds);
  const attemptedSet = new Set(attemptedQuizIds);

  const isTierUnlocked = (tier: 1 | 2 | 3) => totalCoinsEarned >= PREMIUM_TIER_UNLOCK_COINS[tier];

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(quizzes.length) });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`/api/quizzes?${params}`);
      if (res.ok) {
        const data: { quizzes: QuizCard[]; hasMore: boolean } = await res.json();
        setQuizzes((prev) => [...prev, ...data.quizzes]);
        setHasMore(data.hasMore);
      }
    } finally {
      setLoading(false);
    }
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-lg">No quizzes found. Try a different search!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {quizzes.map((quiz) => {
          const cat = CATEGORIES.find((c) => c.slug === quiz.category);
          const QuizIcon = cat?.icon;
          const premiumTier = cat && "premiumTier" in cat ? (cat.premiumTier as 1 | 2 | 3) : undefined;
          const isPremiumLocked = premiumTier !== undefined && !isTierUnlocked(premiumTier);
          const isCompleted = completedSet.has(quiz.id);
          const isNew = quiz.isNew && !attemptedSet.has(quiz.id);

          if (isPremiumLocked) {
            const tierName = PREMIUM_TIER_NAMES[premiumTier];
            const requiredCoins = PREMIUM_TIER_UNLOCK_COINS[premiumTier];
            return (
              <div
                key={quiz.id}
                className="relative bg-white/3 border border-white/5 rounded-2xl p-4 md:p-5 opacity-60 select-none"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm gap-2 z-10">
                  <span className="text-3xl">🔒</span>
                  <span className="text-sm font-semibold text-white">{tierName}</span>
                  <span className="text-xs text-gray-400 text-center px-4">
                    Earn {requiredCoins.toLocaleString()} coins to unlock
                  </span>
                  <span className="text-xs text-gray-500">
                    You have {totalCoinsEarned.toLocaleString()} coins
                  </span>
                </div>
                <div className="blur-sm pointer-events-none">
                  <div className="flex items-start justify-between mb-3">
                    {QuizIcon ? <QuizIcon size={22} className={cn("shrink-0 mt-0.5", cat!.color)} /> : <span className="text-2xl">📝</span>}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-1 md:line-clamp-2">{quiz.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{quiz._count.questions} questions</span>
                    <span>{quiz._count.attempts.toLocaleString()} plays</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={quiz.id}
              href={`/quiz/${quiz.id}`}
              className={`relative flex flex-col bg-white/5 hover:bg-white/8 border rounded-2xl p-4 md:p-5 transition-all hover:shadow-lg group ${
                isCompleted
                  ? "border-green-500/40 hover:border-green-500/60 hover:shadow-green-500/10"
                  : isNew
                  ? "border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/10"
                  : "border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/10"
              }`}
            >
              {isCompleted && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  ✓ Completed
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                {QuizIcon ? <QuizIcon size={22} className={cn("shrink-0 mt-0.5", cat!.color)} /> : <span className="text-2xl">📝</span>}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {isNew && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                      ✨ New
                    </span>
                  )}
                  {!isCompleted && !isNew && quiz.isOfficial && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      Official
                    </span>
                  )}
                  {!isCompleted && (
                    <span className={`text-xs font-medium ${difficultyColor(quiz.difficulty)}`}>
                      {difficultyLabel(quiz.difficulty)}
                    </span>
                  )}
                </div>
              </div>
              <h3 className={`font-semibold transition-colors mb-1 ${isCompleted ? "text-green-300 group-hover:text-green-200" : "text-white group-hover:text-indigo-300"}`}>
                {quiz.title}
              </h3>
              {quiz.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-1 md:line-clamp-2">{quiz.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2">
                <span>{quiz._count.questions} Qs</span>
                <span>{quiz._count.attempts.toLocaleString()} plays</span>
                <span className="hidden sm:inline ml-auto">by {quiz.author.name?.split(" ")[0] ?? "Unknown"}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl px-6 py-3 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading…
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </>
  );
}
