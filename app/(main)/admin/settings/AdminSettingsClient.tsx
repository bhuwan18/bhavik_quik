"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { WeeklyOffers, WeeklyOfferType } from "@/lib/app-settings";
import { PRO_AMOUNT_INR, MAX_AMOUNT_INR, DAILY_RESET_AMOUNT_INR } from "@/lib/game-config";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function SettingToggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={enabled}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        enabled ? "border-purple-500 bg-purple-600" : "border-gray-600 bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Offer meta ───────────────────────────────────────────────────────────────

const OFFER_ROWS: { type: WeeklyOfferType; emoji: string; label: string; priceLabel: string }[] = [
  { type: "pro", emoji: "⭐", label: "Pro Membership", priceLabel: `₹${PRO_AMOUNT_INR}/month` },
  { type: "max", emoji: "👑", label: "Max Membership", priceLabel: `₹${MAX_AMOUNT_INR}/month` },
  { type: "daily_reset", emoji: "🔄", label: "Daily Reset", priceLabel: `₹${DAILY_RESET_AMOUNT_INR}` },
  { type: "coins", emoji: "🪙", label: "Coin Purchase", priceLabel: "1 coin = ₹1" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminSettingsClient({
  schoolHoursEnabled: initialSchool,
  retakeCoinsEnabled: initialRetake,
  weeklyOffers: initialOffers,
  totpConfigured: initialTotpConfigured,
}: {
  schoolHoursEnabled: boolean;
  retakeCoinsEnabled: boolean;
  weeklyOffers: WeeklyOffers;
  totpConfigured: boolean;
}) {
  const [schoolHoursEnabled, setSchoolHoursEnabled] = useState(initialSchool);
  const [retakeCoinsEnabled, setRetakeCoinsEnabled] = useState(initialRetake);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  // 2FA state
  const [totpConfigured, setTotpConfigured] = useState(initialTotpConfigured);
  const [setupPhase, setSetupPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [pendingSecret, setPendingSecret] = useState("");
  const [pendingUrl, setPendingUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Weekly offers state
  const [offers, setOffers] = useState<WeeklyOffers>(initialOffers);
  const [discountInputs, setDiscountInputs] = useState<Partial<Record<WeeklyOfferType, string>>>({});
  const [activateDialog, setActivateDialog] = useState<{ type: WeeklyOfferType; pct: number } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [offerError, setOfferError] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [expireLoading, setExpireLoading] = useState<WeeklyOfferType | null>(null);

  // ─── Settings toggle ────────────────────────────────────────────────────────

  async function patchSetting(key: string, value: boolean, onSuccess: () => void, msg: string) {
    setSaving(key);
    setSavedMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (res.ok) {
      onSuccess();
      setSavedMsg(msg);
    } else {
      setSavedMsg("Failed to save. Try again.");
    }
    setSaving(null);
    setTimeout(() => setSavedMsg(""), 3000);
  }

  // ─── 2FA setup ──────────────────────────────────────────────────────────────

  async function handleGenerateQR() {
    setVerifyError("");
    const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
    if (!res.ok) { setVerifyError("Failed to generate QR code."); return; }
    const data = await res.json();
    setPendingSecret(data.secret);
    setPendingUrl(data.otpauthUrl);
    setSetupPhase("scanning");
    setVerifyCode("");
  }

  async function handleVerify2FA() {
    setVerifyLoading(true);
    setVerifyError("");
    const res = await fetch("/api/admin/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: pendingSecret, code: verifyCode }),
    });
    setVerifyLoading(false);
    if (res.ok) {
      setTotpConfigured(true);
      setSetupPhase("idle");
      setPendingSecret("");
      setPendingUrl("");
      setVerifyCode("");
    } else {
      const d = await res.json();
      setVerifyError(d.error || "Invalid code. Try again.");
    }
  }

  async function handleReset2FA() {
    if (!confirm("Reset 2FA? You will need to re-scan a new QR code before activating offers.")) return;
    await fetch("/api/admin/2fa/verify", { method: "DELETE" });
    setTotpConfigured(false);
    setSetupPhase("idle");
  }

  // ─── Weekly offers ──────────────────────────────────────────────────────────

  function openActivateDialog(type: WeeklyOfferType) {
    const raw = discountInputs[type] ?? "";
    const pct = parseInt(raw, 10);
    if (!pct || pct < 1 || pct > 75) {
      setOfferError("Enter a discount between 1 and 75%.");
      return;
    }
    setOfferError("");
    setTotpCode("");
    setActivateDialog({ type, pct });
  }

  async function handleActivateOffer() {
    if (!activateDialog) return;
    setOfferLoading(true);
    setOfferError("");
    const res = await fetch("/api/admin/weekly-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activateDialog.type, discountPercent: activateDialog.pct, totpCode }),
    });
    setOfferLoading(false);
    if (res.ok) {
      setOffers((prev) => ({
        ...prev,
        [activateDialog.type]: { discountPercent: activateDialog.pct, weekStart: new Date().toISOString() },
      }));
      setActivateDialog(null);
      setTotpCode("");
    } else {
      const d = await res.json();
      setOfferError(d.error || "Failed. Try again.");
    }
  }

  async function handleExpireOffer(type: WeeklyOfferType) {
    setExpireLoading(type);
    const res = await fetch("/api/admin/weekly-offer", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setExpireLoading(null);
    if (res.ok) {
      setOffers((prev) => { const next = { ...prev }; delete next[type]; return next; });
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-grotesk)" }}>
        ⚙️ App Settings
      </h1>
      <p className="text-gray-400 text-sm mb-8">Global toggles that affect all users.</p>

      <div className="flex flex-col gap-4">
        {/* School Hours */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ background: "var(--surface)" }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🏫</span>
                <h2 className="font-semibold text-base">School Hours Restriction</h2>
              </div>
              <p className="text-sm text-gray-400">
                When enabled, students with <code className="text-purple-300">@oberoi-is.net</code> email
                accounts cannot play quizzes Mon–Fri between 8:00 AM – 3:00 PM IST.
                Individual overrides still apply via User Manager.
              </p>
            </div>
            <SettingToggle
              enabled={schoolHoursEnabled}
              disabled={saving !== null}
              onToggle={() =>
                patchSetting(
                  "schoolHoursEnabled",
                  !schoolHoursEnabled,
                  () => setSchoolHoursEnabled((v) => !v),
                  !schoolHoursEnabled ? "School hours restriction enabled." : "School hours restriction disabled."
                )
              }
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                schoolHoursEnabled
                  ? "bg-green-500/15 text-green-300 border-green-500/30"
                  : "bg-gray-500/15 text-gray-400 border-gray-600/30"
              }`}
            >
              {schoolHoursEnabled ? "Enabled" : "Disabled"}
            </span>
            {saving === "schoolHoursEnabled" && savedMsg && (
              <span className="text-xs text-purple-300">{savedMsg}</span>
            )}
          </div>
        </div>

        {/* Retake Coins */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ background: "var(--surface)" }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔁</span>
                <h2 className="font-semibold text-base">Earn Coins on Retakes</h2>
              </div>
              <p className="text-sm text-gray-400">
                When enabled, users earn coins for correct answers every time they retake a quiz,
                not just on the first correct attempt. Daily limits and tier multipliers still apply.
                When disabled, coins are only awarded the first time a question is answered correctly.
              </p>
            </div>
            <SettingToggle
              enabled={retakeCoinsEnabled}
              disabled={saving !== null}
              onToggle={() =>
                patchSetting(
                  "retakeCoinsEnabled",
                  !retakeCoinsEnabled,
                  () => setRetakeCoinsEnabled((v) => !v),
                  !retakeCoinsEnabled ? "Retake coins enabled." : "Retake coins disabled."
                )
              }
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                retakeCoinsEnabled
                  ? "bg-green-500/15 text-green-300 border-green-500/30"
                  : "bg-gray-500/15 text-gray-400 border-gray-600/30"
              }`}
            >
              {retakeCoinsEnabled ? "Enabled" : "Disabled"}
            </span>
            {saving === "retakeCoinsEnabled" && savedMsg && (
              <span className="text-xs text-purple-300">{savedMsg}</span>
            )}
          </div>
        </div>

        {/* ── 2FA Setup ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔐</span>
            <h2 className="font-semibold text-base">Admin 2FA (Authenticator)</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Required to activate weekly offers. Register once with an authenticator app (Google Authenticator, Authy, etc.).
          </p>

          {totpConfigured && setupPhase === "idle" && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-500/15 text-green-300 border-green-500/30">
                2FA Active
              </span>
              <button
                onClick={handleReset2FA}
                className="text-xs text-red-400 hover:text-red-300 underline"
              >
                Reset 2FA
              </button>
            </div>
          )}

          {!totpConfigured && setupPhase === "idle" && (
            <button
              onClick={handleGenerateQR}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
            >
              Generate QR Code
            </button>
          )}

          {setupPhase === "scanning" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-300">
                Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
              </p>
              <div className="p-3 rounded-xl bg-white w-fit">
                <QRCodeSVG value={pendingUrl} size={180} />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  className="w-36 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleVerify2FA}
                  disabled={verifyCode.length !== 6 || verifyLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {verifyLoading ? "Verifying…" : "Verify & Save"}
                </button>
                <button
                  onClick={() => setSetupPhase("idle")}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
              {verifyError && <p className="text-sm text-red-400">{verifyError}</p>}
            </div>
          )}
        </div>

        {/* ── This Week's Offers ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏷️</span>
            <h2 className="font-semibold text-base">This Week&apos;s Offers</h2>
          </div>
          <p className="text-sm text-gray-400 mb-5">
            Discounts apply for the current calendar week (Sun–Sat) and auto-expire. Max discount: 75%.
            {!totpConfigured && (
              <span className="text-yellow-400"> Set up 2FA above before activating offers.</span>
            )}
          </p>

          <div className="flex flex-col gap-3">
            {OFFER_ROWS.map(({ type, emoji, label, priceLabel }) => {
              const active = offers[type];
              return (
                <div
                  key={type}
                  className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-white/8 bg-white/3"
                >
                  <span className="text-base">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs text-gray-400">{priceLabel}</div>
                  </div>
                  {active ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                        {active.discountPercent}% OFF this week
                      </span>
                      <button
                        onClick={() => handleExpireOffer(type)}
                        disabled={expireLoading === type}
                        className="text-xs text-red-400 hover:text-red-300 underline disabled:opacity-50"
                      >
                        {expireLoading === type ? "Removing…" : "Expire"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="number"
                        min={1}
                        max={75}
                        placeholder="%"
                        value={discountInputs[type] ?? ""}
                        onChange={(e) =>
                          setDiscountInputs((prev) => ({ ...prev, [type]: e.target.value }))
                        }
                        className="w-20 px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => openActivateDialog(type)}
                        disabled={!totpConfigured}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-xs font-medium disabled:opacity-40 transition-colors"
                      >
                        Activate
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {offerError && !activateDialog && (
            <p className="text-sm text-red-400 mt-3">{offerError}</p>
          )}
        </div>
      </div>

      {/* ── Activate Offer Dialog ──────────────────────────────────────────── */}
      {activateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="rounded-2xl border border-white/10 p-6 w-full max-w-sm" style={{ background: "var(--surface)" }}>
            <h3 className="font-bold text-lg mb-1">Confirm Offer Activation</h3>
            <p className="text-sm text-gray-400 mb-5">
              You&apos;re about to activate a{" "}
              <span className="text-white font-semibold">{activateDialog.pct}% discount</span> on{" "}
              <span className="text-white font-semibold">
                {OFFER_ROWS.find((r) => r.type === activateDialog.type)?.label}
              </span>{" "}
              for this week. All users will be notified. Enter your authenticator code to confirm.
            </p>
            <label className="block text-xs text-gray-400 mb-1">Authenticator Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm mb-3 focus:outline-none focus:border-purple-500"
              autoFocus
            />
            {offerError && <p className="text-sm text-red-400 mb-3">{offerError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleActivateOffer}
                disabled={totpCode.length !== 6 || offerLoading}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {offerLoading ? "Activating…" : "Activate Offer"}
              </button>
              <button
                onClick={() => { setActivateDialog(null); setOfferError(""); setTotpCode(""); }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
