"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];
const MIN_COINS = 10;
const MAX_COINS = 10000;

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME ?? "BittsQuiz";

function upiLink(amount: number, note: string) {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_NAME,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

type Step = "select" | "pay" | "submitted";

export default function BuyCoinsPage() {
  const [coins, setCoins] = useState(100);
  const [inputValue, setInputValue] = useState("100");
  const [step, setStep] = useState<Step>("select");
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = Number.isInteger(coins) && coins >= MIN_COINS && coins <= MAX_COINS;
  const utrValid = /^[A-Za-z0-9]{8,30}$/.test(utr.trim());

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const n = parseInt(value, 10);
    if (!isNaN(n)) setCoins(n);
  };

  const handleProceedToPay = () => {
    if (!isValid) return;
    setStep("pay");
    setError("");
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

  const payLink = upiLink(coins, `BittsQuiz ${coins} coins`);

  if (step === "submitted") {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-blue-300 mb-2">Payment submitted!</h2>
          <p className="text-gray-300 mb-2">
            Your request for <strong className="text-white">{coins} coins</strong> is pending admin review.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Coins will be added to your account once verified. This usually happens within a few hours.
          </p>
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
    <div className="p-8 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🪙</div>
        <h1 className="text-3xl font-bold text-white mb-2">Buy Coins</h1>
        <p className="text-gray-400">1 coin = ₹1 &nbsp;·&nbsp; Pay via UPI</p>
      </div>

      {step === "select" && (
        <>
          {/* Quick-select */}
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setCoins(amt); setInputValue(String(amt)); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                    coins === amt
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {amt} 🪙 <span className="opacity-60 text-xs">₹{amt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Custom amount ({MIN_COINS}–{MAX_COINS})</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={MIN_COINS}
                max={MAX_COINS}
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
              <p className="text-xs text-red-400 mt-1">Must be between {MIN_COINS} and {MAX_COINS}.</p>
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
            onClick={handleProceedToPay}
            disabled={!isValid}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all"
          >
            Proceed to Pay ₹{isValid ? coins : "—"}
          </button>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
            <p className="text-xs font-semibold text-yellow-500/80 mb-2 uppercase tracking-wide">Important Notice</p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>Coins purchased are <strong className="text-gray-400">non-refundable and non-returnable</strong> under any circumstances.</li>
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
                <a
                  href={payLink}
                  className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors mb-2"
                >
                  Open UPI App
                </a>
                <p className="text-xs text-gray-600 mt-1">
                  UPI ID: <span className="font-mono text-gray-400">{UPI_ID}</span>
                </p>
              </>
            ) : (
              <div className="text-yellow-400 text-sm py-4">UPI not configured. Contact support.</div>
            )}
          </div>

          {/* UTR input */}
          <div className="mb-6">
            <label className="text-sm text-gray-300 font-medium mb-2 block">
              Enter UTR / Transaction Reference
            </label>
            <input
              type="text"
              placeholder="e.g. 123456789012"
              value={utr}
              onChange={(e) => setUtr(e.target.value.slice(0, 30))}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500 text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Find the UTR in your UPI app after paying. It may be called Transaction ID or Reference Number.
            </p>
            {utr && !utrValid && (
              <p className="text-xs text-red-400 mt-1">UTR must be 8–30 alphanumeric characters.</p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">
              {error}
            </div>
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
