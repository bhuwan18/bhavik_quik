"use client";

import { useState } from "react";
import type { Pack } from "@prisma/client";
import type { Festival } from "@/lib/festivals";
import PackOpeningModal from "./PackOpeningModal";

type Props = {
  packs: Pack[];
  userCoins: number;
  festival: Festival | null;
};

export default function MarketplaceClient({ packs, userCoins: initialCoins, festival }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [openingPack, setOpeningPack] = useState<Pack | null>(null);
  const [results, setResults] = useState<null | { results: (Record<string, unknown> & { isDuplicate: boolean })[]; coinsSpent: number; coinsRefunded: number }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (pack: Pack) => {
    if (coins < pack.cost) {
      setError("Not enough coins! Answer more quizzes to earn coins.");
      return;
    }
    setLoading(true);
    setError(null);
    setOpeningPack(pack);
    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSlug: pack.slug }),
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
    <div className="p-8 max-w-6xl mx-auto">
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
  onOpen: (pack: Pack) => void;
  loading: boolean;
  isFestival?: boolean;
}) {
  const canAfford = coins >= pack.cost;
  return (
    <div
      className={`relative rounded-2xl border overflow-hidden ${
        isFestival ? "border-yellow-500/50" : "border-white/10"
      }`}
      style={{ background: `linear-gradient(135deg, ${pack.colorFrom}, ${pack.colorTo})` }}
    >
      {isFestival && (
        <div className="absolute top-3 right-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
          LIMITED
        </div>
      )}
      <div className="p-6">
        <div className="text-4xl mb-3">{pack.icon}</div>
        <h3 className="text-xl font-bold text-white mb-1">{pack.name}</h3>
        <p className="text-white/70 text-sm mb-5">{pack.description}</p>

        {/* Rarity preview */}
        <div className="flex gap-1 mb-5">
          {["common", "uncommon", "rare", "epic", "legendary"].map((r) => (
            <div key={r} className={`h-1.5 flex-1 rounded-full ${
              r === "common" ? "bg-gray-400" :
              r === "uncommon" ? "bg-green-400" :
              r === "rare" ? "bg-blue-400" :
              r === "epic" ? "bg-purple-500" : "bg-yellow-400"
            } opacity-70`} />
          ))}
        </div>

        <button
          onClick={() => onOpen(pack)}
          disabled={loading || !canAfford}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
            canAfford
              ? "bg-white text-gray-900 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
              : "bg-white/20 text-white/50 cursor-not-allowed"
          }`}
        >
          {canAfford ? (
            <>🪙 {pack.cost.toLocaleString()} coins — Open Pack</>
          ) : (
            <>Need {(pack.cost - coins).toLocaleString()} more coins</>
          )}
        </button>
      </div>
    </div>
  );
}
