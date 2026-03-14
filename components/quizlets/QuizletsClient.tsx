"use client";

import { useState, useMemo } from "react";
import { RARITY_COLORS } from "@/lib/utils";
import type { Quizlet } from "@prisma/client";

type OwnedQuizlet = Quizlet & { obtainedAt: string };

type Props = {
  ownedQuizlets: OwnedQuizlet[];
  userCoins: number;
  totalPublicQuizlets: number;
};

const HIDDEN_RARITIES = new Set(["secret", "unique", "impossible"]);
const RARITIES = ["all", "common", "uncommon", "rare", "epic", "legendary"];

export default function QuizletsClient({ ownedQuizlets, userCoins: initialCoins, totalPublicQuizlets }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [quizlets, setQuizlets] = useState(ownedQuizlets);
  const [rarityFilter, setRarityFilter] = useState("all");
  const [packFilter, setPackFilter] = useState("all");
  const [selling, setSelling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Separate hidden (secret/unique/impossible) from regular
  const regularQuizlets = useMemo(() => quizlets.filter((q) => !HIDDEN_RARITIES.has(q.rarity)), [quizlets]);
  const hiddenQuizlets = useMemo(() => quizlets.filter((q) => HIDDEN_RARITIES.has(q.rarity)), [quizlets]);

  const packs = useMemo(() => ["all", ...Array.from(new Set(regularQuizlets.map((q) => q.pack)))], [regularQuizlets]);
  const filtered = useMemo(() => regularQuizlets.filter((q) => {
    if (rarityFilter !== "all" && q.rarity !== rarityFilter) return false;
    if (packFilter !== "all" && q.pack !== packFilter) return false;
    return true;
  }), [regularQuizlets, rarityFilter, packFilter]);

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

  const QuizletCard = ({ quizlet }: { quizlet: OwnedQuizlet }) => {
    const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
    const isLegendary = quizlet.rarity === "legendary";
    const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
    return (
      <div
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
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
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

      {/* Rarity Filters */}
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

      {/* Regular Grid */}
      {filtered.length === 0 && hiddenQuizlets.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-3">🎴</p>
          <p className="text-lg">No quizlets here yet. Visit the Marketplace to open packs!</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🎴</p>
          <p>No quizlets matching this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-10">
          {filtered.map((quizlet) => <QuizletCard key={quizlet.id} quizlet={quizlet} />)}
        </div>
      )}

      {/* Hidden Section */}
      {hiddenQuizlets.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <div className="flex items-center gap-2">
              <span className="text-xl">🔮</span>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Hidden
              </h2>
              <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                {hiddenQuizlets.length}
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          </div>
          <p className="text-sm text-gray-500 mb-5 text-center">
            Ultra-rare quizlets — Secrets, Uniques, and the Impossible Legend.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {hiddenQuizlets.map((quizlet) => <QuizletCard key={quizlet.id} quizlet={quizlet} />)}
          </div>
        </div>
      )}
    </div>
  );
}
