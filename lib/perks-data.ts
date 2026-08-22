// Zero imports — client-bundle-safe, mirrors lib/bosses-data.ts / lib/quizlets-data.ts.
// Rarity strings reuse the RARITY_COLORS vocabulary in lib/utils.ts (common/uncommon/rare/
// epic/legendary/impossible) so perk cards inherit the established borders and glows.
//
// Two families of perk live here:
//  - Stat perks (damageMult, speedMult, ...) fold into RunStats via lib/perk-roll.ts's
//    aggregatePerks() — flat multipliers/additions the engine already reads every frame.
//  - Ability perks (grantsTurret, grantsBarrier, ...) unlock a whole extra piece of gameplay
//    simulated by monster-hunter-engine.ts, aggregated into AbilityState via
//    aggregatePerks-adjacent aggregateAbilities(). Each ability has its own unlock perk plus
//    a handful of `requires`-gated upgrade perks, so picking one is a build-defining choice —
//    not just another multiplier — and stacking its upgrades visibly changes how it looks and
//    plays (see monster-hunter-engine.ts drawWorld's turret/barrier/nova rendering).

export type PerkEffect = {
  damageMult?: number;    // multiplies laser damage
  fireRateMult?: number;  // multiplies the cooldown between shots (lower = faster)
  projectiles?: number;   // extra lasers fired per shot, spread around the aim direction
  speedMult?: number;     // multiplies player move speed
  maxHpAdd?: number;      // flat bonus to max HP, healed immediately on pickup
  visionAdd?: number;     // extra vision radius, in tiles
  pierceAdd?: number;     // extra monsters a single laser can pass through
  xpMult?: number;        // multiplies gem XP gained
  lifestealPct?: number;  // fraction of laser damage dealt returned as HP

  // ── Turret Drone ability ────────────────────────────────────────────────────
  grantsTurret?: boolean;       // unlocks the orbiting turret drone
  turretDamageMult?: number;    // multiplies turret shot damage
  turretFireRateMult?: number;  // multiplies the turret's cooldown between shots
  turretRangeMult?: number;     // multiplies the turret's engagement range
  turretProjectiles?: number;   // extra pellets per turret shot
  turretSmartTargeting?: boolean; // turret targets the weakest monster in range instead of the nearest

  // ── Kinetic Barrier ability ─────────────────────────────────────────────────
  grantsBarrier?: boolean;      // unlocks a recharging shield that fully absorbs the next hit
  barrierRechargeMult?: number; // multiplies the shield's recharge time

  // ── Nova Burst ability ───────────────────────────────────────────────────────
  grantsNovaBurst?: boolean;    // unlocks a periodic damaging pulse centered on the player
  novaDamageMult?: number;      // multiplies Nova Burst damage
  novaRadiusMult?: number;      // multiplies Nova Burst radius

  // ── Second Wind ability ──────────────────────────────────────────────────────
  grantsSecondWind?: boolean;   // unlocks a speed + bonus-invincibility burst whenever you take a hit
};

export type PerkDef = {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  description: string;
  effect: PerkEffect;
  maxStacks: number; // how many times this perk can be picked in a single run
  requires?: string;  // another perk's id that must already be owned for this one to be offered
};

export const PERKS_DATA: PerkDef[] = [
  // ── COMMON ──────────────────────────────────────────────────────────────────
  { id: "sharpened-bolts", name: "Sharpened Bolts", icon: "🔪", rarity: "common", description: "+15% laser damage.", effect: { damageMult: 1.15 }, maxStacks: 5 },
  { id: "light-boots", name: "Light Boots", icon: "🥾", rarity: "common", description: "+10% move speed.", effect: { speedMult: 1.1 }, maxStacks: 5 },
  { id: "thick-hide", name: "Thick Hide", icon: "🛡️", rarity: "common", description: "+15 max HP.", effect: { maxHpAdd: 15 }, maxStacks: 5 },
  { id: "keen-eye", name: "Keen Eye", icon: "👁️", rarity: "common", description: "+10% XP from gems.", effect: { xpMult: 1.1 }, maxStacks: 5 },

  // ── UNCOMMON ─────────────────────────────────────────────────────────────────
  { id: "quick-trigger", name: "Quick Trigger", icon: "⚡", rarity: "uncommon", description: "5% faster fire rate.", effect: { fireRateMult: 0.95 }, maxStacks: 5 },
  { id: "reinforced-plating", name: "Reinforced Plating", icon: "🔩", rarity: "uncommon", description: "+25 max HP.", effect: { maxHpAdd: 25 }, maxStacks: 4 },
  { id: "swift-feet", name: "Swift Feet", icon: "👟", rarity: "uncommon", description: "+18% move speed.", effect: { speedMult: 1.18 }, maxStacks: 4 },
  { id: "lantern-eyes", name: "Lantern Eyes", icon: "🏮", rarity: "uncommon", description: "+1 vision radius.", effect: { visionAdd: 1 }, maxStacks: 3 },
  { id: "turret-overclock", name: "Turret Overclock", icon: "⚡", rarity: "uncommon", description: "Turret fires 15% faster.", effect: { turretFireRateMult: 0.85 }, maxStacks: 4, requires: "turret-drone" },
  { id: "barrier-capacitor", name: "Barrier Capacitor", icon: "🔋", rarity: "uncommon", description: "Kinetic Barrier recharges 20% faster.", effect: { barrierRechargeMult: 0.8 }, maxStacks: 3, requires: "kinetic-barrier" },
  { id: "second-wind", name: "Second Wind", icon: "🌀", rarity: "uncommon", description: "Getting hit grants a burst of speed and extra invincibility to help you escape.", effect: { grantsSecondWind: true }, maxStacks: 1 },

  // ── RARE ─────────────────────────────────────────────────────────────────────
  { id: "nightsight", name: "Nightsight", icon: "🌙", rarity: "rare", description: "+2 vision radius.", effect: { visionAdd: 2 }, maxStacks: 2 },
  { id: "piercing-rounds", name: "Piercing Rounds", icon: "🎯", rarity: "rare", description: "Lasers pierce 1 extra monster.", effect: { pierceAdd: 1 }, maxStacks: 3 },
  { id: "vampiric-glow", name: "Vampiric Glow", icon: "🩸", rarity: "rare", description: "Heal for 8% of laser damage dealt.", effect: { lifestealPct: 0.08 }, maxStacks: 2 },
  { id: "hasty-reload", name: "Hasty Reload", icon: "🔁", rarity: "rare", description: "12% faster fire rate.", effect: { fireRateMult: 0.88 }, maxStacks: 2 },
  { id: "turret-drone", name: "Turret Drone", icon: "🛰️", rarity: "rare", description: "Deploys a drone that orbits you and auto-fires at nearby monsters.", effect: { grantsTurret: true }, maxStacks: 1 },
  { id: "turret-array", name: "Turret Array", icon: "📡", rarity: "rare", description: "+25% turret range.", effect: { turretRangeMult: 1.25 }, maxStacks: 3, requires: "turret-drone" },
  { id: "nova-amplifier", name: "Nova Amplifier", icon: "🌟", rarity: "rare", description: "+30% Nova Burst damage.", effect: { novaDamageMult: 1.3 }, maxStacks: 3, requires: "nova-burst" },
  { id: "nova-expansion", name: "Nova Expansion", icon: "🌊", rarity: "rare", description: "+20% Nova Burst radius.", effect: { novaRadiusMult: 1.2 }, maxStacks: 2, requires: "nova-burst" },

  // ── EPIC ─────────────────────────────────────────────────────────────────────
  { id: "trishot", name: "Trishot", icon: "🔱", rarity: "epic", description: "Fire 2 extra lasers per shot, spread around your aim.", effect: { projectiles: 2 }, maxStacks: 1 },
  { id: "adrenaline", name: "Adrenaline", icon: "💉", rarity: "epic", description: "+30% move speed, +25% fire rate.", effect: { speedMult: 1.3, fireRateMult: 0.75 }, maxStacks: 1 },
  { id: "vital-surge", name: "Vital Surge", icon: "❤️‍🔥", rarity: "epic", description: "+50 max HP.", effect: { maxHpAdd: 50 }, maxStacks: 1 },
  { id: "twin-cannons", name: "Twin Cannons", icon: "🎇", rarity: "epic", description: "Turret fires 1 extra projectile per shot.", effect: { turretProjectiles: 1 }, maxStacks: 2, requires: "turret-drone" },
  { id: "turret-barrage", name: "Turret Barrage", icon: "💥", rarity: "epic", description: "+25% turret damage.", effect: { turretDamageMult: 1.25 }, maxStacks: 3, requires: "turret-drone" },
  { id: "nova-burst", name: "Nova Burst", icon: "💫", rarity: "epic", description: "Periodically unleashes a damaging pulse around you, hitting every nearby monster at once.", effect: { grantsNovaBurst: true }, maxStacks: 1 },

  // ── LEGENDARY ────────────────────────────────────────────────────────────────
  { id: "overcharge", name: "Overcharge", icon: "☢️", rarity: "legendary", description: "2× laser damage.", effect: { damageMult: 2 }, maxStacks: 1 },
  { id: "eagle-eye", name: "Eagle Eye", icon: "🦅", rarity: "legendary", description: "+3 vision radius.", effect: { visionAdd: 3 }, maxStacks: 1 },
  { id: "gemhoarder", name: "Gemhoarder", icon: "💎", rarity: "legendary", description: "+75% XP from gems.", effect: { xpMult: 1.75 }, maxStacks: 1 },
  { id: "precision-targeting", name: "Precision Targeting", icon: "🔭", rarity: "legendary", description: "Turret always finishes off the weakest monster in range instead of the nearest.", effect: { turretSmartTargeting: true }, maxStacks: 1, requires: "turret-drone" },
  { id: "kinetic-barrier", name: "Kinetic Barrier", icon: "🔷", rarity: "legendary", description: "A recharging shield fully absorbs the next hit you take, then needs time to recharge.", effect: { grantsBarrier: true }, maxStacks: 1 },

  // ── IMPOSSIBLE ───────────────────────────────────────────────────────────────
  { id: "singularity", name: "Singularity", icon: "🌌", rarity: "impossible", description: "4 lasers per shot, pierce +3, 1.5× damage.", effect: { projectiles: 4, pierceAdd: 3, damageMult: 1.5 }, maxStacks: 1 },
];

export const getPerk = (id: string): PerkDef | undefined => PERKS_DATA.find((p) => p.id === id);
