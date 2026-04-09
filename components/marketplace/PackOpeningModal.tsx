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
  if (results.length > 1) {
    return <BulkModal pack={pack} results={results} coinsRefunded={coinsRefunded} onClose={onClose} />;
  }

  return <SingleModal pack={pack} results={results} coinsRefunded={coinsRefunded} onClose={onClose} />;
}

function SingleModal({ pack, results, coinsRefunded, onClose }: Props) {
  const [revealed, setRevealed] = useState(false);

  const quizlet = results[0];
  if (!quizlet) return null;

  const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
  const isLegendary = quizlet.rarity === "legendary";
  const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">🎴 {pack.name} Opened!</h2>
          {coinsRefunded > 0 && (
            <p className="text-yellow-400 text-sm mt-1">Duplicate — refunded 🪙 {coinsRefunded} coins</p>
          )}
        </div>

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

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "secret", "unique", "impossible"];

const RARITY_STYLE: Record<string, { dot: string; label: string; text: string }> = {
  common:     { dot: "bg-gray-400",   label: "Common",     text: "text-gray-300" },
  uncommon:   { dot: "bg-green-400",  label: "Uncommon",   text: "text-green-400" },
  rare:       { dot: "bg-blue-400",   label: "Rare",       text: "text-blue-400" },
  epic:       { dot: "bg-purple-500", label: "Epic",       text: "text-purple-400" },
  legendary:  { dot: "bg-yellow-400", label: "Legendary",  text: "text-yellow-400" },
  secret:     { dot: "bg-red-500",    label: "Secret",     text: "text-red-400" },
  unique:     { dot: "bg-pink-400",   label: "Unique",     text: "text-pink-400" },
  impossible: { dot: "bg-rainbow",    label: "Impossible", text: "text-white" },
};

const CARD_THRESHOLD = 20;

function BulkModal({ pack, results, coinsRefunded, onClose }: Props) {
  const [revealed, setRevealed] = useState(false);

  const newCount = results.filter((r) => !r.isDuplicate).length;
  const dupeCount = results.filter((r) => r.isDuplicate).length;
  const useSummary = results.length > CARD_THRESHOLD;
  const cols = Math.min(results.length, 5);

  // Rarity breakdown (all results)
  const byRarity: Record<string, { total: number; new: number }> = {};
  for (const r of results) {
    if (!byRarity[r.rarity]) byRarity[r.rarity] = { total: 0, new: 0 };
    byRarity[r.rarity].total++;
    if (!r.isDuplicate) byRarity[r.rarity].new++;
  }
  const rarityRows = RARITY_ORDER.filter((r) => byRarity[r]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="flex flex-col items-center gap-5 w-full max-w-2xl my-auto py-4">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">🎴 {results.length}× {pack.name} Opened!</h2>
          {(revealed || useSummary) && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-sm">
              <span className="text-green-400">✦ {newCount} new</span>
              {dupeCount > 0 && <span className="text-gray-400">{dupeCount} duplicate{dupeCount > 1 ? "s" : ""}</span>}
              {coinsRefunded > 0 && <span className="text-yellow-400">🪙 +{coinsRefunded.toLocaleString()} refunded</span>}
            </div>
          )}
        </div>

        {useSummary ? (
          /* ── Summary view for large bulk opens ── */
          <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <span>Rarity</span>
              <span>Got · New</span>
            </div>
            {rarityRows.map((rarity) => {
              const { total, new: newN } = byRarity[rarity];
              const style = RARITY_STYLE[rarity] ?? RARITY_STYLE.common;
              return (
                <div key={rarity} className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                    <span className={`font-semibold text-sm ${style.text}`}>{style.label}</span>
                  </div>
                  <div className="text-sm text-right">
                    <span className="text-white font-bold">{total}</span>
                    <span className="text-gray-500 ml-2">· {newN} new</span>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between px-5 py-3 bg-white/5">
              <span className="text-white font-bold text-sm">Total</span>
              <div className="text-sm text-right">
                <span className="text-white font-bold">{results.length}</span>
                <span className="text-green-400 ml-2">· {newCount} new</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Card grid for smaller bulk opens ── */
          <div
            className="grid gap-2 w-full"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {results.map((quizlet, i) => {
              const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
              const isLegendary = quizlet.rarity === "legendary";
              const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
              return (
                <div
                  key={i}
                  className={`relative aspect-square rounded-2xl border-2 overflow-hidden transition-all duration-500
                    ${revealed
                      ? `${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""}`
                      : "border-white/20 bg-gradient-to-br from-gray-800 to-gray-900"
                    }`}
                  style={revealed ? { background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})` } : {}}
                >
                  {!revealed ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl opacity-30">🎴</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-1">
                      {quizlet.isDuplicate && (
                        <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
                          DUPE
                        </div>
                      )}
                      <span className="text-3xl drop-shadow">{quizlet.icon}</span>
                      <p className="text-white font-bold text-xs text-center leading-tight drop-shadow line-clamp-2">{quizlet.name}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wide ${rarityInfo.text}`}>
                        {rarityInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action button */}
        {!useSummary && !revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full max-w-xs py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Reveal All ✨
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full max-w-xs py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Awesome! ✨
          </button>
        )}
      </div>
    </div>
  );
}
