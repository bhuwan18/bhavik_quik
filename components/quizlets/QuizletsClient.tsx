"use client";

import { useState } from "react";
import { RARITY_COLORS } from "@/lib/utils";
import type { Quizlet } from "@prisma/client";

type OwnedQuizlet = Quizlet & { obtainedAt: string };

type Props = {
  ownedQuizlets: OwnedQuizlet[];
  userCoins: number;
  totalPublicQuizlets: number;
};

const RARITIES = ["all", "common", "uncommon", "rare", "epic", "legendary", "secret", "unique", "impossible"];

export default function QuizletsClient({ ownedQuizlets, userCoins: initialCoins, totalPublicQuizlets }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [quizlets, setQuizlets] = useState(ownedQuizlets);
  const [rarityFilter, setRarityFilter] = useState("all");
  const [packFilter, setPackFilter] = useState("all");
  const [selling, setSelling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const packs = ["all", ...Array.from(new Set(ownedQuizlets.map((q) => q.pack)))];
  const filtered = quizlets.filter((q) => {
    if (rarityFilter !== "all" && q.rarity !== rarityFilter) return false;
    if (packFilter !== "all" && q.pack !== packFilter) return false;
    return true;
  });

  const handleSell = async (quizlet: OwnedQuizlet) => {
    if (!confirm(`Sell ${quizlet.name} for ${quizlet.sellValue} coins?`)) return;
    setSelling(quizlet.id);
    try {
      const res = await fetch("/api/quizlets/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizletId: quizlet.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuizlets((prev) => prev.filter((q) => q.id !== quizlet.id));
        setCoins((c) => c + data.coinsEarned);
        showToast(`Sold ${quizlet.name} for 🪙 ${data.coinsEarned} coins`);
      }
    } finally {
      setSelling(null);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-500/90 text-white px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Quizlets</h1>
          <p className="text-gray-400 mt-1">
            {quizlets.length} owned • {totalPublicQuizlets} discoverable total
          </p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-xl">
          <span>🪙</span>
          <span className="font-bold text-yellow-400">{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {RARITIES.map((r) => {
          const info = r !== "all" ? RARITY_COLORS[r] : null;
          return (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                rarityFilter === r ? "bg-indigo-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {info ? <span className={info.text}>{info.label}</span> : "All Rarities"}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {packs.map((p) => (
          <button
            key={p}
            onClick={() => setPackFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
              packFilter === p ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {p === "all" ? "All Packs" : p.replace("-pack", "").replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-3">🎴</p>
          <p className="text-lg">No quizlets here yet. Visit the Marketplace to open packs!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((quizlet) => {
            const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
            const isLegendary = quizlet.rarity === "legendary";
            const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
            return (
              <div
                key={quizlet.id}
                className={`relative border-2 rounded-2xl overflow-hidden ${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""}`}
                style={{ background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})` }}
              >
                <div className="p-4 flex flex-col items-center text-center">
                  <span className="text-3xl mb-2">{quizlet.icon}</span>
                  <p className="text-white font-bold text-sm leading-tight mb-1">{quizlet.name}</p>
                  <span className={`text-xs ${rarityInfo.text} font-medium mb-3`}>{rarityInfo.label}</span>
                  <p className="text-white/60 text-xs mb-4 line-clamp-2">{quizlet.description}</p>
                  <button
                    onClick={() => handleSell(quizlet)}
                    disabled={selling === quizlet.id}
                    className="w-full py-1.5 text-xs bg-black/30 hover:bg-black/50 text-white/80 rounded-lg transition-colors"
                  >
                    Sell 🪙 {quizlet.sellValue}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
