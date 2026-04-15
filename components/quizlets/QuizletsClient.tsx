"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { RARITY_COLORS } from "@/lib/utils";
import { QUIZLETS_DATA } from "@/lib/quizlets-data";
import { PACKS_DATA } from "@/lib/packs-data";
import type { Quizlet } from "@prisma/client";

type OwnedQuizlet = Quizlet & { obtainedAt: string };

type Props = {
  ownedQuizlets: OwnedQuizlet[];
  userCoins: number;
  allQuizlets: Quizlet[];
};

const HIDDEN_RARITIES = new Set(["secret", "unique", "impossible"]);
const MYSTICAL_PACK = "mystical";
const RARITIES = ["all", "common", "uncommon", "rare", "epic", "legendary", "mystical"];

const RARITY_DOT: Record<string, string> = {
  common: "bg-gray-400",
  uncommon: "bg-green-400",
  rare: "bg-blue-400",
  epic: "bg-purple-500",
  legendary: "bg-yellow-400",
  mystical: "bg-teal-400",
};

const RARITY_SORT_ORDER: Record<string, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
};

export default function QuizletsClient({ ownedQuizlets, userCoins: initialCoins, allQuizlets }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [quizlets, setQuizlets] = useState(ownedQuizlets);
  const [rarityFilter, setRarityFilter] = useState("all");
  const [selling, setSelling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<"mine" | "all">("mine");

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const ownedIds = useMemo(() => new Set(quizlets.map((q) => q.id)), [quizlets]);

  const regularQuizlets = useMemo(() => quizlets.filter((q) => !HIDDEN_RARITIES.has(q.rarity) && q.pack !== MYSTICAL_PACK), [quizlets]);
  const hiddenQuizlets = useMemo(() => quizlets.filter((q) => HIDDEN_RARITIES.has(q.rarity)), [quizlets]);
  const mysticalQuizlets = useMemo(() => quizlets.filter((q) => q.pack === MYSTICAL_PACK), [quizlets]);

  // Group regular owned quizlets by pack, following PACKS_DATA order
  const packSections = useMemo(() => {
    const byPack: Record<string, OwnedQuizlet[]> = {};
    for (const q of regularQuizlets) {
      if (!byPack[q.pack]) byPack[q.pack] = [];
      byPack[q.pack].push(q);
    }

    return PACKS_DATA
      .filter((p) => byPack[p.slug])
      .map((p) => {
        const all = byPack[p.slug];
        const filtered = rarityFilter === "all" ? all : all.filter((q) => q.rarity === rarityFilter);
        const sorted = [...filtered].sort(
          (a, b) => (RARITY_SORT_ORDER[a.rarity] ?? 9) - (RARITY_SORT_ORDER[b.rarity] ?? 9)
        );
        const totalInPack = QUIZLETS_DATA.filter((q) => q.pack === p.slug && !q.isHidden).length;
        return { pack: p, owned: all.length, total: totalInPack, cards: sorted };
      })
      .filter((s) => s.cards.length > 0 || rarityFilter === "all");
  }, [regularQuizlets, rarityFilter]);

  // All mystical quizlets for dex view
  const dexMysticalAll = useMemo(() => allQuizlets.filter((q) => q.pack === MYSTICAL_PACK), [allQuizlets]);

  // Group all (non-hidden, non-mystical) quizlets by pack for dex view
  const dexPackSections = useMemo(() => {
    const byPack: Record<string, Quizlet[]> = {};
    for (const q of allQuizlets) {
      if (q.pack === MYSTICAL_PACK) continue;
      if (!byPack[q.pack]) byPack[q.pack] = [];
      byPack[q.pack].push(q);
    }

    return PACKS_DATA
      .filter((p) => byPack[p.slug])
      .map((p) => {
        const all = byPack[p.slug];
        const filtered = rarityFilter === "all" ? all : all.filter((q) => q.rarity === rarityFilter);
        const ownedCount = all.filter((q) => ownedIds.has(q.id)).length;
        return { pack: p, owned: ownedCount, total: all.length, cards: filtered };
      })
      .filter((s) => s.cards.length > 0);
  }, [allQuizlets, rarityFilter, ownedIds]);

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
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const QuizletCard = ({ quizlet }: { quizlet: OwnedQuizlet }) => {
    const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
    const isLegendary = quizlet.rarity === "legendary";
    const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
    const isMystical = quizlet.rarity === "mystical";
    return (
      <div
        className={`relative border-2 rounded-2xl overflow-hidden ${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""} ${isMystical ? "mystical-card" : ""}`}
        style={{ background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})` }}
      >
        <div className="p-4 flex flex-col items-center text-center">
          <span className="text-3xl mb-2">{quizlet.icon}</span>
          <p className="text-white font-bold text-sm leading-tight mb-1">{quizlet.name}</p>
          <span className={`text-xs ${rarityInfo.text} font-medium mb-3`}>{rarityInfo.label}</span>
          <p className="text-white/60 text-xs mb-4 line-clamp-2">{quizlet.description}</p>
          <div className="w-full flex gap-1.5">
            <button
              onClick={() => handleSell(quizlet)}
              disabled={selling === quizlet.id}
              className="flex-1 py-1.5 text-xs bg-black/30 hover:bg-black/50 text-white/80 rounded-lg transition-colors"
            >
              Sell 🪙 {quizlet.sellValue}
            </button>
            {quizlet.pack !== "mystical" && (
              <Link
                href="/trading"
                className="py-1.5 px-2 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors"
                title="List for Trade"
              >
                Trade
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DexCard = ({ quizlet }: { quizlet: Quizlet }) => {
    const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
    const owned = ownedIds.has(quizlet.id);
    const isLegendary = quizlet.rarity === "legendary";
    const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
    const isMystical = quizlet.rarity === "mystical";
    return (
      <div
        className={`relative border-2 rounded-2xl overflow-hidden transition-all ${rarityInfo.border} ${owned ? rarityInfo.glow : "opacity-50 grayscale"} ${owned && isLegendary ? "legendary-card" : ""} ${owned && isRainbow ? "rainbow-card" : ""} ${owned && isMystical ? "mystical-card" : ""}`}
        style={{
          background: owned
            ? `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})`
            : "linear-gradient(135deg, #1a1a2e, #0f0f1a)",
        }}
      >
        {owned && (
          <div className="absolute top-2 right-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">
            ✓
          </div>
        )}
        <div className="p-4 flex flex-col items-center text-center">
          <span className="text-3xl mb-2">{owned ? quizlet.icon : "❓"}</span>
          <p className="text-white font-bold text-sm leading-tight mb-1">
            {owned ? quizlet.name : "???"}
          </p>
          <span className={`text-xs font-medium ${rarityInfo.text}`}>{rarityInfo.label}</span>
        </div>
      </div>
    );
  };

  const hasAnyVisible = packSections.some((s) => s.cards.length > 0) || hiddenQuizlets.length > 0 || mysticalQuizlets.length > 0;
  const totalOwned = allQuizlets.filter((q) => ownedIds.has(q.id)).length;

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-6xl mx-auto">
      {toast && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-6 z-50 bg-green-500/90 text-white px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Quizlets</h1>
          <p className="text-gray-400 mt-1">
            {totalOwned} / {allQuizlets.length} collected
          </p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-xl">
          <span>🪙</span>
          <span className="font-bold text-yellow-400">{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView("mine")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            view === "mine"
              ? "bg-amber-500 text-black"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          🎴 My Collection
        </button>
        <button
          onClick={() => setView("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            view === "all"
              ? "bg-amber-500 text-black"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          📖 All Quizlets
        </button>
      </div>

      {/* Rarity Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
        {RARITIES.filter((r) => r !== "all").map((r) => {
          const info = RARITY_COLORS[r];
          return (
            <span key={r} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full shrink-0 ${RARITY_DOT[r]}`} />
              {info.label}{r === "mystical" ? " ✨" : ""}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-2 h-2 rounded-full shrink-0 bg-gray-700" />
          Secret / Unique / Impossible hidden
        </span>
      </div>

      {/* Rarity Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        {RARITIES.map((r) => {
          const info = r !== "all" ? RARITY_COLORS[r] : null;
          return (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                rarityFilter === r ? "bg-amber-500 text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {info ? <span className={info.text}>{info.label}</span> : "All Rarities"}
            </button>
          );
        })}
      </div>

      {/* ── MY COLLECTION VIEW ── */}
      {view === "mine" && (
        <>
          {!hasAnyVisible && (
            <div className="text-center py-20 text-gray-500">
              <p className="text-5xl mb-3">🎴</p>
              <p className="text-lg">No quizlets here yet. Visit the Marketplace to open packs!</p>
            </div>
          )}

          {packSections.map(({ pack, owned, total, cards }) => (
            cards.length > 0 && (
              <div key={pack.slug} className="mb-10">
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${pack.colorFrom}33, ${pack.colorTo}22)` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pack.icon}</span>
                    <div>
                      <h2 className="text-base font-bold text-white">{pack.name}</h2>
                      {pack.isFestival && (
                        <span className="text-xs text-yellow-400 font-medium">Festival Pack</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white">{owned}</span>
                    <span className="text-sm text-gray-400"> / {total} owned</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {cards.map((quizlet) => (
                    <QuizletCard key={quizlet.id} quizlet={quizlet} />
                  ))}
                </div>
              </div>
            )
          ))}

          {rarityFilter !== "all" && packSections.every((s) => s.cards.length === 0) && hiddenQuizlets.length === 0 && quizlets.length > 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">🎴</p>
              <p>No quizlets matching this rarity filter.</p>
            </div>
          )}

          {mysticalQuizlets.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-teal-500/20" />
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h2 className="text-lg font-bold text-teal-300">Mystical Achievements</h2>
                  <span className="text-xs bg-teal-500/20 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded-full font-semibold">
                    {mysticalQuizlets.length}
                  </span>
                </div>
                <div className="h-px flex-1 bg-teal-500/20" />
              </div>
              <p className="text-sm text-gray-500 mb-5 text-center">
                Earned by mastering specific categories or completing rare challenges.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {mysticalQuizlets.map((quizlet) => (
                  <QuizletCard key={quizlet.id} quizlet={quizlet} />
                ))}
              </div>
            </div>
          )}

          {hiddenQuizlets.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔮</span>
                  <h2 className="text-lg font-bold text-violet-300">
                    Hidden
                  </h2>
                  <span className="text-xs bg-white/10 border border-white/15 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                    {hiddenQuizlets.length}
                  </span>
                </div>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <p className="text-sm text-gray-500 mb-5 text-center">
                Ultra-rare quizlets — Secrets, Uniques, and the Impossible Legend.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {hiddenQuizlets.map((quizlet) => (
                  <QuizletCard key={quizlet.id} quizlet={quizlet} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ALL QUIZLETS (DEX) VIEW ── */}
      {view === "all" && (
        <>
          {dexPackSections.map(({ pack, owned, total, cards }) => (
            <div key={pack.slug} className="mb-10">
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl mb-4 border border-white/10"
                style={{ background: `linear-gradient(135deg, ${pack.colorFrom}33, ${pack.colorTo}22)` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pack.icon}</span>
                  <div>
                    <h2 className="text-base font-bold text-white">{pack.name}</h2>
                    {pack.isFestival && (
                      <span className="text-xs text-yellow-400 font-medium">Festival Pack</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-white">{owned}</span>
                  <span className="text-sm text-gray-400"> / {total} owned</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {cards.map((quizlet) => (
                  <DexCard key={quizlet.id} quizlet={quizlet} />
                ))}
              </div>
            </div>
          ))}

          {dexMysticalAll.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-teal-500/20" />
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h2 className="text-base font-bold text-teal-300">Mystical Achievements</h2>
                  <span className="text-xs bg-teal-500/20 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded-full font-semibold">
                    {dexMysticalAll.filter((q) => ownedIds.has(q.id)).length} / {dexMysticalAll.length}
                  </span>
                </div>
                <div className="h-px flex-1 bg-teal-500/20" />
              </div>
              <p className="text-sm text-gray-500 mb-5 text-center">
                Earned through mastery — not purchasable in packs.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {dexMysticalAll.map((quizlet) => (
                  <DexCard key={quizlet.id} quizlet={quizlet} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
