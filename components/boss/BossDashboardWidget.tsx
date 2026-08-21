"use client";

import Link from "next/link";
import { useBoss } from "./BossProvider";
import BossCreature from "./BossCreature";
import { getBossVariant } from "@/lib/bosses-data";

/** Compact HP-bar widget for the dashboard, linking to the full /boss page. Renders
 *  nothing when Boss Battles is disabled or no boss is currently active. */
export default function BossDashboardWidget() {
  const { boss, displayHp } = useBoss();

  if (!boss) return null;

  const pct = Math.max(0, Math.min(100, (displayHp / boss.maxHp) * 100));

  return (
    <Link
      href="/boss"
      className="mb-6 flex items-center gap-4 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-colors group"
      style={{ background: `linear-gradient(135deg, ${boss.colorFrom}18, ${boss.colorTo}18)` }}
    >
      <div className="shrink-0 -my-2" style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.3))` }}>
        <BossCreature colorFrom={boss.colorFrom} colorTo={boss.colorTo} variant={getBossVariant(boss.slug)} phase="idle" size={68} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-white truncate">⚔️ {boss.name}</p>
          <span className="text-xs text-gray-400 tabular-nums shrink-0">{Math.max(0, displayHp).toLocaleString()} / {boss.maxHp.toLocaleString()}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-xs text-gray-400 group-hover:text-white transition-colors shrink-0">Fight →</span>
    </Link>
  );
}
