"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID ?? "";
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME ?? "BittsQuiz";
const PRO_AMOUNT = 500;

function upiLink() {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_NAME,
    am: String(PRO_AMOUNT),
    cu: "INR",
    tn: "BittsQuiz Pro Subscription",
  });
  return `upi://pay?${params.toString()}`;
}

type Step = "info" | "pay" | "submitted";

export default function UpgradePage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("info");
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPro = (session?.user as { isPro?: boolean })?.isPro;
  const utrValid = /^[A-Za-z0-9]{8,30}$/.test(utr.trim());

  const handleSubmitUtr = async () => {
    if (!utrValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "pro", utrNumber: utr.trim() }),
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
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-blue-300 mb-2">Request submitted!</h2>
          <p className="text-gray-300 mb-2">Your Pro subscription payment is pending admin review.</p>
          <p className="text-gray-500 text-sm">
            Your golden ring and increased limits will be activated once verified. This usually happens within a few hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">⭐</div>
        <h1 className="text-3xl font-bold text-white mb-2">BittsQuiz Pro</h1>
        <p className="text-gray-400">Unlock higher limits and exclusive benefits</p>
      </div>

      {step === "info" && (
        <>
          {/* Benefits */}
          <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-400 mb-4">Pro Benefits</h2>
            <div className="space-y-3">
              {[
                { icon: "🪙", text: "500 coins/day limit (vs 100 for free users)" },
                { icon: "👑", text: "Golden ring around your avatar everywhere" },
                { icon: "⚡", text: "PRO badge shown on your profile" },
                { icon: "🚀", text: "Early access to new features" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-gray-300">
                  <span className="text-xl">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6 text-center">
            <div className="text-4xl font-black text-white mb-1">
              ₹500<span className="text-lg font-normal text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 text-sm">30 days of Pro access per payment.</p>
          </div>

          {isPro ? (
            <div className="w-full py-4 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold rounded-xl text-center">
              You are already a Pro member!
            </div>
          ) : (
            <button
              onClick={() => setStep("pay")}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-400 hover:from-yellow-400 hover:to-orange-300 text-black font-bold text-lg rounded-xl transition-all"
            >
              Upgrade to Pro — ₹500/month
            </button>
          )}

          <p className="text-center text-xs text-gray-600 mt-4">Pay via UPI. Activated after admin verification.</p>
        </>
      )}

      {step === "pay" && (
        <>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Pay <strong className="text-white">₹500</strong> for 30 days of Pro access
            </p>

            {UPI_ID ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-xl inline-block">
                    <QRCodeSVG value={upiLink()} size={180} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">Scan with any UPI app (GPay, PhonePe, Paytm, etc.)</p>
                <a
                  href={upiLink()}
                  className="inline-block px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold rounded-xl transition-colors mb-2"
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-yellow-500 text-sm"
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
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-400 hover:from-yellow-400 hover:to-orange-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-lg rounded-xl transition-all mb-3"
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
