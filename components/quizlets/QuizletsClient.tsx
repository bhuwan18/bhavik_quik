"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { RARITY_COLORS } from "@/lib/utils";
import { QUIZLETS_DATA } from "@/lib/quizlets-data";
import { PACKS_DATA } from "@/lib/packs-data";
import type { Quizlet } from "@prisma/client";

type QuizletWithCreator = Quizlet & { createdBy: { id: string; name: string | null } | null };
type OwnedQuizlet = QuizletWithCreator & { obtainedAt: string; quantity: number };

type Props = {
  ownedQuizlets: OwnedQuizlet[];
  userCoins: number;
  allQuizlets: QuizletWithCreator[];
  isBlacksmithActive: boolean;
  monthlySubmissions: { rarity: string; status: string }[];
};

/** Returns true if the hex color is perceptually light (luminance > 0.65) */
function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
}

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

const ALLOWED_PACKS = [
  { slug: "tech-pack", label: "Tech" },
  { slug: "sports-pack", label: "Sports" },
  { slug: "magic-pack", label: "Magic" },
  { slug: "hero-pack", label: "Hero" },
  { slug: "music-pack", label: "Music" },
  { slug: "science-pack", label: "Science" },
  { slug: "math-pack", label: "Math" },
  { slug: "english-pack", label: "English" },
];

const SUBMITTABLE_RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "secret", "unique", "impossible"];
const SUBMISSION_HIDDEN = new Set(["secret", "unique", "impossible"]);

type SubmissionRow = {
  id: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  rarity: string;
  pack: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

export default function QuizletsClient({ ownedQuizlets, userCoins: initialCoins, allQuizlets, isBlacksmithActive, monthlySubmissions }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [quizlets, setQuizlets] = useState(ownedQuizlets);
  const [rarityFilter, setRarityFilter] = useState("all");
  const [selling, setSelling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<"mine" | "all" | "create">("mine");

  // Create form state
  const [cName, setCName] = useState("");
  const [cIcon, setCIcon] = useState("");
  const [cColorFrom, setCColorFrom] = useState("#6366f1");
  const [cColorTo, setCColorTo] = useState("#8b5cf6");
  const [cRarity, setCRarity] = useState("common");
  const [cPack, setCPack] = useState("tech-pack");
  const [cDescription, setCDescription] = useState("");
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cError, setCError] = useState("");
  const [cSuccess, setCSuccess] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState<SubmissionRow[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const fetchUserSubmissions = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch("/api/quizlets/my-submissions");
      if (res.ok) {
        const data = await res.json();
        setUserSubmissions(data.submissions ?? []);
      }
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    if (view === "create" && isBlacksmithActive) fetchUserSubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isBlacksmithActive]);

  const handleCreateSubmit = async () => {
    setCError("");
    if (!cName.trim() || !cIcon.trim() || !cDescription.trim()) {
      setCError("Name, icon, and description are required.");
      return;
    }
    if ([...cIcon].length > 2) {
      setCError("Icon must be 1–2 emoji characters.");
      return;
    }
    const limitForRarity = SUBMISSION_HIDDEN.has(cRarity) ? 1 : 2;
    const usedThisMonth = monthlySubmissions.filter((s) => s.rarity === cRarity).length;
    if (usedThisMonth >= limitForRarity) {
      setCError(`Monthly limit reached for ${cRarity} (${limitForRarity}/month).`);
      return;
    }
    setCSubmitting(true);
    try {
      const res = await fetch("/api/quizlets/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName.trim(), icon: cIcon.trim(), colorFrom: cColorFrom, colorTo: cColorTo, rarity: cRarity, pack: cPack, description: cDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setCSuccess(true);
      setCName(""); setCIcon(""); setCDescription(""); setCColorFrom("#6366f1"); setCColorTo("#8b5cf6"); setCRarity("common"); setCPack("tech-pack");
      fetchUserSubmissions();
      setTimeout(() => setCSuccess(false), 5000);
    } catch (e: unknown) {
      setCError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setCSubmitting(false);
    }
  };

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
    const byPack: Record<string, QuizletWithCreator[]> = {};
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
    const confirmMsg = quizlet.quantity > 1
      ? `Sell one copy of ${quizlet.name} for ${quizlet.sellValue} coins? (${quizlet.quantity - 1} will remain)`
      : `Sell ${quizlet.name} for ${quizlet.sellValue} coins?`;
    if (!confirm(confirmMsg)) return;
    setSelling(quizlet.id);
    try {
      const res = await fetch("/api/quizlets/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizletId: quizlet.id }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.quantityRemaining > 0) {
          setQuizlets((prev) => prev.map((q) => q.id === quizlet.id ? { ...q, quantity: data.quantityRemaining } : q));
        } else {
          setQuizlets((prev) => prev.filter((q) => q.id !== quizlet.id));
        }
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
    const light = isLightColor(quizlet.colorFrom);
    return (
      <div
        className={`relative border-2 rounded-2xl overflow-hidden ${rarityInfo.border} ${rarityInfo.glow} ${isLegendary ? "legendary-card" : ""} ${isRainbow ? "rainbow-card" : ""} ${isMystical ? "mystical-card" : ""}`}
        style={{ background: `linear-gradient(135deg, ${quizlet.colorFrom}, ${quizlet.colorTo})` }}
      >
        {quizlet.quantity > 1 && (
          <span className="absolute top-1 right-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-full z-10">
            ×{quizlet.quantity}
          </span>
        )}
        <div className="p-4 flex flex-col items-center text-center">
          <span className="text-3xl mb-2">{quizlet.icon}</span>
          <p className={`font-bold text-sm leading-tight mb-1 ${light ? "text-gray-900" : "text-white"}`}>{quizlet.name}</p>
          <span className={`text-xs font-semibold mb-3 rounded-full px-2 py-0.5 ${light ? "bg-black/15 text-gray-800" : `bg-black/30 ${rarityInfo.text}`}`}>{rarityInfo.label}</span>
          <p className={`text-xs mb-2 line-clamp-2 ${light ? "text-gray-800" : "text-white/80"}`}>{quizlet.description}</p>
          {quizlet.createdBy && (
            <p className="text-xs text-amber-400/80 font-medium mb-2">🔨 by {quizlet.createdBy.name ?? "Blacksmith"}</p>
          )}
          <div className="w-full flex gap-1.5 mt-auto">
            {quizlet.pack !== "mystical" && (
              <button
                onClick={() => handleSell(quizlet)}
                disabled={selling === quizlet.id}
                className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${light ? "bg-black/15 hover:bg-black/25 text-gray-900" : "bg-black/30 hover:bg-black/50 text-white/80"}`}
              >
                Sell 🪙 {quizlet.sellValue}
              </button>
            )}
            {quizlet.pack !== "mystical" && (
              <Link
                href="/trading"
                className="py-1.5 px-2 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 rounded-lg transition-colors"
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

  const DexCard = ({ quizlet }: { quizlet: QuizletWithCreator }) => {
    const rarityInfo = RARITY_COLORS[quizlet.rarity] ?? RARITY_COLORS.common;
    const owned = ownedIds.has(quizlet.id);
    const isLegendary = quizlet.rarity === "legendary";
    const isRainbow = ["unique", "impossible"].includes(quizlet.rarity);
    const isMystical = quizlet.rarity === "mystical";
    const light = owned && isLightColor(quizlet.colorFrom);
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
          <p className={`font-bold text-sm leading-tight mb-1 ${light ? "text-gray-900" : "text-white"}`}>
            {owned ? quizlet.name : "???"}
          </p>
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${light ? "bg-black/15 text-gray-800" : `bg-black/30 ${rarityInfo.text}`}`}>{rarityInfo.label}</span>
          {owned && quizlet.createdBy && (
            <p className="text-xs text-amber-400/80 font-medium mt-1.5">🔨 by {quizlet.createdBy.name ?? "Blacksmith"}</p>
          )}
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
        {isBlacksmithActive && (
          <button
            onClick={() => setView("create")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === "create"
                ? "bg-amber-500 text-black"
                : "bg-amber-600/20 text-amber-300 border border-amber-600/30 hover:bg-amber-600/30"
            }`}
          >
            🔨 Create
          </button>
        )}
      </div>

      {/* Rarity Legend + Filter — hidden on create tab */}
      {view !== "create" && (
        <>
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
      </>)}

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

      {/* ── CREATE VIEW ── */}
      {view === "create" && isBlacksmithActive && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Form */}
          <div className="bg-white/5 border border-amber-600/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-amber-300 mb-1">Submit a Quizlet Design</h2>
            <p className="text-xs text-gray-500 mb-5">Admin will review your design before adding it to the game.</p>

            {cError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                {cError}
              </div>
            )}
            {cSuccess && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-300">
                ✅ Submitted! Your design is pending admin review.
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleCreateSubmit(); }} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Quizlet Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  maxLength={40}
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Shadow Fox"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                />
                <p className="text-xs text-gray-600 mt-1">{cName.length}/40 characters</p>
              </div>

              {/* Icon + Color Preview Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Icon */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Icon (emoji) <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cIcon}
                      onChange={(e) => setCIcon(e.target.value)}
                      placeholder="🦊"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                    />
                    {cIcon && (
                      <span className="text-3xl leading-none">{cIcon}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">One or two emoji characters</p>
                </div>

                {/* Gradient Preview */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Card Gradient</label>
                  <div
                    className="h-[44px] rounded-xl flex items-center justify-center text-2xl border border-white/10"
                    style={{ background: `linear-gradient(135deg, ${cColorFrom}, ${cColorTo})` }}
                  >
                    {cIcon || "🎴"}
                  </div>
                </div>
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Color From</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cColorFrom}
                      onChange={(e) => setCColorFrom(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                    />
                    <span className="text-xs text-gray-500 font-mono">{cColorFrom}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Color To</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cColorTo}
                      onChange={(e) => setCColorTo(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                    />
                    <span className="text-xs text-gray-500 font-mono">{cColorTo}</span>
                  </div>
                </div>
              </div>

              {/* Rarity + Pack */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rarity <span className="text-red-400">*</span></label>
                  <select
                    value={cRarity}
                    onChange={(e) => setCRarity(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {SUBMITTABLE_RARITIES.map((r) => {
                      const limit = SUBMISSION_HIDDEN.has(r) ? 1 : 2;
                      const used = monthlySubmissions.filter((s) => s.rarity === r).length;
                      return (
                        <option key={r} value={r} className="bg-gray-900">
                          {r.charAt(0).toUpperCase() + r.slice(1)} — {used}/{limit} used
                        </option>
                      );
                    })}
                  </select>
                  {(() => {
                    const limit = SUBMISSION_HIDDEN.has(cRarity) ? 1 : 2;
                    const used = monthlySubmissions.filter((s) => s.rarity === cRarity).length;
                    const rc = RARITY_COLORS[cRarity];
                    return (
                      <p className={`text-xs mt-1 font-medium ${used >= limit ? "text-red-400" : "text-amber-400/80"}`}>
                        {used >= limit ? "Monthly limit reached" : `${limit - used} submission${limit - used !== 1 ? "s" : ""} left this month`}
                        {rc && <span className={`ml-1.5 ${rc.text}`}>· {rc.label}</span>}
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Target Pack <span className="text-red-400">*</span></label>
                  <select
                    value={cPack}
                    onChange={(e) => setCPack(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {ALLOWED_PACKS.map((p) => (
                      <option key={p.slug} value={p.slug} className="bg-gray-900">{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Description <span className="text-red-400">*</span></label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={cDescription}
                  onChange={(e) => setCDescription(e.target.value)}
                  placeholder="Brief lore or flavour text for the quizlet..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500/50"
                />
                <p className="text-xs text-gray-600 mt-1">{cDescription.length}/200 characters</p>
              </div>

              <button
                type="submit"
                disabled={cSubmitting || (() => { const limit = SUBMISSION_HIDDEN.has(cRarity) ? 1 : 2; return monthlySubmissions.filter((s) => s.rarity === cRarity).length >= limit; })()}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cSubmitting ? "Submitting…" : "Submit for Review"}
              </button>
            </form>
          </div>

          {/* My submissions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">My Submissions</h3>
            {loadingSubs ? (
              <p className="text-sm text-gray-600">Loading…</p>
            ) : userSubmissions.length === 0 ? (
              <p className="text-sm text-gray-600">No submissions yet.</p>
            ) : (
              <div className="space-y-3">
                {userSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      sub.status === "approved" ? "bg-green-500/5 border-green-500/20" :
                      sub.status === "rejected" ? "bg-red-500/5 border-red-500/20" :
                      "bg-white/5 border-white/10"
                    }`}
                  >
                    {/* Swatch */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-white/10"
                      style={{ background: `linear-gradient(135deg, ${sub.colorFrom}, ${sub.colorTo})` }}
                    >
                      {sub.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{sub.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{sub.rarity} · {sub.pack}</p>
                      {sub.adminNote && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">"{sub.adminNote}"</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      sub.status === "approved" ? "bg-green-500/20 text-green-300" :
                      sub.status === "rejected" ? "bg-red-500/20 text-red-300" :
                      "bg-yellow-500/20 text-yellow-300"
                    }`}>
                      {sub.status === "approved" ? "✅ Approved" : sub.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
