// ─── Monster Hunter stage progression ─────────────────────────────────────────
// Kept free of any DB/prisma import (mirrors lib/perk-roll.ts, lib/boss-gems.ts), so it can be
// unit tested directly. Pure functions only — the engine (monster-hunter-engine.ts) is the only
// caller and owns all mutable state.

import {
  MH_STAGE_LEVELS,
  MH_STAGE_HP_GROWTH,
  MH_STAGE_DAMAGE_GROWTH,
  MH_STAGE_SPEED_GROWTH,
  MH_STAGE_SPEED_CAP,
  MH_SPAWN_INTERVAL_STAGE1_MS,
  MH_SPAWN_INTERVAL_MIN_MS,
  MH_SPAWN_RAMP_PER_STAGE,
  MH_SPAWN_RAMP_PER_LEVEL_IN_STAGE,
  MH_MAX_MONSTERS_BASE,
  MH_MAX_MONSTERS_PER_STAGE,
  MH_MAX_MONSTERS_CAP,
} from "@/lib/game-config";
import { STAGE_ROSTERS, getMonsterType, type MonsterTypeDef } from "@/lib/monsters-data";

export type StageScale = { hp: number; damage: number; speed: number };

/** Player level → 1-based monster stage. Levels 1-10 are stage 1, 11-20 stage 2, and so on. */
export function getStage(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / MH_STAGE_LEVELS) + 1;
}

/** The monster types in play at a given stage. Stages beyond the roster list reuse the last one. */
export function getStageRoster(stage: number): MonsterTypeDef[] {
  const idx = Math.min(Math.max(1, stage), STAGE_ROSTERS.length) - 1;
  return STAGE_ROSTERS[idx].map(getMonsterType);
}

/**
 * Compounding difficulty multipliers applied on top of each monster type's own stat
 * multipliers, so even a stage that reuses an earlier roster keeps getting harder.
 */
export function getStageScale(stage: number): StageScale {
  const s = Math.max(1, stage);
  return {
    hp: Math.pow(MH_STAGE_HP_GROWTH, s - 1),
    damage: Math.pow(MH_STAGE_DAMAGE_GROWTH, s - 1),
    speed: Math.min(MH_STAGE_SPEED_CAP, 1 + (s - 1) * MH_STAGE_SPEED_GROWTH),
  };
}

/** Picks a uniformly random monster type from the stage's roster. */
export function pickMonsterType(stage: number): MonsterTypeDef {
  const roster = getStageRoster(stage);
  return roster[Math.floor(Math.random() * roster.length)];
}

/**
 * Time between monster spawns. Shrinks by MH_SPAWN_RAMP_PER_STAGE once per stage, plus a
 * gentle additional ramp across the levels within the current stage, so difficulty climbs
 * smoothly rather than jumping only at stage boundaries. Always clamped to
 * MH_SPAWN_INTERVAL_MIN_MS, which is deliberately generous enough to fight, dodge, and move
 * between spawns even at the highest stages.
 */
export function getSpawnIntervalMs(stage: number, level: number): number {
  const s = Math.max(1, stage);
  const stageFactor = Math.pow(MH_SPAWN_RAMP_PER_STAGE, s - 1);
  const levelInStage = (Math.max(1, level) - 1) % MH_STAGE_LEVELS;
  const withinStageFactor = Math.pow(MH_SPAWN_RAMP_PER_LEVEL_IN_STAGE, levelInStage);
  const interval = MH_SPAWN_INTERVAL_STAGE1_MS * stageFactor * withinStageFactor;
  return Math.max(MH_SPAWN_INTERVAL_MIN_MS, interval);
}

/** Concurrent monster cap. Grows a little each stage so higher stages feel busier, capped so a long run never tanks framerate or overwhelms the corridors. */
export function getMaxMonsters(stage: number): number {
  const s = Math.max(1, stage);
  return Math.min(MH_MAX_MONSTERS_CAP, MH_MAX_MONSTERS_BASE + (s - 1) * MH_MAX_MONSTERS_PER_STAGE);
}
