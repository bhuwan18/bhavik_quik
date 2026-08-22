// Zero imports — client-bundle-safe, mirrors lib/perks-data.ts / lib/bosses-data.ts.
// Each monster type is a stat-multiplier profile applied on top of the MH_MONSTER_* base
// constants in lib/game-config.ts, plus a `behavior` that the engine (monster-hunter-engine.ts)
// dispatches on. STAGE_ROSTERS controls which types are in play at a given stage — see
// lib/monster-stage.ts for how level → stage → roster resolves.

export type MonsterBehavior =
  | "chaser" // walks the shortest BFS path straight at the player — the baseline
  | "skirmisher" // same chase, but repaths faster so it reacts to dodges quicker
  | "brute" // slow, tanky, hard-hitting — a wall of a monster
  | "ranged"; // keeps its distance and lobs projectiles instead of contact damage

export type MonsterPalette = { core: string; mid: string; edge: string; glow: string };

export type MonsterTypeDef = {
  id: string;
  name: string;
  icon: string;
  behavior: MonsterBehavior;
  hpMult: number; // relative to MH_MONSTER_HP
  damageMult: number; // relative to MH_MONSTER_DAMAGE (contact, or ranged projectile base)
  speedMult: number; // relative to MH_MONSTER_SPEED
  radiusMult: number; // relative to the engine's base MONSTER_RADIUS
  palette: MonsterPalette;
};

export const MONSTER_TYPES: MonsterTypeDef[] = [
  {
    id: "crawler",
    name: "Crawler",
    icon: "🐛",
    behavior: "chaser",
    hpMult: 1,
    damageMult: 1,
    speedMult: 1,
    radiusMult: 1,
    palette: { core: "#fecaca", mid: "#f87171", edge: "#7f1d1d", glow: "rgba(248,113,113,0.65)" },
  },
  {
    id: "stalker",
    name: "Stalker",
    icon: "🦂",
    behavior: "skirmisher",
    hpMult: 0.7,
    damageMult: 0.85,
    speedMult: 1.5,
    radiusMult: 0.85,
    palette: { core: "#e9d5ff", mid: "#a855f7", edge: "#4c1d95", glow: "rgba(168,85,247,0.65)" },
  },
  {
    id: "brute",
    name: "Brute",
    icon: "🦍",
    behavior: "brute",
    hpMult: 2.6,
    damageMult: 1.7,
    speedMult: 0.6,
    radiusMult: 1.45,
    palette: { core: "#fed7aa", mid: "#ea580c", edge: "#7c2d12", glow: "rgba(234,88,12,0.65)" },
  },
  {
    id: "spitter",
    name: "Spitter",
    icon: "🕷️",
    behavior: "ranged",
    hpMult: 0.8,
    damageMult: 0.75,
    speedMult: 0.55,
    radiusMult: 0.9,
    palette: { core: "#bbf7d0", mid: "#16a34a", edge: "#14532d", glow: "rgba(22,163,74,0.65)" },
  },
];

// Stage index (1-based) → ordered list of monster type ids in play that stage. A stage beyond
// this list reuses the last entry — see lib/monster-stage.ts.
export const STAGE_ROSTERS: string[][] = [
  ["crawler"], // Stage 1 (levels 1-10): learn the basics
  ["crawler", "stalker"], // Stage 2 (levels 11-20): faster threats enter
  ["crawler", "stalker", "brute"], // Stage 3 (levels 21-30): tanky bruisers show up
  ["stalker", "brute", "spitter"], // Stage 4+ (levels 31+): ranged attackers, crawlers retire
];

export function getMonsterType(id: string): MonsterTypeDef {
  return MONSTER_TYPES.find((m) => m.id === id) ?? MONSTER_TYPES[0];
}
