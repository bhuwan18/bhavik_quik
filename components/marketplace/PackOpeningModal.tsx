"use client";

import { useState } from "react";
import { RARITY_COLORS } from "@/lib/utils";

type QuizletResult = {
  id: string;
  name: string;
  rarity: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  description: string;
  isDuplicate: boolean;
};

type Props = {
  pack: { name: string };
  results: QuizletResult[];
  coinsRefunded: number;
  onClose: () => void;
};

export default function PackOpeningModal({ pack, results, coinsRefunded, onClose }: Props) {
  const [revealed, setRevealed] = useState(false);

  const quizlet = results[0];
  if (!quizlet) return null;

  const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
  const isLegendary = quizlet.rarity === "legendary";
  const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">🎴 {pack.name} Opened!</h2>
          {coinsRefunded > 0 && (
            <p className="text-yellow-400 text-sm mt-1">Duplicate — refunded 🪙 {coinsRefunded} coins</p>
          )}
        </div>

        {/* Single Big Card */}
        <div
          onClick={() => !revealed && setRevealed(true)}
          className={`relative w-64 aspect-[3/4] rounded-3xl border-4 overflow-hidden transition-all duration-700 select-none
            ${revealed
              ? `${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""} scale-105 cursor-default`
              : "border-white/20 bg-gradient-to-br from-gray-800 to-gray-900 cursor-pointer hover:scale-105 hover:border-white/40"
            }`}
          style={revealed ? { background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})` } : {}}
        >
          {!revealed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="text-7xl opacity-40">🎴</span>
              <p className="text-gray-400 text-sm font-medium animate-pulse">Tap to reveal</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-3">
              {quizlet.isDuplicate && (
                <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                  DUPE
                </div>
              )}
              <span className="text-6xl drop-shadow-lg">{quizlet.icon}</span>
              <p className="text-white font-bold text-xl text-center leading-tight drop-shadow">{quizlet.name}</p>
              <span className={`text-sm font-bold uppercase tracking-widest ${rarityInfo.text}`}>
                {rarityInfo.label}
              </span>
              <p className="text-white/70 text-xs text-center leading-relaxed">{quizlet.description}</p>
            </div>
          )}
        </div>

        {!revealed ? (
          <>
            <p className="text-gray-500 text-xs">Click the card to discover your Quizlet!</p>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              Skip →
            </button>
          </>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Awesome! ✨
          </button>
        )}
      </div>
    </div>
  );
}
