"use client";

import { CATEGORIES } from "@/lib/utils";

/** Shared category-picker chips for the intro screen of every quiz-run-backed game mode. */
export default function CategoryPicker({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs text-gray-500 mb-2 text-left">Choose a category</p>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => onSelect(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selected === null
              ? "bg-white/20 border-white/40 text-white"
              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
          }`}
        >
          🎲 Surprise me
        </button>
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = selected === c.slug;
          return (
            <button
              key={c.slug}
              onClick={() => onSelect(c.slug)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
