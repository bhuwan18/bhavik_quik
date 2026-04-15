"use client";

import { RARITY_COLORS } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";

export type ListingData = {
  id: string;
  quizlet: {
    id: string;
    name: string;
    rarity: string;
    icon: string;
    colorFrom: string;
    colorTo: string;
    description: string;
  };
  seller: { id: string; name: string | null; image: string | null };
  startingPrice: number;
  buyNowPrice: number | null;
  currentBid: number | null;
  bidCount: number;
  expiresAt: string;
  createdAt: string;
};

export function ListingCard({
  listing,
  onClick,
}: {
  listing: ListingData;
  onClick: () => void;
}) {
  const { quizlet } = listing;
  const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
  const isLegendary = quizlet.rarity === "legendary";
  const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
  const isMystical = quizlet.rarity === "mystical";

  const displayPrice = listing.currentBid ?? listing.startingPrice;

  return (
    <button
      onClick={onClick}
      className={`relative border-2 rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""} ${isMystical ? "mystical-card" : ""}`}
      style={{ background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})` }}
    >
      <div className="p-4 flex flex-col items-center text-center">
        <span className="text-3xl mb-2">{quizlet.icon}</span>
        <p className="text-white font-bold text-sm leading-tight mb-0.5">{quizlet.name}</p>
        <span className={`text-xs ${rarityInfo.text} font-medium mb-3`}>{rarityInfo.label}</span>

        {/* Price info */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">{listing.currentBid ? "Current bid" : "Starting"}</span>
            <span className="text-yellow-400 font-bold">{displayPrice} 🪙</span>
          </div>

          {listing.buyNowPrice && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Buy now</span>
              <span className="text-green-400 font-bold">{listing.buyNowPrice} 🪙</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
            <span className="text-white/50">
              {listing.bidCount} bid{listing.bidCount !== 1 ? "s" : ""}
            </span>
            <CountdownTimer expiresAt={listing.expiresAt} />
          </div>
        </div>
      </div>

      {/* Seller tag */}
      <div className="absolute top-2 right-2 text-[10px] bg-black/40 text-white/70 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
        {listing.seller.name ?? "Unknown"}
      </div>
    </button>
  );
}
