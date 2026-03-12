"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME ?? "BittsQuiz";

type Tier = "pro" | "max";

interface TierConfig {
  id: Tier;
  name: string;
  price: number;
  icon: string;
  tagline: string;
  features: string[];
  gradient: string;
  border: string;
  buttonGradient: string;
  badge: string;
  badgeColor: string;
}

const TIERS: TierConfig[] = [
  {
    id: "pro",
    name: "Pro",
    price: 250,
    icon: "⭐",
    tagline: "Level up your game",
    features: [
      "1.5× coins per correct answer",
      "1,000 daily coin limit",
      "Golden ring avatar",
      "Pro badge on leaderboard",
      "30 days access",
    ],
    gradient: "from-yellow-900/50 to-orange-900/30",
    border: "border-yellow-500/50",
    buttonGradient: "from-yellow-500 to-orange-500",
    badge: "PRO",
    badgeColor: "bg-gradient-to-r from-yellow-500 to-orange-400 text-black",
  },
  {
    id: "max",
    name: "Max",
    price: 500,
    icon: "👑",
    tagline: "Dominate the leaderboard",
    features: [
      "2× coins per correct answer",
      "1,500 daily coin limit",
      "Rainbow ring avatar",
      "Max badge on leaderboard",
      "Priority support",
      "30 days access",
    ],
    gradient: "from-purple-900/50 to-pink-900/30",
    border: "border-purple-500/50",
    buttonGradient: "from-purple-500 to-pink-500",
    badge: "MAX",
    badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  },
];

export default function ShopPage() {
  const { data: session } = useSession();
  const user = session?.user as { isAdmin?: boolean; isPro?: boolean; isMax?: boolean } | undefined;
  const isPro = !!user?.isPro;
  const isMax = !!user?.isMax;

  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const activeTier = TIERS.find((t) => t.id === selectedTier);

  const upiLink = activeTier
    ? `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${activeTier.price}&cu=INR&tn=${encodeURIComponent(`BittsQuiz ${activeTier.name} Upgrade`)}`
    : "";

  const handleSubmit = async () => {
    if (!utrNumber.trim() || !selectedTier) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/user/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedTier, utrNumber: utrNumber.trim(), amountInr: activeTier!.price }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit");
      }
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Request Submitted!</h2>
          <p className="text-gray-300 mb-2">
            Your {activeTier?.name} upgrade request has been submitted. The admin will review it shortly.
          </p>
          <p className="text-gray-500 text-sm">UTR: {utrNumber}</p>
          <button
            onClick={() => { setSubmitted(false); setSelectedTier(null); setUtrNumber(""); }}
            className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🏪 Shop</h1>
        <p className="text-gray-400 mt-1">Upgrade your account to earn more coins and unlock exclusive perks</p>
      </div>

      {/* Current status */}
      {(isPro || isMax) && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-3">
          <span className="text-2xl">{isMax ? "👑" : "⭐"}</span>
          <div>
            <p className="text-yellow-400 font-semibold">You currently have {isMax ? "Max" : "Pro"} access</p>
            <p className="text-gray-400 text-sm">You can renew to extend your subscription by 30 more days.</p>
          </div>
        </div>
      )}

      {/* Tier cards */}
      {!selectedTier && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`bg-gradient-to-br ${tier.gradient} border ${tier.border} rounded-2xl p-6 flex flex-col`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{tier.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{tier.name}</h2>
                    <p className="text-gray-400 text-sm">{tier.tagline}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${tier.badgeColor}`}>
                  {tier.badge}
                </span>
              </div>

              <div className="text-3xl font-bold text-white mb-1">₹{tier.price}</div>
              <div className="text-gray-500 text-sm mb-5">per month</div>

              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setSelectedTier(tier.id)}
                className={`w-full py-3 bg-gradient-to-r ${tier.buttonGradient} text-white font-bold rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg`}
              >
                Upgrade to {tier.name} →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment flow */}
      {selectedTier && activeTier && (
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => { setSelectedTier(null); setUtrNumber(""); setError(""); }}
            className="text-gray-400 hover:text-white mb-6 text-sm"
          >
            ← Back to plans
          </button>

          <div className={`bg-gradient-to-br ${activeTier.gradient} border ${activeTier.border} rounded-2xl p-6 mb-6`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{activeTier.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{activeTier.name} — ₹{activeTier.price}/month</h2>
                <p className="text-gray-400 text-sm">Pay via UPI, then enter your UTR number below</p>
              </div>
            </div>

            {/* UPI info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-gray-500 mb-1">UPI ID</p>
              <p className="text-white font-mono font-bold text-lg">{UPI_ID || "merchant@upi"}</p>
              <p className="text-gray-500 text-xs mt-1">{UPI_NAME}</p>
            </div>

            <a
              href={upiLink}
              className={`block w-full text-center py-3 bg-gradient-to-r ${activeTier.buttonGradient} text-white font-bold rounded-xl hover:opacity-90 transition-all mb-2`}
            >
              Open UPI App — Pay ₹{activeTier.price}
            </a>
            <p className="text-gray-500 text-xs text-center">Opens GPay / PhonePe / Paytm</p>
          </div>

          {/* UTR submission */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">After Payment</h3>
            <p className="text-gray-400 text-sm mb-4">
              Once you&apos;ve paid, enter the UTR / Transaction Reference number from your UPI app.
            </p>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="Enter UTR / Reference number"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-3"
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!utrNumber.trim() || submitting}
              className={`w-full py-3 bg-gradient-to-r ${activeTier.buttonGradient} text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? "Submitting..." : "Submit Payment Proof"}
            </button>
            <p className="text-gray-500 text-xs text-center mt-3">
              Admin will verify and activate your {activeTier.name} within a few hours.
            </p>
          </div>
        </div>
      )}

      {/* Compare section */}
      {!selectedTier && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 text-center">Why upgrade?</h3>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-500 font-medium mb-2">Feature</p>
              <p className="text-gray-400">Daily Coin Limit</p>
              <p className="text-gray-400 mt-2">Coin Multiplier</p>
              <p className="text-gray-400 mt-2">Avatar Ring</p>
            </div>
            <div>
              <p className="text-yellow-400 font-bold mb-2">⭐ Pro</p>
              <p className="text-white">1,000</p>
              <p className="text-white mt-2">1.5×</p>
              <p className="text-white mt-2">Golden</p>
            </div>
            <div>
              <p className="text-purple-400 font-bold mb-2">👑 Max</p>
              <p className="text-white">1,500</p>
              <p className="text-white mt-2">2×</p>
              <p className="text-white mt-2">Rainbow</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
