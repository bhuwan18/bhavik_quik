// ─── Tower Defense wave, economy & path math ──────────────────────────────────
// Imports game-config + td-data only — no React, no DOM, no canvas. Every number the engine
// needs to decide *what happens* comes from here; the engine only decides *when*. Pure and
// unit-testable without a canvas, mirroring lib/monster-stage.ts's structure.

import {
  TD_CREEP_BASE_HP,
  TD_CREEP_BASE_SPEED_TILES,
  TD_CREEP_BASE_BOUNTY,
  TD_STAGE_HP_GROWTH,
  TD_STAGE_BOUNTY_GROWTH,
  TD_WAVE_HP_GROWTH,
  TD_MIN_DAMAGE_AFTER_ARMOR,
  TD_UPGRADE_COST_MULT,
  TD_UPGRADE_COST_GROWTH,
  TD_TOWER_DAMAGE_GROWTH,
  TD_TOWER_COOLDOWN_GROWTH,
  TD_TOWER_RANGE_GROWTH,
  TD_SELL_REFUND_PCT,
  TD_FROST_SLOW_PCT,
  TD_FROST_SLOW_PER_LEVEL,
  TD_CANNON_SPLASH_TILES,
  TD_CANNON_SPLASH_PER_LEVEL,
  TD_TESLA_CHAIN_TARGETS,
  TD_BEACON_DAMAGE_BUFF,
  TD_BEACON_RATE_BUFF,
  TD_BEACON_BUFF_PER_LEVEL,
  TD_WAVES_PER_STAGE,
  TD_SPAWN_SPACING_MS,
  TD_GRID_COLS,
  TD_GRID_ROWS,
  TD_PATH_SAMPLES_PER_TILE,
} from "@/lib/game-config";
import { getStageDef, getCreepType, type PathPoint, type CreepTypeDef, type TowerTypeDef } from "@/lib/td-data";

// ─── Path geometry ────────────────────────────────────────────────────────────

/** Precomputed segment data for one path — built once per stage, never per frame. */
export type PathGeometry = {
  path: PathPoint[];
  segLengths: number[]; // length of segment i (path[i] -> path[i+1]), in tiles
  cumulative: number[]; // cumulative[i] = total length traveled through the end of segment i-1
  totalTiles: number;
};

export function buildPathGeometry(path: PathPoint[]): PathGeometry {
  const segLengths: number[] = [];
  const cumulative: number[] = [0];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const len = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
    segLengths.push(len);
    total += len;
    cumulative.push(total);
  }
  return { path, segLengths, cumulative, totalTiles: total };
}

/** Position at progress `t` (0 = start, 1 = end) along the path, in grid-cell coordinates. Null once t >= 1. */
export function positionAt(geo: PathGeometry, t: number): PathPoint | null {
  if (t >= 1) return null;
  if (t <= 0) return geo.path[0];

  const targetDist = t * geo.totalTiles;
  const segmentCount = geo.segLengths.length;
  for (let i = 0; i < segmentCount; i++) {
    const segStart = geo.cumulative[i];
    const segLen = geo.segLengths[i];
    if (segStart + segLen >= targetDist || i === segmentCount - 1) {
      const segT = segLen === 0 ? 0 : (targetDist - segStart) / segLen;
      const clampedT = Math.max(0, Math.min(1, segT));
      const a = geo.path[i];
      const b = geo.path[i + 1];
      return { x: a.x + (b.x - a.x) * clampedT, y: a.y + (b.y - a.y) * clampedT };
    }
  }
  return geo.path[geo.path.length - 1];
}

/** Unit heading vector at progress `t`, from the segment currently being traveled. */
export function headingAt(geo: PathGeometry, t: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(0.999, t));
  const targetDist = clamped * geo.totalTiles;
  const segmentCount = geo.segLengths.length;
  for (let i = 0; i < segmentCount; i++) {
    const segStart = geo.cumulative[i];
    const segLen = geo.segLengths[i];
    if (segStart + segLen >= targetDist || i === segmentCount - 1) {
      const a = geo.path[i];
      const b = geo.path[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: dx / len, y: dy / len };
    }
  }
  return { x: 1, y: 0 };
}

/**
 * Every tile the path occupies, keyed `gy * TD_GRID_COLS + gx` (same scheme
 * monster-hunter-engine.ts uses — no string allocation in the hot loop). This is BOTH the
 * build mask and the visual path so the two can never drift: the renderer fills exactly this
 * set, and tower placement rejects exactly this set. Never hand-author a per-stage array.
 */
export function blockedTiles(geo: PathGeometry): Set<number> {
  const samples = Math.max(1, Math.ceil(geo.totalTiles * TD_PATH_SAMPLES_PER_TILE));
  const blocked = new Set<number>();
  for (let i = 0; i <= samples; i++) {
    const p = positionAt(geo, i / (samples + 1));
    if (!p) continue;
    const gx = Math.round(p.x);
    const gy = Math.round(p.y);
    if (gx < 0 || gy < 0 || gx >= TD_GRID_COLS || gy >= TD_GRID_ROWS) continue;
    blocked.add(gy * TD_GRID_COLS + gx);
  }
  return blocked;
}

// ─── Creep scaling ────────────────────────────────────────────────────────────

/** Total HP for a creep of the given def on a given stage/wave-within-stage (both 1-based). */
export function creepHp(def: CreepTypeDef, stage: number, waveInStage: number): number {
  const s = Math.max(1, stage);
  const w = Math.max(1, waveInStage);
  return Math.round(TD_CREEP_BASE_HP * def.hpMult * Math.pow(TD_STAGE_HP_GROWTH, s - 1) * (1 + TD_WAVE_HP_GROWTH * (w - 1)));
}

/** Gold awarded for killing a creep of the given def on a given stage (1-based). */
export function creepBounty(def: CreepTypeDef, stage: number): number {
  const s = Math.max(1, stage);
  return Math.round(TD_CREEP_BASE_BOUNTY * def.bountyMult * Math.pow(TD_STAGE_BOUNTY_GROWTH, s - 1));
}

/** Movement speed in tiles/second for a creep of the given def. */
export function creepSpeedTilesPerS(def: CreepTypeDef): number {
  return TD_CREEP_BASE_SPEED_TILES * def.speedMult;
}

/** Damage actually dealt after flat armor reduction; `ignoreArmor` (Sniper Nest) bypasses it entirely. */
export function damageAfterArmor(raw: number, armor: number, ignoreArmor = false): number {
  if (ignoreArmor) return raw;
  return Math.max(TD_MIN_DAMAGE_AFTER_ARMOR, raw - armor);
}

// ─── Tower economy & curves ───────────────────────────────────────────────────
// Linear levels 1..TD_TOWER_MAX_LEVEL, no branching. All derived from the type's level-1 base.

export function towerDamage(def: TowerTypeDef, level: number): number {
  return Math.round(def.damage * Math.pow(TD_TOWER_DAMAGE_GROWTH, Math.max(1, level) - 1));
}

export function towerCooldownMs(def: TowerTypeDef, level: number): number {
  return Math.round(def.cooldownMs * Math.pow(TD_TOWER_COOLDOWN_GROWTH, Math.max(1, level) - 1));
}

export function towerRangeTiles(def: TowerTypeDef, level: number): number {
  return def.rangeTiles * (1 + TD_TOWER_RANGE_GROWTH * (Math.max(1, level) - 1));
}

/** Cost to upgrade a tower currently at `level` (1-indexed) to level + 1. */
export function towerUpgradeCost(def: TowerTypeDef, level: number): number {
  return Math.round(def.cost * TD_UPGRADE_COST_MULT * Math.pow(TD_UPGRADE_COST_GROWTH, Math.max(1, level) - 1));
}

/** Total gold sunk into a tower currently at `level` — its purchase cost plus every upgrade paid so far. */
export function towerTotalInvested(def: TowerTypeDef, level: number): number {
  let total = def.cost;
  for (let l = 1; l < Math.max(1, level); l++) total += towerUpgradeCost(def, l);
  return total;
}

/** Gold refunded for selling a tower at `level` mid-stage (not a full stage-clear refund). */
export function towerSellValue(def: TowerTypeDef, level: number): number {
  return Math.floor(towerTotalInvested(def, level) * TD_SELL_REFUND_PCT);
}

export function frostSlowPct(level: number): number {
  return TD_FROST_SLOW_PCT + TD_FROST_SLOW_PER_LEVEL * (Math.max(1, level) - 1);
}

export function cannonSplashRadiusTiles(level: number): number {
  return TD_CANNON_SPLASH_TILES * (1 + TD_CANNON_SPLASH_PER_LEVEL * (Math.max(1, level) - 1));
}

/** Tesla Coil chain-jump target count: base at L1-2, +1 at L3-4, +1 more at L5. */
export function teslaChainCount(level: number): number {
  const l = Math.max(1, level);
  return TD_TESLA_CHAIN_TARGETS + (l >= 3 ? 1 : 0) + (l >= 5 ? 1 : 0);
}

export function beaconDamageBuff(level: number): number {
  return TD_BEACON_DAMAGE_BUFF + TD_BEACON_BUFF_PER_LEVEL * (Math.max(1, level) - 1);
}

export function beaconRateBuff(level: number): number {
  return TD_BEACON_RATE_BUFF + TD_BEACON_BUFF_PER_LEVEL * (Math.max(1, level) - 1);
}

// ─── Wave composition ─────────────────────────────────────────────────────────
// A function over the stage roster, not hand-authored per-wave tables — adding a stage is one
// StageDef, not TD_STAGE_COUNT * TD_WAVES_PER_STAGE wave arrays.

export type SpawnGroup = { creepId: string; count: number; spacingMs: number; delayMs: number };

/** `waveInStage` is 1-based; wave TD_WAVES_PER_STAGE of every stage is that stage's boss wave. */
export function isBossWave(waveInStage: number): boolean {
  return waveInStage >= TD_WAVES_PER_STAGE;
}

/** Global 1..TD_TOTAL_WAVES wave number for a given (stage, waveInStage), both 1-based. */
export function globalWaveNumber(stage: number, waveInStage: number): number {
  return (Math.max(1, stage) - 1) * TD_WAVES_PER_STAGE + Math.max(1, Math.min(TD_WAVES_PER_STAGE, waveInStage));
}

export function waveComposition(stage: number, waveInStage: number): SpawnGroup[] {
  const def = getStageDef(stage);
  const roster = def.roster;
  const r0 = roster[0];
  const r1 = roster[Math.min(1, roster.length - 1)];
  const r2 = roster[Math.min(2, roster.length - 1)];

  if (isBossWave(waveInStage)) {
    return [
      { creepId: def.bossId, count: 1, spacingMs: 0, delayMs: 0 },
      { creepId: r1, count: 6, spacingMs: 600, delayMs: 2500 },
    ];
  }

  switch (Math.max(1, waveInStage)) {
    case 1:
      return [{ creepId: r0, count: 6, spacingMs: TD_SPAWN_SPACING_MS, delayMs: 0 }];
    case 2:
      return [
        { creepId: r0, count: 6, spacingMs: 650, delayMs: 0 },
        { creepId: r1, count: 3, spacingMs: 500, delayMs: 3000 },
      ];
    case 3:
      return [{ creepId: r1, count: 8, spacingMs: 550, delayMs: 0 }];
    case 4:
      return [
        { creepId: r0, count: 5, spacingMs: 600, delayMs: 0 },
        { creepId: r2, count: 4, spacingMs: 900, delayMs: 2500 },
      ];
    default:
      return [
        { creepId: r0, count: 5, spacingMs: 480, delayMs: 0 },
        { creepId: r1, count: 5, spacingMs: 480, delayMs: 1500 },
        { creepId: r2, count: 5, spacingMs: 700, delayMs: 3000 },
      ];
  }
}

/** Total creep count across every group in a wave — used for HUD previews and difficulty tests. */
export function totalCreepsInWave(stage: number, waveInStage: number): number {
  return waveComposition(stage, waveInStage).reduce((sum, g) => sum + g.count, 0);
}
