"use client";

import { useState } from "react";

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

export default function AdminSettingsClient({
  schoolHoursEnabled: initialSchool,
  retakeCoinsEnabled: initialRetake,
}: {
  schoolHoursEnabled: boolean;
  retakeCoinsEnabled: boolean;
}) {
  const [schoolHoursEnabled, setSchoolHoursEnabled] = useState(initialSchool);
  const [retakeCoinsEnabled, setRetakeCoinsEnabled] = useState(initialRetake);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

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
      </div>
    </div>
  );
}
