"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { ListingCard, type ListingData } from "./ListingCard";
import { ListingDetailModal } from "./ListingDetailModal";
import { CreateListingModal } from "./CreateListingModal";

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

type MyListing = ListingData & { status: string };
type MyBid = {
  id: string;
  amount: number;
  isHeld: boolean;
  listing: ListingData & { status: string };
};

type Tab = "browse" | "my-listings" | "my-bids";

const TABS: { key: Tab; label: string }[] = [
  { key: "browse", label: "Browse" },
  { key: "my-listings", label: "My Listings" },
  { key: "my-bids", label: "My Bids" },
];

const RARITIES = ["all", "common", "uncommon", "rare", "epic", "legendary", "secret", "unique", "impossible"];

export default function TradingClient({
  initialListings,
  initialTotal,
  myListings,
  myBids,
  ownedQuizlets,
  userCoins: initialCoins,
  userId,
}: {
  initialListings: ListingData[];
  initialTotal: number;
  myListings: MyListing[];
  myBids: MyBid[];
  ownedQuizlets: OwnedQuizlet[];
  userCoins: number;
  userId: string;
}) {
  const [tab, setTab] = useState<Tab>("browse");
  const [listings, setListings] = useState(initialListings);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [rarity, setRarity] = useState("all");
  const [search, setSearch] = useState("");
  const [coins, setCoins] = useState(initialCoins);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async (p: number, r: string, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (r !== "all") params.set("rarity", r);
      if (s.trim()) params.set("search", s.trim());
      const res = await fetch(`/api/trading/listings?${params}`);
      const data = await res.json();
      setListings(data.listings);
      setTotal(data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchListings(page, rarity, search);
    // Refresh coins
    fetch("/api/user/stats").then((r) => r.json()).then((d) => {
      if (typeof d.coins === "number") setCoins(d.coins);
    }).catch(() => {});
  }, [fetchListings, page, rarity, search]);

  useEffect(() => {
    fetchListings(page, rarity, search);
  }, [fetchListings, page, rarity, search]);

  const totalPages = Math.ceil(total / 20);

  // Listed quizlet IDs (to exclude from create modal)
  const listedIds = new Set(myListings.filter((l) => l.status === "active").map((l) => l.quizlet.id));
  const availableForListing = ownedQuizlets.filter((q) => !listedIds.has(q.id));

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Post</h1>
          <p className="text-gray-400 mt-1">Buy and sell quizlets with other players</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/15 border border-yellow-500/30 px-4 py-2 rounded-xl">
            <span className="text-yellow-400 font-bold">{coins} 🪙</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> List
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === t.key ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === "browse" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search quizlets..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-white/30"
              />
            </div>
            <select
              value={rarity}
              onChange={(e) => { setRarity(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-white/30 appearance-none cursor-pointer"
            >
              {RARITIES.map((r) => (
                <option key={r} value={r} className="bg-gray-900">
                  {r === "all" ? "All Rarities" : r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Listings grid */}
          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No active listings found.{" "}
              <button onClick={() => setShowCreateModal(true)} className="text-rose-400 underline">
                Be the first to list!
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} onClick={() => setSelectedListingId(l.id)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    p === page ? "bg-white/15 text-white" : "text-gray-500 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Listings tab */}
      {tab === "my-listings" && (
        <>
          {myListings.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              You have no listings yet.{" "}
              <button onClick={() => setShowCreateModal(true)} className="text-rose-400 underline">
                Create one!
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myListings.map((l) => (
                <div key={l.id} className="relative">
                  <ListingCard listing={l} onClick={() => setSelectedListingId(l.id)} />
                  {l.status !== "active" && (
                    <div
                      className="absolute inset-0 bg-black/75 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer"
                      onClick={() => setSelectedListingId(l.id)}
                    >
                      <span className="text-3xl">{l.quizlet.icon}</span>
                      <p className="text-white text-xs font-semibold text-center px-2 leading-tight">{l.quizlet.name}</p>
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                        l.status === "sold" ? "bg-green-500/25 text-green-300 border-green-500/40" :
                        l.status === "expired" ? "bg-gray-500/25 text-gray-300 border-gray-500/40" :
                        "bg-red-500/25 text-red-300 border-red-500/40"
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Bids tab */}
      {tab === "my-bids" && (
        <>
          {myBids.length === 0 ? (
            <div className="text-center text-gray-500 py-12">You have no active bids.</div>
          ) : (
            <div className="space-y-3">
              {myBids.map((b) => {
                const isWinning = b.isHeld;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedListingId(b.listing.id)}
                    className="w-full flex items-center gap-4 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-colors text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${b.listing.quizlet.colorFrom}, ${b.listing.quizlet.colorTo})` }}
                    >
                      {b.listing.quizlet.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{b.listing.quizlet.name}</p>
                      <p className="text-gray-400 text-xs">Your bid: {b.amount} 🪙</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {b.listing.status === "active" ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          isWinning ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {isWinning ? "Winning" : "Outbid"}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-500 uppercase">{b.listing.status}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selectedListingId && (
        <ListingDetailModal
          listingId={selectedListingId}
          userId={userId}
          userCoins={coins}
          onClose={() => setSelectedListingId(null)}
          onAction={refresh}
        />
      )}

      {showCreateModal && (
        <CreateListingModal
          quizlets={availableForListing}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
