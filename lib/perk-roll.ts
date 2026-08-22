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
  MH_TURRET_BASE_RANGE_TILES,
  MH_TURRET_BASE_COOLDOWN_MS,
  MH_BARRIER_BASE_RECHARGE_MS,
  MH_NOVA_BASE_INTERVAL_MS,
  MH_NOVA_BASE_RADIUS_TILES,
  MH_NOVA_BASE_DAMAGE,
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

/**
 * Aggregated state for the ability perks — Turret Drone, Kinetic Barrier, Nova Burst, Second
 * Wind. These aren't folded into RunStats because they aren't flat multipliers on existing
 * mechanics: they're whole extra behaviors monster-hunter-engine.ts simulates every frame
 * (an orbiting gun, a recharging shield, a periodic AoE pulse, an on-hit speed burst).
 */
export type AbilityState = {
  turret: {
    owned: boolean;
    damageMult: number;
    fireCooldownMs: number;
    rangeTiles: number;
    projectiles: number;
    smartTargeting: boolean;
  };
  barrier: { owned: boolean; rechargeMs: number };
  novaBurst: { owned: boolean; intervalMs: number; radiusTiles: number; damage: number };
  secondWind: { owned: boolean };
};

export const BASE_ABILITY_STATE: AbilityState = {
  turret: {
    owned: false,
    damageMult: 1,
    fireCooldownMs: MH_TURRET_BASE_COOLDOWN_MS,
    rangeTiles: MH_TURRET_BASE_RANGE_TILES,
    projectiles: 1,
    smartTargeting: false,
  },
  barrier: { owned: false, rechargeMs: MH_BARRIER_BASE_RECHARGE_MS },
  novaBurst: { owned: false, intervalMs: MH_NOVA_BASE_INTERVAL_MS, radiusTiles: MH_NOVA_BASE_RADIUS_TILES, damage: MH_NOVA_BASE_DAMAGE },
  secondWind: { owned: false },
};

/**
 * Folds a fixed-order list of owned perk ids into AbilityState. Each ability's own unlock
 * perk (grantsTurret, grantsBarrier, ...) flips `owned`; its `requires`-gated upgrade perks
 * only ever appear in rollPerkChoices once the base ability is owned (see below), but the
 * multipliers here apply unconditionally regardless of order, so an upgrade picked in the
 * same batch as its unlock (not currently possible, but kept robust) still counts.
 */
export function aggregateAbilities(perkIds: string[]): AbilityState {
  const state: AbilityState = {
    turret: { ...BASE_ABILITY_STATE.turret },
    barrier: { ...BASE_ABILITY_STATE.barrier },
    novaBurst: { ...BASE_ABILITY_STATE.novaBurst },
    secondWind: { ...BASE_ABILITY_STATE.secondWind },
  };

  for (const id of perkIds) {
    const perk = PERKS_DATA.find((p) => p.id === id);
    if (!perk) continue;
    const e = perk.effect;
    if (e.grantsTurret) state.turret.owned = true;
    if (e.turretDamageMult !== undefined) state.turret.damageMult *= e.turretDamageMult;
    if (e.turretFireRateMult !== undefined) state.turret.fireCooldownMs *= e.turretFireRateMult;
    if (e.turretRangeMult !== undefined) state.turret.rangeTiles *= e.turretRangeMult;
    if (e.turretProjectiles !== undefined) state.turret.projectiles += e.turretProjectiles;
    if (e.turretSmartTargeting) state.turret.smartTargeting = true;
    if (e.grantsBarrier) state.barrier.owned = true;
    if (e.barrierRechargeMult !== undefined) state.barrier.rechargeMs *= e.barrierRechargeMult;
    if (e.grantsNovaBurst) state.novaBurst.owned = true;
    if (e.novaDamageMult !== undefined) state.novaBurst.damage *= e.novaDamageMult;
    if (e.novaRadiusMult !== undefined) state.novaBurst.radiusTiles *= e.novaRadiusMult;
    if (e.grantsSecondWind) state.secondWind.owned = true;
  }

  return state;
}

export type AbilityBadge = { id: string; name: string; icon: string; tier: number };

/**
 * Summarizes owned ability perks (Turret Drone, Kinetic Barrier, Nova Burst, Second Wind) for
 * HUD display: one badge per unlocked ability, `tier` counting the unlock itself as 1 plus
 * every requires-gated upgrade stack taken — so a HUD icon visibly reflects upgrades without
 * duplicating the turret/barrier/nova upgrade id lists anywhere outside lib/perks-data.ts.
 */
export function getAbilityBadges(ownedIds: string[]): AbilityBadge[] {
  const stackCounts = new Map<string, number>();
  for (const id of ownedIds) stackCounts.set(id, (stackCounts.get(id) ?? 0) + 1);

  const isAbilityUnlock = (p: PerkDef) =>
    !p.requires && (p.effect.grantsTurret || p.effect.grantsBarrier || p.effect.grantsNovaBurst || p.effect.grantsSecondWind);

  const badges: AbilityBadge[] = [];
  for (const unlock of PERKS_DATA.filter(isAbilityUnlock)) {
    if (!stackCounts.has(unlock.id)) continue;
    const upgradeStacks = PERKS_DATA.filter((p) => p.requires === unlock.id).reduce((sum, p) => sum + (stackCounts.get(p.id) ?? 0), 0);
    badges.push({ id: unlock.id, name: unlock.name, icon: unlock.icon, tier: 1 + upgradeStacks });
  }
  return badges;
}

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
 * Rolls `count` distinct perk choices via weighted rarity, excluding any perk the player has
 * already taken `maxStacks` times, and excluding any `requires`-gated upgrade perk (turret,
 * barrier, nova) until its base ability has actually been picked — so a player never sees
 * "Turret Barrage" offered before "Turret Drone" unlocks the turret it upgrades. Returns
 * fewer than `count` only when the eligible pool itself is smaller (e.g. near the end of a
 * very long run, or early on when most ability upgrades are still locked behind their base).
 */
export function rollPerkChoices(ownedIds: string[], count: number): PerkDef[] {
  const stackCounts = new Map<string, number>();
  for (const id of ownedIds) stackCounts.set(id, (stackCounts.get(id) ?? 0) + 1);

  const eligible = PERKS_DATA.filter((p) => {
    if ((stackCounts.get(p.id) ?? 0) >= p.maxStacks) return false;
    if (p.requires && !stackCounts.has(p.requires)) return false;
    return true;
  });
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
