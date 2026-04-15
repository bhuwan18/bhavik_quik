"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { RARITY_COLORS } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";

type BidData = {
  id: string;
  bidder: { id: string; name: string | null; image: string | null };
  amount: number;
  isHeld: boolean;
  createdAt: string;
};

type ListingDetail = {
  id: string;
  quizlet: {
    id: string;
    name: string;
    rarity: string;
    icon: string;
    colorFrom: string;
    colorTo: string;
    description: string;
    sellValue: number;
  };
  seller: { id: string; name: string | null; image: string | null };
  startingPrice: number;
  buyNowPrice: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  bids: BidData[];
  isOwner: boolean;
};

export function ListingDetailModal({
  listingId,
  userId,
  userCoins,
  onClose,
  onAction,
}: {
  listingId: string;
  userId: string;
  userCoins: number;
  onClose: () => void;
  onAction: () => void;
}) {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/trading/listings/${listingId}`);
      if (!res.ok) { setError("Failed to load listing"); setLoading(false); return; }
      const data = await res.json();
      setListing(data);
      // Set default bid amount
      const highestBid = data.bids?.[0]?.amount ?? 0;
      const minNext = highestBid > 0 ? highestBid + 1 : data.startingPrice;
      setBidAmount(String(minNext));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const handleBid = async () => {
    const amount = parseInt(bidAmount);
    if (isNaN(amount) || amount < 1) { setError("Enter a valid bid amount"); return; }
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trading/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, amount }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Bid failed"); return; }
      setSuccess(`Bid of ${amount} coins placed!`);
      onAction();
      await fetchListing();
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!confirm(`Buy now for ${listing!.buyNowPrice} coins?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trading/buy-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Purchase failed"); return; }
      setSuccess(`You bought ${data.quizletName} for ${data.price} coins!`);
      onAction();
      await fetchListing();
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this listing?")) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trading/listings/${listingId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Cancel failed"); return; }
      setSuccess("Listing cancelled.");
      onAction();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-[var(--surface)] rounded-2xl p-8 text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-[var(--surface)] rounded-2xl p-8 text-red-400">{error ?? "Listing not found"}</div>
      </div>
    );
  }

  const { quizlet } = listing;
  const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
  const isLegendary = quizlet.rarity === "legendary";
  const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
  const isMystical = quizlet.rarity === "mystical";
  const isActive = listing.status === "active" && new Date(listing.expiresAt) > new Date();
  const highestBid = listing.bids[0]?.amount ?? 0;
  const minNextBid = highestBid > 0 ? highestBid + 1 : listing.startingPrice;
  const userIsHighestBidder = listing.bids[0]?.bidder?.id === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[var(--surface)] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Trade Listing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Quizlet visual */}
          <div className="flex justify-center">
            <div
              className={`border-2 rounded-2xl p-6 flex flex-col items-center ${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""} ${isMystical ? "mystical-card" : ""}`}
              style={{ background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})`, minWidth: 160 }}
            >
              <span className="text-5xl mb-2">{quizlet.icon}</span>
              <p className="text-white font-bold text-base">{quizlet.name}</p>
              <span className={`text-xs ${rarityInfo.text} font-medium`}>{rarityInfo.label}</span>
              <p className="text-white/60 text-xs mt-2 text-center">{quizlet.description}</p>
            </div>
          </div>

          {/* Seller + status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Listed by <span className="text-white font-semibold">{listing.seller.name ?? "Unknown"}</span>
            </span>
            {isActive ? (
              <CountdownTimer expiresAt={listing.expiresAt} />
            ) : (
              <span className="text-xs font-bold text-gray-500 uppercase">{listing.status}</span>
            )}
          </div>

          {/* Price info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Starting price</span>
              <span className="text-white font-bold">{listing.startingPrice} 🪙</span>
            </div>
            {listing.buyNowPrice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Buy-now price</span>
                <span className="text-green-400 font-bold">{listing.buyNowPrice} 🪙</span>
              </div>
            )}
            {highestBid > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Highest bid</span>
                <span className="text-yellow-400 font-bold">{highestBid} 🪙</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {isActive && !listing.isOwner && (
            <div className="space-y-3">
              {/* Bid */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Place bid <span className="text-gray-500">(min {minNextBid} 🪙)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min={minNextBid}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
                  />
                  <button
                    onClick={handleBid}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-bold rounded-xl transition-colors text-sm"
                  >
                    Bid
                  </button>
                </div>
                {userIsHighestBidder && (
                  <p className="text-xs text-green-400 mt-1">You are the highest bidder!</p>
                )}
              </div>

              {/* Buy now */}
              {listing.buyNowPrice && (
                <button
                  onClick={handleBuyNow}
                  disabled={actionLoading || userCoins < listing.buyNowPrice}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                >
                  Buy Now for {listing.buyNowPrice} 🪙
                </button>
              )}

              <p className="text-xs text-gray-500 text-center">Your balance: {userCoins} 🪙</p>
            </div>
          )}

          {/* Cancel button for owner */}
          {isActive && listing.isOwner && listing.bids.length === 0 && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold rounded-xl transition-colors"
            >
              Cancel Listing
            </button>
          )}

          {isActive && listing.isOwner && listing.bids.length > 0 && (
            <p className="text-xs text-gray-500 text-center">Cannot cancel — this listing has bids.</p>
          )}

          {/* Bid history */}
          {listing.bids.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-2">Bid History</h3>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {listing.bids.map((bid, i) => (
                  <div key={bid.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-yellow-400 text-xs">👑</span>}
                      <span className="text-white">{bid.bidder.name ?? "Unknown"}</span>
                    </div>
                    <span className="text-yellow-400 font-bold">{bid.amount} 🪙</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {success && <p className="text-green-400 text-sm text-center">{success}</p>}
        </div>
      </div>
    </div>
  );
}
