// Zero imports — client-bundle-safe, mirrors lib/monsters-data.ts / lib/perks-data.ts.
// Every stat here is a MULTIPLIER (or, for tower cost, an absolute) against a TD_* base
// constant in lib/game-config.ts, never an absolute of its own — so global balance lives in
// one file and content lives in this one. `spriteId` keys into CREEP_SPRITES/TOWER_SPRITES in
// components/game/td-sprites.ts (kept out of lib/ because vitest's coverage.include is
// lib/**/*.ts and canvas-only code would permanently distort that report).

export type TdPalette = { core: string; mid: string; edge: string; glow: string };

export type CreepBehavior =
  | "ground" // baseline: walks the lane at base speed
  | "swift" // fast, fragile — punishes a build with no slow
  | "armored" // flat damage reduction, slow — punishes a build with no armor pierce
  | "flying" // hovers off-lane with a drop shadow; towers without canHitAir can't target it
  | "swarm" // spawns in tight packs, individually trivial — punishes single-target-only
  | "regen" // heals a % of max HP per second — punishes low sustained DPS
  | "boss"; // one per stage, oversized, a leak costs TD_BOSS_LEAK_LIVES instead of 1

export type BossOverlay = "crown" | "shards" | "horns";

export type CreepTypeDef = {
  id: string;
  name: string;
  icon: string; // emoji, used in the HUD wave-preview strip
  behavior: CreepBehavior;
  hpMult: number; // × TD_CREEP_BASE_HP
  speedMult: number; // × TD_CREEP_BASE_SPEED_TILES
  armor: number; // flat damage subtracted per hit, floored at TD_MIN_DAMAGE_AFTER_ARMOR
  bountyMult: number; // × TD_CREEP_BASE_BOUNTY
  radiusMult: number; // × (tilePx * 0.34)
  palette: TdPalette;
  spriteId: string; // key into CREEP_SPRITES
  regenBoss?: boolean; // magmalord only — regen behavior layered onto a boss without overloading `behavior`
  bossOverlay?: BossOverlay; // drawn on top of the base sprite for boss variants
};

export type TowerTargeting = "first" | "strongest" | "nearest";
export type TowerSpecial = "none" | "splash" | "slow" | "pierce-armor" | "chain" | "aura";

export type TowerTypeDef = {
  id: string;
  name: string;
  icon: string;
  tagline: string; // one-line role, shown on the shop card
  tier: "common" | "uncommon" | "rare" | "epic"; // keys RARITY_COLORS in lib/utils.ts
  cost: number; // absolute gold — the one exception to the multiplier rule
  damage: number; // per shot at level 1
  cooldownMs: number; // between shots at level 1
  rangeTiles: number; // at level 1
  targeting: TowerTargeting;
  canHitAir: boolean;
  special: TowerSpecial;
  palette: TdPalette;
  spriteId: string; // key into TOWER_SPRITES
};

export type PathPoint = { x: number; y: number };

export type StageTheme = {
  bgTop: string;
  bgBottom: string;
  terrainId: "grass" | "cavern" | "basalt"; // key into TERRAIN_TILE_PAINTERS in td-sprites.ts
  pathTop: string;
  pathBottom: string;
  pathEdge: string;
  accent: string; // HUD stage-pill / banner colour
  ambient: "none" | "fireflies" | "dripping" | "embers";
};

export type StageDef = {
  id: string;
  name: string;
  subtitle: string;
  path: PathPoint[]; // grid-cell waypoints; deliberately start/end off-grid so creeps walk on/off
  roster: string[]; // creep ids, ordered easiest → hardest
  bossId: string; // creep id used on the stage's final wave
  theme: StageTheme;
};

// ─── Creeps ─────────────────────────────────────────────────────────────────────

export const CREEP_TYPES: CreepTypeDef[] = [
  // ── Stage 1 — Greenfield ──
  { id: "slime", name: "Slime", icon: "🟢", behavior: "ground", hpMult: 1.0, speedMult: 1.0, armor: 0, bountyMult: 1.0, radiusMult: 1.0, palette: { core: "#bbf7d0", mid: "#22c55e", edge: "#14532d", glow: "rgba(34,197,94,0.6)" }, spriteId: "slime" },
  { id: "gnawer", name: "Gnawer", icon: "🐀", behavior: "swift", hpMult: 0.55, speedMult: 1.75, armor: 0, bountyMult: 0.85, radiusMult: 0.8, palette: { core: "#e7d5c0", mid: "#a16207", edge: "#451a03", glow: "rgba(161,98,7,0.6)" }, spriteId: "gnawer" },
  { id: "tusker", name: "Tusk Boar", icon: "🐗", behavior: "armored", hpMult: 2.2, speedMult: 0.70, armor: 3, bountyMult: 2.0, radiusMult: 1.25, palette: { core: "#fecdd3", mid: "#9f1239", edge: "#4c0519", glow: "rgba(159,18,57,0.6)" }, spriteId: "tusker" },
  { id: "ogreking", name: "Ogre King", icon: "👑", behavior: "boss", hpMult: 14, speedMult: 0.50, armor: 5, bountyMult: 20, radiusMult: 2.2, palette: { core: "#fecdd3", mid: "#9f1239", edge: "#4c0519", glow: "rgba(159,18,57,0.8)" }, spriteId: "tusker", bossOverlay: "crown" },

  // ── Stage 2 — Hollow Depths ──
  { id: "cavebat", name: "Cave Bat", icon: "🦇", behavior: "flying", hpMult: 0.70, speedMult: 1.45, armor: 0, bountyMult: 1.5, radiusMult: 0.85, palette: { core: "#e9d5ff", mid: "#7c3aed", edge: "#2e1065", glow: "rgba(124,58,237,0.6)" }, spriteId: "cavebat" },
  { id: "spinner", name: "Web Spinner", icon: "🕷️", behavior: "swarm", hpMult: 0.50, speedMult: 1.20, armor: 0, bountyMult: 0.7, radiusMult: 0.75, palette: { core: "#d9f99d", mid: "#65a30d", edge: "#1a2e05", glow: "rgba(101,163,13,0.6)" }, spriteId: "spinner" },
  { id: "golem", name: "Stone Golem", icon: "🗿", behavior: "armored", hpMult: 3.4, speedMult: 0.55, armor: 6, bountyMult: 3.3, radiusMult: 1.4, palette: { core: "#cbd5e1", mid: "#475569", edge: "#0f172a", glow: "rgba(71,85,105,0.6)" }, spriteId: "golem" },
  { id: "crystaltyrant", name: "Crystal Tyrant", icon: "💎", behavior: "boss", hpMult: 22, speedMult: 0.45, armor: 10, bountyMult: 32, radiusMult: 2.2, palette: { core: "#cbd5e1", mid: "#475569", edge: "#0f172a", glow: "rgba(148,163,184,0.8)" }, spriteId: "golem", bossOverlay: "shards" },

  // ── Stage 3 — Ashfall Caldera ──
  { id: "magmaimp", name: "Magma Imp", icon: "👹", behavior: "swift", hpMult: 0.90, speedMult: 1.80, armor: 1, bountyMult: 2.0, radiusMult: 0.9, palette: { core: "#fed7aa", mid: "#ea580c", edge: "#7c2d12", glow: "rgba(234,88,12,0.6)" }, spriteId: "magmaimp" },
  { id: "ashwraith", name: "Ash Wraith", icon: "👻", behavior: "regen", hpMult: 1.6, speedMult: 0.95, armor: 2, bountyMult: 3.0, radiusMult: 1.05, palette: { core: "#e2e8f0", mid: "#64748b", edge: "#020617", glow: "rgba(100,116,139,0.6)" }, spriteId: "ashwraith" },
  { id: "emberdrake", name: "Ember Drake", icon: "🐉", behavior: "flying", hpMult: 2.0, speedMult: 1.25, armor: 2, bountyMult: 4.0, radiusMult: 1.2, palette: { core: "#fecaca", mid: "#dc2626", edge: "#450a0a", glow: "rgba(220,38,38,0.6)" }, spriteId: "emberdrake" },
  { id: "magmalord", name: "Magma Lord", icon: "🔥", behavior: "boss", hpMult: 34, speedMult: 0.55, armor: 8, bountyMult: 50, radiusMult: 2.2, palette: { core: "#e2e8f0", mid: "#64748b", edge: "#020617", glow: "rgba(220,38,38,0.85)" }, spriteId: "ashwraith", bossOverlay: "horns", regenBoss: true },
];

export function getCreepType(id: string): CreepTypeDef {
  return CREEP_TYPES.find((c) => c.id === id) ?? CREEP_TYPES[0];
}

// ─── Towers ─────────────────────────────────────────────────────────────────────
// Roles are deliberately non-overlapping: swift creeps need Frost, armored need Sniper (or
// overwhelming Tesla volume), swarms need Cannon, flyers need anything but Cannon, regen needs
// burst (Sniper + Beacon), and a dense corner cluster is what makes Beacon worth its cost.

export const TOWER_TYPES: TowerTypeDef[] = [
  { id: "arrow", name: "Arrow Tower", icon: "🏹", tagline: "Reliable single-target chip damage", tier: "common", cost: 90, damage: 12, cooldownMs: 550, rangeTiles: 2.6, targeting: "first", canHitAir: true, special: "none", palette: { core: "#fef3c7", mid: "#b45309", edge: "#451a03", glow: "rgba(180,83,9,0.6)" }, spriteId: "arrow" },
  { id: "frost", name: "Frost Spire", icon: "❄️", tagline: "Slows anything it hits — stops rushes cold", tier: "uncommon", cost: 140, damage: 6, cooldownMs: 900, rangeTiles: 2.2, targeting: "first", canHitAir: true, special: "slow", palette: { core: "#e0f2fe", mid: "#0ea5e9", edge: "#0c4a6e", glow: "rgba(14,165,233,0.6)" }, spriteId: "frost" },
  { id: "cannon", name: "Cannon", icon: "💣", tagline: "Splash damage — shreds packed swarms", tier: "uncommon", cost: 160, damage: 26, cooldownMs: 1400, rangeTiles: 2.4, targeting: "strongest", canHitAir: false, special: "splash", palette: { core: "#fecaca", mid: "#b91c1c", edge: "#450a0a", glow: "rgba(185,28,28,0.6)" }, spriteId: "cannon" },
  { id: "beacon", name: "War Beacon", icon: "🚩", tagline: "Buffs every tower in its aura — no damage of its own", tier: "rare", cost: 180, damage: 0, cooldownMs: 0, rangeTiles: 2.5, targeting: "nearest", canHitAir: false, special: "aura", palette: { core: "#fef9c3", mid: "#ca8a04", edge: "#422006", glow: "rgba(202,138,4,0.6)" }, spriteId: "beacon" },
  { id: "sniper", name: "Sniper Nest", icon: "🎯", tagline: "Ignores all armor — the answer to tanks", tier: "rare", cost: 200, damage: 55, cooldownMs: 2000, rangeTiles: 6.0, targeting: "strongest", canHitAir: true, special: "pierce-armor", palette: { core: "#dcfce7", mid: "#15803d", edge: "#052e16", glow: "rgba(21,128,61,0.6)" }, spriteId: "sniper" },
  { id: "tesla", name: "Tesla Coil", icon: "⚡", tagline: "Chains between nearby creeps — great vs groups", tier: "epic", cost: 220, damage: 18, cooldownMs: 800, rangeTiles: 2.8, targeting: "nearest", canHitAir: true, special: "chain", palette: { core: "#ede9fe", mid: "#7c3aed", edge: "#2e1065", glow: "rgba(124,58,237,0.7)" }, spriteId: "tesla" },
];

export function getTowerType(id: string): TowerTypeDef {
  return TOWER_TYPES.find((t) => t.id === id) ?? TOWER_TYPES[0];
}

// ─── Stages ─────────────────────────────────────────────────────────────────────
// Paths are axis-aligned waypoints in the TD_GRID_COLS×TD_GRID_ROWS grid, deliberately
// starting/ending off-grid so creeps walk on and off the board instead of popping into
// existence. All three verified non-self-intersecting on the tile grid.

export const TD_STAGES: StageDef[] = [
  {
    id: "greenfield",
    name: "Greenfield",
    subtitle: "The wilds wake up",
    path: [{ x: -1, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 8 }, { x: 11, y: 8 }, { x: 11, y: 3 }, { x: 16, y: 3 }, { x: 16, y: 9 }, { x: 20, y: 9 }],
    roster: ["slime", "gnawer", "tusker"],
    bossId: "ogreking",
    theme: {
      bgTop: "#1b3a1f",
      bgBottom: "#0d1f10",
      terrainId: "grass",
      pathTop: "#6b4f2a",
      pathBottom: "#4a3419",
      pathEdge: "#2e2010",
      accent: "#4ade80",
      ambient: "fireflies",
    },
  },
  {
    id: "hollow-depths",
    name: "Hollow Depths",
    subtitle: "Something breathes below",
    path: [{ x: -1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 6 }, { x: 8, y: 6 }, { x: 8, y: 2 }, { x: 13, y: 2 }, { x: 13, y: 9 }, { x: 6, y: 9 }, { x: 6, y: 11 }, { x: 20, y: 11 }],
    roster: ["cavebat", "spinner", "golem"],
    bossId: "crystaltyrant",
    theme: {
      bgTop: "#1a1630",
      bgBottom: "#0a0716",
      terrainId: "cavern",
      pathTop: "#3f3a52",
      pathBottom: "#241f33",
      pathEdge: "#150f22",
      accent: "#a78bfa",
      ambient: "dripping",
    },
  },
  {
    id: "ashfall-caldera",
    name: "Ashfall Caldera",
    subtitle: "The mountain is awake",
    path: [{ x: -1, y: 10 }, { x: 4, y: 10 }, { x: 4, y: 2 }, { x: 9, y: 2 }, { x: 9, y: 7 }, { x: 14, y: 7 }, { x: 14, y: 2 }, { x: 18, y: 2 }, { x: 18, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 12 }],
    roster: ["magmaimp", "ashwraith", "emberdrake"],
    bossId: "magmalord",
    theme: {
      bgTop: "#3b1208",
      bgBottom: "#14060c",
      terrainId: "basalt",
      pathTop: "#57200f",
      pathBottom: "#2a0d06",
      pathEdge: "#170603",
      accent: "#fb923c",
      ambient: "embers",
    },
  },
];

/** 1-based; stages beyond the defined list reuse the last one — same contract as getStageRoster in lib/monster-stage.ts. */
export function getStageDef(stage: number): StageDef {
  const idx = Math.min(Math.max(1, stage), TD_STAGES.length) - 1;
  return TD_STAGES[idx];
}
