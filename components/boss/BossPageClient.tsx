"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBoss } from "./BossProvider";
import BossCreature from "./BossCreature";
import { getBossVariant } from "@/lib/bosses-data";

type HistoryBoss = {
  id: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  maxHp: number;
  status: string;
  defeatedAt: string | null;
  contributorCount: number;
  finalBlowName: string | null;
};

function timeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expiring soon";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export default function BossPageClient() {
  const { boss, displayHp, yourGems, yourDamage, topContributors, refresh } = useBoss();
  const [history, setHistory] = useState<HistoryBoss[] | null>(null);

  useEffect(() => {
    refresh();
    fetch("/api/boss/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.history ?? []))
      .catch(() => setHistory([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = boss ? Math.max(0, Math.min(100, (displayHp / boss.maxHp) * 100)) : 0;
  const yourRank = topContributors.findIndex((c) => c.damage > 0 && c.damage === yourDamage) + 1 || null;

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">⚔️ Boss Battle</h1>
        <p className="text-gray-400 mt-1">Defeat the community boss together — every correct answer deals damage.</p>
      </div>

      {!boss && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3">😴</div>
          <p className="text-gray-400">No boss is active right now. Check back soon — a new one spawns automatically.</p>
        </div>
      )}

      {boss && (
        <>
          {/* Boss card */}
          <div
            className="rounded-2xl border p-6 md:p-8 mb-6 text-center"
            style={{ background: `linear-gradient(135deg, ${boss.colorFrom}22, ${boss.colorTo}22)`, borderColor: `${boss.colorFrom}55` }}
          >
            <div className="flex justify-center mb-4" style={{ filter: `drop-shadow(0 0 20px ${boss.colorFrom}66) drop-shadow(0 10px 12px rgba(0,0,0,0.35))` }}>
              <BossCreature colorFrom={boss.colorFrom} colorTo={boss.colorTo} variant={getBossVariant(boss.slug)} phase="idle" size={170} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{boss.name}</h2>
            <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">{boss.description}</p>
            <p className="text-xs text-gray-500 mb-4">{timeLeft(boss.expiresAt)}</p>

            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-1.5">
                <span>HP</span>
                <span className="tabular-nums font-semibold text-white">{Math.max(0, displayHp).toLocaleString()} / {boss.maxHp.toLocaleString()}</span>
              </div>
              <div className="h-4 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Your stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-white tabular-nums">{yourDamage}</p>
              <p className="text-xs text-gray-500 mt-1">Your damage</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-white tabular-nums">{yourRank ? `#${yourRank}` : "—"}</p>
              <p className="text-xs text-gray-500 mt-1">Your rank</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-white tabular-nums">💎 {yourGems}</p>
              <p className="text-xs text-gray-500 mt-1">Your gems</p>
            </div>
          </div>

          <div className="flex justify-end mb-2">
            <Link href="/shop" className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium">
              Redeem gems in Shop →
            </Link>
          </div>

          {/* Contributors */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Top Contributors</h3>
            {topContributors.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No damage dealt yet — be the first!</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {topContributors.map((c, i) => (
                  <li key={c.userId} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-center text-gray-500 font-semibold shrink-0">{i + 1}</span>
                    <span className="flex-1 truncate text-white font-medium">{c.name}</span>
                    <span className="text-gray-400 tabular-nums">{c.damage.toLocaleString()} dmg</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Past bosses */}
      {history && history.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Past Bosses</h3>
          <ul className="flex flex-col gap-2.5">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-sm">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ background: `linear-gradient(135deg, ${h.colorFrom}, ${h.colorTo})`, opacity: h.status === "defeated" ? 1 : 0.5 }}
                >
                  {h.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{h.name}</p>
                  <p className="text-xs text-gray-500">
                    {h.status === "defeated"
                      ? `Defeated by ${h.finalBlowName ?? "the community"} · ${h.contributorCount} contributor${h.contributorCount === 1 ? "" : "s"}`
                      : "Escaped — expired without being defeated"}
                  </p>
                </div>
                <span className="text-xs text-gray-600 tabular-nums shrink-0">{h.maxHp.toLocaleString()} HP</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
