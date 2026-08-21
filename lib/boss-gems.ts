// ─── Boss Battle gem payout math ─────────────────────────────────────────────
// Kept in its own file, free of any DB/prisma import (mirrors lib/trading.ts), so it
// can be unit tested directly without pulling in lib/db.ts's live connection pool.

import { BOSS_GEM_REWARD_MIN, BOSS_GEM_REWARD_MAX, BOSS_FINAL_BLOW_BONUS_GEMS } from "@/lib/game-config";

/**
 * Gem payout for one contributor: a floor of BOSS_GEM_REWARD_MIN for any nonzero
 * damage, scaling linearly up to BOSS_GEM_REWARD_MAX for whoever dealt the most
 * damage, plus a flat bonus for whoever landed the killing blow.
 */
export function calculateBossGemPayout(damage: number, topDamage: number, isFinalBlow: boolean): number {
  const share = Math.min(1, damage / Math.max(1, topDamage));
  const scaled = Math.round(BOSS_GEM_REWARD_MIN + (BOSS_GEM_REWARD_MAX - BOSS_GEM_REWARD_MIN) * share);
  return scaled + (isFinalBlow ? BOSS_FINAL_BLOW_BONUS_GEMS : 0);
}
