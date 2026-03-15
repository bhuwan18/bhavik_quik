"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import {
  PRO_AMOUNT_INR,
  MAX_AMOUNT_INR,
  MEMBERSHIP_DURATION_DAYS,
  DAILY_LIMIT_PRO,
  DAILY_LIMIT_MAX,
  MULTIPLIER_PRO,
  MULTIPLIER_MAX,
  BUY_COINS_MIN,
  BUY_COINS_MAX,
  BUY_COINS_QUICK_AMOUNTS,
  DAILY_RESET_AMOUNT_INR,
} from "@/lib/game-config";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME ?? "BittsQuiz";

// ─── Membership ────────────────────────────────────────────────────────────────

type Tier = "pro" | "max";

const TIERS = [
  {
    id: "pro" as Tier,
    name: "Pro",
    price: PRO_AMOUNT_INR,
    icon: "⭐",
    tagline: "Level up your game",
    features: [
      `${MULTIPLIER_PRO}× coins per correct answer`,
      `${DAILY_LIMIT_PRO.toLocaleString()} daily coin limit`,
      "Golden ring avatar",
      "Pro badge on leaderboard",
      `${MEMBERSHIP_DURATION_DAYS} days access`,
    ],
    gradient: "from-yellow-900/50 to-orange-900/30",
    border: "border-yellow-500/50",
    buttonGradient: "from-yellow-500 to-orange-500",
    badge: "PRO",
    badgeColor: "bg-gradient-to-r from-yellow-500 to-orange-400 text-black",
  },
  {
    id: "max" as Tier,
    name: "Max",
    price: MAX_AMOUNT_INR,
    icon: "👑",
    tagline: "Dominate the leaderboard",
    features: [
      `${MULTIPLIER_MAX}× coins per correct answer`,
      `${DAILY_LIMIT_MAX.toLocaleString()} daily coin limit`,
      "Rainbow ring avatar",
      "Max badge on leaderboard",
      "Priority support",
      `${MEMBERSHIP_DURATION_DAYS} days access`,
    ],
    gradient: "from-purple-900/50 to-pink-900/30",
    border: "border-purple-500/50",
    buttonGradient: "from-purple-500 to-pink-500",
    badge: "MAX",
    badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  },
];

function MembershipTab({ isPro, isMax }: { isPro: boolean; isMax: boolean }) {
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
      <div className="max-w-2xl mx-auto">
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
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {(isPro || isMax) && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-3">
          <span className="text-2xl">{isMax ? "👑" : "⭐"}</span>
          <div>
            <p className="text-yellow-400 font-semibold">You currently have {isMax ? "Max" : "Pro"} access</p>
            <p className="text-gray-400 text-sm">You can renew to extend your subscription by 30 more days.</p>
          </div>
        </div>
      )}

      {!selectedTier && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {TIERS.map((tier) => (
            <div key={tier.id} className={`bg-gradient-to-br ${tier.gradient} border ${tier.border} rounded-2xl p-6 flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{tier.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{tier.name}</h2>
                    <p className="text-gray-400 text-sm">{tier.tagline}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${tier.badgeColor}`}>{tier.badge}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">₹{tier.price}</div>
              <div className="text-gray-500 text-sm mb-5">per month</div>
              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400 shrink-0">✓</span>{f}
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

      {selectedTier && activeTier && (
        <div className="max-w-lg mx-auto">
          <button onClick={() => { setSelectedTier(null); setUtrNumber(""); setError(""); }} className="text-gray-400 hover:text-white mb-6 text-sm">
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
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-gray-500 mb-1">UPI ID</p>
              <p className="text-white font-mono font-bold text-lg">{UPI_ID || "merchant@upi"}</p>
              <p className="text-gray-500 text-xs mt-1">{UPI_NAME}</p>
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl inline-block">
                <QRCodeSVG value={upiLink} size={180} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">Scan with any UPI app (GPay, PhonePe, Paytm, etc.)</p>
            <a href={upiLink} className={`block w-full text-center py-3 bg-gradient-to-r ${activeTier.buttonGradient} text-white font-bold rounded-xl hover:opacity-90 transition-all mb-2`}>
              Open UPI App — Pay ₹{activeTier.price}
            </a>
            <p className="text-gray-500 text-xs text-center">Opens GPay / PhonePe / Paytm</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">After Payment</h3>
            <p className="text-gray-400 text-sm mb-4">Once you&apos;ve paid, enter the UTR / Transaction Reference number from your UPI app.</p>
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
            <p className="text-gray-500 text-xs text-center mt-3">Admin will verify and activate your {activeTier.name} within a few hours.</p>
          </div>
        </div>
      )}

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
              <p className="text-white">{DAILY_LIMIT_PRO.toLocaleString()}</p>
              <p className="text-white mt-2">{MULTIPLIER_PRO}×</p>
              <p className="text-white mt-2">Golden</p>
            </div>
            <div>
              <p className="text-purple-400 font-bold mb-2">👑 Max</p>
              <p className="text-white">{DAILY_LIMIT_MAX.toLocaleString()}</p>
              <p className="text-white mt-2">{MULTIPLIER_MAX}×</p>
              <p className="text-white mt-2">Rainbow</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Buy Coins ─────────────────────────────────────────────────────────────────


function upiCoinLink(amount: number) {
  const params = new URLSearchParams({ pa: UPI_ID, pn: UPI_NAME, am: String(amount), cu: "INR", tn: `BittsQuiz ${amount} coins` });
  return `upi://pay?${params.toString()}`;
}

type CoinStep = "select" | "pay" | "submitted";

function BuyCoinsTab() {
  const [coins, setCoins] = useState(100);
  const [inputValue, setInputValue] = useState("100");
  const [step, setStep] = useState<CoinStep>("select");
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = Number.isInteger(coins) && coins >= BUY_COINS_MIN && coins <= BUY_COINS_MAX;
  const utrValid = /^[A-Za-z0-9]{8,30}$/.test(utr.trim());

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const n = parseInt(value, 10);
    if (!isNaN(n)) setCoins(n);
  };

  const handleSubmitUtr = async () => {
    if (!utrValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "coins", coins, utrNumber: utr.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setStep("submitted");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const payLink = upiCoinLink(coins);

  if (step === "submitted") {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-blue-300 mb-2">Payment submitted!</h2>
          <p className="text-gray-300 mb-2">
            Your request for <strong className="text-white">{coins} coins</strong> is pending admin review.
          </p>
          <p className="text-gray-500 text-sm mb-6">Coins will be added once verified — usually within a few hours.</p>
          <button
            onClick={() => { setStep("select"); setUtr(""); setCoins(100); setInputValue("100"); }}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors"
          >
            Buy more coins
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🪙</div>
        <h2 className="text-2xl font-bold text-white mb-2">Buy Coins</h2>
        <p className="text-gray-400">1 coin = ₹1 &nbsp;·&nbsp; Pay via UPI</p>
      </div>

      {step === "select" && (
        <>
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {BUY_COINS_QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setCoins(amt); setInputValue(String(amt)); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                    coins === amt ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {amt} 🪙 <span className="opacity-60 text-xs">₹{amt}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Custom amount ({BUY_COINS_MIN}–{BUY_COINS_MAX})</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={BUY_COINS_MIN}
                max={BUY_COINS_MAX}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-white">₹{isValid ? coins : "—"}</div>
                <div className="text-xs text-gray-500">total</div>
              </div>
            </div>
            {!isValid && inputValue !== "" && (
              <p className="text-xs text-red-400 mt-1">Must be between {BUY_COINS_MIN} and {BUY_COINS_MAX}.</p>
            )}
          </div>

          {isValid && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">You get</div>
                <div className="text-2xl font-bold text-white">{coins} 🪙</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">You pay</div>
                <div className="text-2xl font-bold text-white">₹{coins}</div>
              </div>
            </div>
          )}

          <button
            onClick={() => { if (isValid) { setStep("pay"); setError(""); } }}
            disabled={!isValid}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all"
          >
            Proceed to Pay ₹{isValid ? coins : "—"}
          </button>

          <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
            <p className="text-xs font-semibold text-yellow-500/80 mb-2 uppercase tracking-wide">Important Notice</p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>Coins are <strong className="text-gray-400">non-refundable</strong> under any circumstances.</li>
              <li>Coins have no cash value and cannot be transferred between accounts.</li>
              <li>Purchased coins do not expire, but are subject to account terms.</li>
            </ul>
          </div>
        </>
      )}

      {step === "pay" && (
        <>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Pay <strong className="text-white">₹{coins}</strong> to complete your purchase of{" "}
              <strong className="text-white">{coins} coins</strong>
            </p>
            {UPI_ID ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-xl inline-block">
                    <QRCodeSVG value={payLink} size={180} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Scan with any UPI app (GPay, PhonePe, Paytm, etc.)</p>
                <a href={payLink} className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors mb-2">
                  Open UPI App
                </a>
                <p className="text-xs text-gray-600 mt-1">UPI ID: <span className="font-mono text-gray-400">{UPI_ID}</span></p>
              </>
            ) : (
              <div className="text-yellow-400 text-sm py-4">UPI not configured. Contact support.</div>
            )}
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-300 font-medium mb-2 block">Enter UTR / Transaction Reference</label>
            <input
              type="text"
              placeholder="e.g. 123456789012"
              value={utr}
              onChange={(e) => setUtr(e.target.value.slice(0, 30))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500 text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">Find the UTR in your UPI app after paying.</p>
            {utr && !utrValid && <p className="text-xs text-red-400 mt-1">UTR must be 8–30 alphanumeric characters.</p>}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleSubmitUtr}
            disabled={!utrValid || loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all mb-3"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
          <button
            onClick={() => { setStep("select"); setError(""); }}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-xl transition-colors"
          >
            ← Back
          </button>
        </>
      )}
    </div>
  );
}

// ─── Daily Reset ───────────────────────────────────────────────────────────────

function DailyResetTab() {
  const [utr, setUtr] = useState("");
  const [step, setStep] = useState<"info" | "pay" | "submitted">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const utrValid = /^[A-Za-z0-9]{8,30}$/.test(utr.trim());
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${DAILY_RESET_AMOUNT_INR}&cu=INR&tn=${encodeURIComponent("BittsQuiz Daily Limit Reset")}`;

  const handleSubmit = async () => {
    if (!utrValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "reset", utrNumber: utr.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setStep("submitted");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (step === "submitted") {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Request Submitted!</h2>
          <p className="text-gray-300 mb-2">Your daily limit reset request is pending admin approval.</p>
          <p className="text-gray-500 text-sm mb-6">Once approved, your daily coin counter will be zeroed so you can earn again today.</p>
          <button
            onClick={() => { setStep("info"); setUtr(""); }}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold text-white mb-2">Daily Limit Reset</h2>
        <p className="text-gray-400">Hit your daily coin cap? Reset it instantly for ₹{DAILY_RESET_AMOUNT_INR}.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-green-400 mt-0.5 shrink-0">✓</span>
          <p className="text-sm text-gray-300">Resets your daily coin counter to zero — so you can earn your full daily limit again today</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-green-400 mt-0.5 shrink-0">✓</span>
          <p className="text-sm text-gray-300">One-time payment — not a subscription</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-yellow-400 mt-0.5 shrink-0">⚡</span>
          <p className="text-sm text-gray-300">Activated by admin — usually within a few hours</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">One-time fee</p>
          <p className="text-3xl font-bold text-white">₹{DAILY_RESET_AMOUNT_INR}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">You get</p>
          <p className="text-lg font-semibold text-green-400">Full day reset</p>
        </div>
      </div>

      {step === "info" && (
        <button
          onClick={() => { setStep("pay"); setError(""); }}
          className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg rounded-xl transition-all"
        >
          Pay ₹{DAILY_RESET_AMOUNT_INR} via UPI →
        </button>
      )}

      {step === "pay" && (
        <>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-xl inline-block">
                <QRCodeSVG value={upiLink} size={180} />
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">Scan with any UPI app (GPay, PhonePe, Paytm, etc.)</p>
            <p className="text-sm text-gray-400 mb-1">UPI ID</p>
            <p className="text-white font-mono font-bold text-lg mb-1">{UPI_ID || "merchant@upi"}</p>
            <p className="text-gray-500 text-xs mb-4">{UPI_NAME} · ₹{DAILY_RESET_AMOUNT_INR}</p>
            <a
              href={upiLink}
              className="inline-block px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Open UPI App
            </a>
            <p className="text-xs text-gray-600 mt-2">Opens GPay / PhonePe / Paytm</p>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-300 font-medium mb-2 block">Enter UTR / Transaction Reference</label>
            <input
              type="text"
              placeholder="e.g. 123456789012"
              value={utr}
              onChange={(e) => setUtr(e.target.value.slice(0, 30))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500 text-sm"
            />
            {utr && !utrValid && <p className="text-xs text-red-400 mt-1">UTR must be 8–30 alphanumeric characters.</p>}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!utrValid || loading}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all mb-3"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
          <button
            onClick={() => { setStep("info"); setError(""); }}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-xl transition-colors"
          >
            ← Back
          </button>
        </>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type ShopTab = "membership" | "coins" | "reset";

export default function ShopPage() {
  const { data: session } = useSession();
  const user = session?.user as { isAdmin?: boolean; isPro?: boolean; isMax?: boolean } | undefined;
  const isPro = !!user?.isPro;
  const isMax = !!user?.isMax;

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialTab = (searchParams?.get("tab") as ShopTab | null) ?? "membership";
  const [tab, setTab] = useState<ShopTab>(initialTab);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">🏪 Shop</h1>
        <p className="text-gray-400 mt-1">Upgrade your membership or top up your coins</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit">
        <button
          onClick={() => setTab("membership")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "membership"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ⭐ Membership
        </button>
        <button
          onClick={() => setTab("coins")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "coins"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🪙 Buy Coins
        </button>
        <button
          onClick={() => setTab("reset")}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "reset"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          🔄 Daily Reset
        </button>
      </div>

      {tab === "membership" && <MembershipTab isPro={isPro} isMax={isMax} />}
      {tab === "coins" && <BuyCoinsTab />}
      {tab === "reset" && <DailyResetTab />}
    </div>
  );
}
