"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useBoss } from "./BossProvider";
import BossCreature from "./BossCreature";
import { getBossVariant } from "@/lib/bosses-data";

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expiring soon";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export default function BossDetailSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { boss, displayHp, yourGems, yourDamage, topContributors } = useBoss();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!boss) return null;

  const pct = Math.max(0, Math.min(100, (displayHp / boss.maxHp) * 100));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-[55]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${boss.name} boss battle details`}
              className="bg-[var(--surface)] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden"
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
                <h2 className="text-base font-bold text-white">Boss Battle</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-5 pt-4">
                {/* Boss art + HP */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="shrink-0" style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.3))` }}>
                    <BossCreature colorFrom={boss.colorFrom} colorTo={boss.colorTo} variant={getBossVariant(boss.slug)} phase="idle" size={80} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{boss.name}</div>
                    <div className="text-xs text-gray-400">{timeLeft(boss.expiresAt)}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">{boss.description}</p>

                <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                  <span>HP</span>
                  <span className="tabular-nums">{Math.max(0, displayHp)} / {boss.maxHp}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-5">
                  <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>

                {/* Your stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                    <div className="text-lg font-bold text-white tabular-nums">{yourDamage}</div>
                    <div className="text-[11px] text-gray-500">Your damage</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                    <div className="text-lg font-bold text-white tabular-nums">💎 {yourGems}</div>
                    <div className="text-[11px] text-gray-500">Your gems</div>
                  </div>
                </div>

                {/* Top contributors */}
                <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Top Contributors</div>
                {topContributors.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No damage dealt yet — be the first!</p>
                ) : (
                  <ul className="flex flex-col gap-1.5 mb-4">
                    {topContributors.map((c, i) => (
                      <li key={c.userId} className="flex items-center gap-2.5 text-sm">
                        <span className="w-5 text-center text-gray-500 text-xs font-semibold shrink-0">{i + 1}</span>
                        <span className="flex-1 truncate text-white">{c.name}</span>
                        <span className="text-gray-400 tabular-nums text-xs">{c.damage} dmg</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  href="/boss"
                  onClick={onClose}
                  className="block text-center w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
                >
                  View Full Boss Page →
                </Link>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
