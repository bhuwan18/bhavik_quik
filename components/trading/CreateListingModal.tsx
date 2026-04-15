"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { RARITY_COLORS, SELL_VALUES } from "@/lib/utils";
import { TRADING_CONFIG } from "@/lib/trading";

type OwnedQuizlet = {
  id: string;
  name: string;
  rarity: string;
  pack: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  sellValue: number;
};

export function CreateListingModal({
  quizlets,
  onClose,
  onCreated,
  preselectedQuizletId,
}: {
  quizlets: OwnedQuizlet[];
  onClose: () => void;
  onCreated: () => void;
  preselectedQuizletId?: string;
}) {
  const tradeable = quizlets.filter(
    (q) => !TRADING_CONFIG.BLOCKED_PACKS.includes(q.pack),
  );

  const [selectedId, setSelectedId] = useState(preselectedQuizletId ?? "");
  const [startingPrice, setStartingPrice] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = tradeable.find((q) => q.id === selectedId);
  const minPrice = selected ? SELL_VALUES[selected.rarity] ?? selected.sellValue : 0;

  const handleSubmit = async () => {
    if (!selectedId) { setError("Select a quizlet"); return; }
    const sp = parseInt(startingPrice);
    const bnp = buyNowPrice ? parseInt(buyNowPrice) : null;

    if (isNaN(sp) || sp < minPrice) { setError(`Minimum starting price is ${minPrice} coins`); return; }
    if (bnp !== null && (isNaN(bnp) || bnp <= sp)) { setError("Buy-now price must be higher than starting price"); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/trading/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizletId: selectedId, startingPrice: sp, buyNowPrice: bnp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create listing"); return; }
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[var(--surface)] border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">List for Trade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quizlet selector */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Choose a quizlet</label>
            {tradeable.length === 0 ? (
              <p className="text-sm text-gray-500">No tradeable quizlets available.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {tradeable.map((q) => {
                  const ri = RARITY_COLORS[q.rarity] ?? RARITY_COLORS.common;
                  const isSelected = q.id === selectedId;
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setSelectedId(q.id); setStartingPrice(String(SELL_VALUES[q.rarity] ?? q.sellValue)); }}
                      className={`border-2 rounded-xl p-2 flex flex-col items-center transition-all ${isSelected ? "ring-2 ring-white " + ri.border : "border-white/10 opacity-60 hover:opacity-100"}`}
                      style={{ background: `linear-gradient(135deg, ${q.colorFrom}, ${q.colorTo})` }}
                    >
                      <span className="text-xl">{q.icon}</span>
                      <span className="text-[10px] text-white font-bold truncate w-full text-center mt-1">{q.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selected && (
            <>
              {/* Starting price */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Starting price <span className="text-gray-500">(min {minPrice} 🪙)</span>
                </label>
                <input
                  type="number"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  min={minPrice}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
                  placeholder={String(minPrice)}
                />
              </div>

              {/* Buy-now price (optional) */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Buy-now price <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="number"
                  value={buyNowPrice}
                  onChange={(e) => setBuyNowPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
                  placeholder="Leave empty for auction only"
                />
              </div>

              {/* Fee disclosure */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-400 space-y-1">
                <p>Duration: <span className="text-white">24 hours</span></p>
                <p>Seller fee: <span className="text-yellow-400">5%</span> of final sale price</p>
                {startingPrice && !isNaN(parseInt(startingPrice)) && (
                  <p>You receive at least: <span className="text-green-400">{Math.floor(parseInt(startingPrice) * 0.95)} 🪙</span></p>
                )}
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !selectedId}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            {loading ? "Listing..." : "List for Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}
