// ─── Monster Hunter perk rolling & aggregation ───────────────────────────────
// Kept free of any DB/prisma import (mirrors lib/boss-gems.ts, lib/trading.ts), so it can be
// unit tested directly. Weighted rarity roll mirrors lib/roll.ts exactly: a module-private
// weight table, subtract from Math.random() * totalWeight until it goes non-positive.

import {
  MH_PLAYER_SPEED,
  MH_PLAYER_MAX_HP,
  MH_LASER_DAMAGE,
  MH_LASER_COOLDOWN_MS,
  MH_VISION_TILES,
} from "@/lib/game-config";
import { PERKS_DATA, type PerkDef } from "@/lib/perks-data";

const PERK_DROP_WEIGHTS: Record<string, number> = {
  common: 6000,
  uncommon: 2500,
  rare: 1000,
  epic: 400,
  legendary: 100,
  impossible: 5,
};

export type RunStats = {
  damage: number;
  fireCooldownMs: number;
  projectiles: number;
  speed: number;
  maxHp: number;
  visionTiles: number;
  pierce: number;
  xpMult: number;
  lifestealPct: number;
};

export const BASE_RUN_STATS: RunStats = {
  damage: MH_LASER_DAMAGE,
  fireCooldownMs: MH_LASER_COOLDOWN_MS,
  projectiles: 1,
  speed: MH_PLAYER_SPEED,
  maxHp: MH_PLAYER_MAX_HP,
  visionTiles: MH_VISION_TILES,
  pierce: 0,
  xpMult: 1,
  lifestealPct: 0,
};

function weightedRandomRarity(pool: PerkDef[]): PerkDef | null {
  if (pool.length === 0) return null;
  const weights = pool.map((p) => PERK_DROP_WEIGHTS[p.rarity] ?? 0);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return null;
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < pool.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Folds a fixed-order list of owned perk ids onto BASE_RUN_STATS. Multiplicative
 * effects (damageMult, fireRateMult, speedMult, xpMult) compound; additive effects
 * (maxHpAdd, visionAdd, pierceAdd, lifestealPct, projectiles) sum.
 */
export function aggregatePerks(perkIds: string[]): RunStats {
  const stats: RunStats = { ...BASE_RUN_STATS };

  for (const id of perkIds) {
    const perk = PERKS_DATA.find((p) => p.id === id);
    if (!perk) continue;
    const e = perk.effect;
    if (e.damageMult !== undefined) stats.damage *= e.damageMult;
    if (e.fireRateMult !== undefined) stats.fireCooldownMs *= e.fireRateMult;
    if (e.projectiles !== undefined) stats.projectiles += e.projectiles;
    if (e.speedMult !== undefined) stats.speed *= e.speedMult;
    if (e.maxHpAdd !== undefined) stats.maxHp += e.maxHpAdd;
    if (e.visionAdd !== undefined) stats.visionTiles += e.visionAdd;
    if (e.pierceAdd !== undefined) stats.pierce += e.pierceAdd;
    if (e.xpMult !== undefined) stats.xpMult *= e.xpMult;
    if (e.lifestealPct !== undefined) stats.lifestealPct += e.lifestealPct;
  }

  return stats;
}

/**
 * Rolls `count` distinct perk choices via weighted rarity, excluding any perk the
 * player has already taken `maxStacks` times. Returns fewer than `count` only when
 * the eligible pool itself is smaller (e.g. near the end of a very long run).
 */
export function rollPerkChoices(ownedIds: string[], count: number): PerkDef[] {
  const stackCounts = new Map<string, number>();
  for (const id of ownedIds) stackCounts.set(id, (stackCounts.get(id) ?? 0) + 1);

  const eligible = PERKS_DATA.filter((p) => (stackCounts.get(p.id) ?? 0) < p.maxStacks);
  const chosen: PerkDef[] = [];
  let pool = [...eligible];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const pick = weightedRandomRarity(pool);
    if (!pick) break;
    chosen.push(pick);
    pool = pool.filter((p) => p.id !== pick.id);
  }

  return chosen;
}
