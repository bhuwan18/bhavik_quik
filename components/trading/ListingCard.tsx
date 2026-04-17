"use client";

import { RARITY_COLORS } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
}

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
  const light = isLightColor(quizlet.colorFrom);

  const displayPrice = listing.currentBid ?? listing.startingPrice;

  return (
    <button
      onClick={onClick}
      className={`relative border-2 rounded-2xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""} ${isMystical ? "mystical-card" : ""}`}
      style={{ background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})` }}
    >
      <div className="p-4 flex flex-col items-center text-center">
        <span className="text-3xl mb-2">{quizlet.icon}</span>
        <p className={`font-bold text-sm leading-tight mb-0.5 ${light ? "text-gray-900" : "text-white"}`}>{quizlet.name}</p>
        <span className={`text-xs font-semibold mb-3 rounded-full px-2 py-0.5 ${light ? "bg-black/15 text-gray-800" : `bg-black/30 ${rarityInfo.text}`}`}>{rarityInfo.label}</span>

        {/* Price info */}
        <div className={`w-full space-y-1.5 rounded-xl px-2 py-1.5 ${light ? "bg-black/10" : "bg-black/25"}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={light ? "text-gray-700" : "text-white/70"}>{listing.currentBid ? "Current bid" : "Starting"}</span>
            <span className={`font-bold ${light ? "text-amber-700" : "text-yellow-400"}`}>{displayPrice} 🪙</span>
          </div>

          {listing.buyNowPrice && (
            <div className="flex items-center justify-between text-xs">
              <span className={light ? "text-gray-700" : "text-white/70"}>Buy now</span>
              <span className={`font-bold ${light ? "text-green-700" : "text-green-400"}`}>{listing.buyNowPrice} 🪙</span>
            </div>
          )}

          <div className={`flex items-center justify-between text-xs pt-1 border-t ${light ? "border-black/10" : "border-white/10"}`}>
            <span className={light ? "text-gray-600" : "text-white/50"}>
              {listing.bidCount} bid{listing.bidCount !== 1 ? "s" : ""}
            </span>
            <CountdownTimer expiresAt={listing.expiresAt} />
          </div>
        </div>
      </div>

      {/* Seller tag */}
      <div className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[80px] ${light ? "bg-black/15 text-gray-700" : "bg-black/40 text-white/70"}`}>
        {listing.seller.name ?? "Unknown"}
      </div>
    </button>
  );
}
