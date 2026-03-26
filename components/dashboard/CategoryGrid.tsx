"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

const VISIBLE_COUNT = 5;

export default function CategoryGrid({
  categoriesWithNew,
}: {
  categoriesWithNew: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const newSet = new Set(categoriesWithNew);

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
        {visible.map(({ slug, label, icon: Icon, color }) => (
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
        ))}
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
