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
  const [revealed, setRevealed] = useState<boolean[]>(results.map(() => false));
  const [allRevealed, setAllRevealed] = useState(false);

  const revealCard = (idx: number) => {
    const next = [...revealed];
    next[idx] = true;
    setRevealed(next);
    if (next.every(Boolean)) setAllRevealed(true);
  };

  const revealAll = () => {
    setRevealed(results.map(() => true));
    setAllRevealed(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d0d1a] border border-white/10 rounded-3xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">🎴 {pack.name} Opened!</h2>
          {coinsRefunded > 0 && (
            <p className="text-yellow-400 text-sm mt-1">
              Got duplicates — refunded 🪙 {coinsRefunded} coins
            </p>
          )}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {results.map((quizlet, idx) => {
            const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
            const isLegendary = quizlet.rarity === "legendary";
            const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);

            return (
              <div
                key={quizlet.id + idx}
                onClick={() => revealCard(idx)}
                className={`relative aspect-[3/4] rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-500 ${
                  revealed[idx]
                    ? `${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""}`
                    : "border-white/20 bg-gradient-to-br from-gray-800 to-gray-900"
                }`}
                style={revealed[idx] ? {
                  background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})`,
                } : {}}
              >
                {!revealed[idx] ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl opacity-30">🎴</span>
                    <p className="text-xs text-gray-500 mt-2">Tap to reveal</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                    {quizlet.isDuplicate && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                        DUP
                      </div>
                    )}
                    <span className="text-4xl mb-2">{quizlet.icon}</span>
                    <p className="text-white font-bold text-sm text-center leading-tight">{quizlet.name}</p>
                    <span className={`text-xs font-medium mt-1 ${rarityInfo.text}`}>
                      {rarityInfo.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!allRevealed && (
            <button
              onClick={revealAll}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              Reveal All
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            {allRevealed ? "Awesome! ✨" : "Skip →"}
          </button>
        </div>
      </div>
    </div>
  );
}
