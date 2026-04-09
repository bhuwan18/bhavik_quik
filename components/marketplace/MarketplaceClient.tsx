"use client";

import { useState } from "react";
import type { Pack } from "@prisma/client";
import type { Festival } from "@/lib/festivals";
import { QUIZLETS_DATA } from "@/lib/quizlets-data";
import PackOpeningModal from "./PackOpeningModal";

type Props = {
  packs: Pack[];
  userCoins: number;
  festival: Festival | null;
};

const DROP_WEIGHTS: Record<string, number> = {
  common: 6000,
  uncommon: 2500,
  rare: 1000,
  epic: 400,
  legendary: 100,
  secret: 10,
};

const RARITY_DOT: Record<string, string> = {
  common: "bg-gray-400",
  uncommon: "bg-green-400",
  rare: "bg-blue-400",
  epic: "bg-purple-500",
  legendary: "bg-yellow-400",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const MAX_BULK = 20;

function computeDropRates(packSlug: string): { rarity: string; pct: number }[] {
  const pool = QUIZLETS_DATA.filter((q) => q.pack === packSlug && !q.isHidden);
  const totalWeight = pool.reduce((sum, q) => sum + (DROP_WEIGHTS[q.rarity] ?? 0), 0);
  if (totalWeight === 0) return [];

  const byRarity: Record<string, number> = {};
  for (const q of pool) {
    byRarity[q.rarity] = (byRarity[q.rarity] ?? 0) + (DROP_WEIGHTS[q.rarity] ?? 0);
  }

  const order = ["common", "uncommon", "rare", "epic", "legendary"];
  return order
    .filter((r) => byRarity[r])
    .map((r) => ({ rarity: r, pct: (byRarity[r] / totalWeight) * 100 }));
}

export default function MarketplaceClient({ packs, userCoins: initialCoins, festival }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [openingPack, setOpeningPack] = useState<Pack | null>(null);
  const [results, setResults] = useState<null | { results: (Record<string, unknown> & { isDuplicate: boolean })[]; coinsSpent: number; coinsRefunded: number }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (pack: Pack, quantity: number = 1) => {
    const totalCost = pack.cost * quantity;
    if (coins < totalCost) {
      setError(`Not enough coins! You need ${(totalCost - coins).toLocaleString()} more.`);
      return;
    }
    setLoading(true);
    setError(null);
    setOpeningPack(pack);
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSlug: pack.slug, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to open pack");
        setOpeningPack(null);
      } else {
        setCoins((c) => c - data.coinsSpent + data.coinsRefunded);
        setResults(data);
      }
    } catch {
      setError("Network error. Please try again.");
      setOpeningPack(null);
    } finally {
      setLoading(false);
    }
  };

  const regularPacks = packs.filter((p) => !p.isFestival);
  const festivalPacks = packs.filter((p) => p.isFestival);

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          <p className="text-gray-400 mt-1">Spend your coins to open packs and collect Quizlets</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 px-5 py-3 rounded-xl">
          <span className="text-2xl">🪙</span>
          <span className="text-xl font-bold text-yellow-400">{coins.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Festival Packs */}
      {festivalPacks.length > 0 && festival && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{festival.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{festival.name} — Limited Time!</h2>
              <p className="text-yellow-500 text-sm">These packs disappear at midnight tonight</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {festivalPacks.map((pack) => (
              <PackCard key={pack.id} pack={pack} coins={coins} onOpen={handleOpen} loading={loading} isFestival />
            ))}
          </div>
        </div>
      )}

      {/* Regular Packs */}
      <h2 className="text-xl font-bold text-white mb-4">All Packs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {regularPacks.map((pack) => (
          <PackCard key={pack.id} pack={pack} coins={coins} onOpen={handleOpen} loading={loading} />
        ))}
      </div>

      {/* Coin tip */}
      <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl text-gray-500 text-sm text-center">
        💡 Earn coins by answering quiz questions correctly. Each correct answer = 5 coins!
      </div>

      {/* Pack Opening Modal */}
      {openingPack && results && (
        <PackOpeningModal
          pack={openingPack}
          results={results.results as Parameters<typeof PackOpeningModal>[0]["results"]}
          coinsRefunded={results.coinsRefunded}
          onClose={() => { setOpeningPack(null); setResults(null); }}
        />
      )}
    </div>
  );
}

function PackCard({
  pack, coins, onOpen, loading, isFestival,
}: {
  pack: Pack;
  coins: number;
  onOpen: (pack: Pack, quantity: number) => void;
  loading: boolean;
  isFestival?: boolean;
}) {
  const canAfford = (n: number) => coins >= pack.cost * n;
  const maxCount = Math.min(Math.floor(coins / pack.cost), MAX_BULK);
  const dropRates = computeDropRates(pack.slug);
  const isRainbow = pack.slug === "rainbow-pack";

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden flex flex-col ${
        isFestival ? "border-yellow-500/50" : "border-white/10"
      }`}
      style={{ background: `linear-gradient(135deg, ${pack.colorFrom}, ${pack.colorTo})` }}
    >
      {isFestival && (
        <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
          LIMITED
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="text-4xl mb-3">{pack.icon}</div>
        <h3 className="text-xl font-bold text-white mb-1">{pack.name}</h3>
        <p className="text-white/70 text-sm mb-4">{pack.description}</p>

        {/* Drop Rates */}
        {dropRates.length > 0 && (
          <div className="mb-4">
            <p className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wide">Drop Rates</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {dropRates.map(({ rarity, pct }) => (
                <div key={rarity} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RARITY_DOT[rarity]}`} />
                  <span className="text-xs text-white/60">
                    {RARITY_LABEL[rarity]} {pct < 5 ? pct.toFixed(1) : Math.round(pct)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {isRainbow && (
                <span className="text-xs text-white/40">✦ 0.001% Impossible</span>
              )}
              <span className="text-xs text-white/40">✦ 0.01% Unique (any pack)</span>
            </div>
          </div>
        )}

        {/* Buttons pinned to bottom */}
        <div className="mt-auto">
          {/* Single open button */}
          <button
            onClick={() => onOpen(pack, 1)}
            disabled={loading || !canAfford(1)}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
              canAfford(1)
                ? "bg-white text-gray-900 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-white/20 text-white/50 cursor-not-allowed"
            }`}
          >
            {canAfford(1) ? (
              <>🪙 {pack.cost.toLocaleString()} — Open ×1</>
            ) : (
              <>Need {(pack.cost - coins).toLocaleString()} more coins</>
            )}
          </button>

          {/* Bulk open buttons — only shown when user can afford at least 1 */}
          {canAfford(1) && (
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {/* ×5 */}
              <button
                onClick={() => onOpen(pack, 5)}
                disabled={loading || !canAfford(5)}
                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                  canAfford(5)
                    ? "bg-white/20 text-white hover:bg-white/30 active:scale-[0.97]"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                ×5
                <span className="block text-[10px] font-normal opacity-70">
                  {(pack.cost * 5).toLocaleString()}🪙
                </span>
              </button>

              {/* ×10 */}
              <button
                onClick={() => onOpen(pack, 10)}
                disabled={loading || !canAfford(10)}
                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                  canAfford(10)
                    ? "bg-white/20 text-white hover:bg-white/30 active:scale-[0.97]"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                ×10
                <span className="block text-[10px] font-normal opacity-70">
                  {(pack.cost * 10).toLocaleString()}🪙
                </span>
              </button>

              {/* Max */}
              <button
                onClick={() => onOpen(pack, maxCount)}
                disabled={loading || maxCount < 2}
                className={`py-2 rounded-lg font-bold text-xs transition-all ${
                  maxCount >= 2
                    ? "bg-white/20 text-white hover:bg-white/30 active:scale-[0.97]"
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                Max
                <span className="block text-[10px] font-normal opacity-70">
                  {maxCount >= 2 ? `×${maxCount}` : "×1"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
