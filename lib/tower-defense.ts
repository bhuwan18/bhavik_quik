// ─── Tower Defense wave & economy math ────────────────────────────────────────
// Zero imports beyond game-config — the pure parts of the mode (wave composition, tower
// costs, enemy position along the path), unit-testable without a canvas.

import { TD_ENEMY_BASE_HP, TD_TOWER_BASE_COST, TD_TOWER_UPGRADE_COST } from "@/lib/game-config";

/** Path is a fixed sequence of {x, y} waypoints in grid cells; enemies walk it start to end. */
export type PathPoint = { x: number; y: number };

export const TD_PATH: PathPoint[] = [
  { x: 0, y: 2 },
  { x: 4, y: 2 },
  { x: 4, y: 6 },
  { x: 8, y: 6 },
  { x: 8, y: 2 },
  { x: 12, y: 2 },
  { x: 12, y: 8 },
  { x: 16, y: 8 },
];

/** Total HP for a wave-N enemy — scales up each wave so later waves are meaningfully harder. */
export function enemyHpForWave(wave: number): number {
  return Math.round(TD_ENEMY_BASE_HP * (1 + (Math.max(1, wave) - 1) * 0.35));
}

/** Cost to place a fresh tower at the given tower count already owned (flat, for now). */
export function towerCost(): number {
  return TD_TOWER_BASE_COST;
}

/** Cost to upgrade a tower currently at `level` (1-indexed) to level + 1. */
export function towerUpgradeCost(level: number): number {
  return TD_TOWER_UPGRADE_COST * level;
}

/** Damage per shot for a tower at the given level. */
export function towerDamage(level: number): number {
  return 10 * level;
}

/** Range in pixels for a tower at the given level. */
export function towerRange(level: number, tilePx: number): number {
  return tilePx * (2 + level * 0.5);
}

/**
 * Position of an enemy at progress `t` (0 = start, 1 = end of path) along TD_PATH,
 * in grid-cell coordinates. Returns null once t >= 1 (enemy has reached the end).
 */
export function positionAtPathProgress(t: number, path: PathPoint[] = TD_PATH): PathPoint | null {
  if (t >= 1) return null;
  if (t <= 0) return path[0];

  const segmentCount = path.length - 1;
  const segLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < segmentCount; i++) {
    const len = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
    segLengths.push(len);
    totalLength += len;
  }

  const targetDist = t * totalLength;
  let traveled = 0;
  for (let i = 0; i < segmentCount; i++) {
    const segLen = segLengths[i];
    if (traveled + segLen >= targetDist || i === segmentCount - 1) {
      const segT = segLen === 0 ? 0 : (targetDist - traveled) / segLen;
      const clampedT = Math.max(0, Math.min(1, segT));
      const a = path[i];
      const b = path[i + 1];
      return { x: a.x + (b.x - a.x) * clampedT, y: a.y + (b.y - a.y) * clampedT };
    }
    traveled += segLen;
  }

  return path[path.length - 1];
}

/** Enemy count for a given wave number — ramps up gently. */
export function enemyCountForWave(wave: number): number {
  return 4 + Math.floor(wave * 1.5);
}
