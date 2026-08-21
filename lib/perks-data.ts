// Zero imports — client-bundle-safe, mirrors lib/bosses-data.ts / lib/quizlets-data.ts.
// Rarity strings reuse the RARITY_COLORS vocabulary in lib/utils.ts (common/uncommon/rare/
// epic/legendary/impossible) so perk cards inherit the established borders and glows.

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
};

export type PerkDef = {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  description: string;
  effect: PerkEffect;
  maxStacks: number; // how many times this perk can be picked in a single run
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

  // ── RARE ─────────────────────────────────────────────────────────────────────
  { id: "nightsight", name: "Nightsight", icon: "🌙", rarity: "rare", description: "+2 vision radius.", effect: { visionAdd: 2 }, maxStacks: 2 },
  { id: "piercing-rounds", name: "Piercing Rounds", icon: "🎯", rarity: "rare", description: "Lasers pierce 1 extra monster.", effect: { pierceAdd: 1 }, maxStacks: 3 },
  { id: "vampiric-glow", name: "Vampiric Glow", icon: "🩸", rarity: "rare", description: "Heal for 8% of laser damage dealt.", effect: { lifestealPct: 0.08 }, maxStacks: 2 },
  { id: "hasty-reload", name: "Hasty Reload", icon: "🔁", rarity: "rare", description: "12% faster fire rate.", effect: { fireRateMult: 0.88 }, maxStacks: 2 },

  // ── EPIC ─────────────────────────────────────────────────────────────────────
  { id: "trishot", name: "Trishot", icon: "🔱", rarity: "epic", description: "Fire 2 extra lasers per shot, spread around your aim.", effect: { projectiles: 2 }, maxStacks: 1 },
  { id: "adrenaline", name: "Adrenaline", icon: "💉", rarity: "epic", description: "+30% move speed, +25% fire rate.", effect: { speedMult: 1.3, fireRateMult: 0.75 }, maxStacks: 1 },
  { id: "vital-surge", name: "Vital Surge", icon: "❤️‍🔥", rarity: "epic", description: "+50 max HP.", effect: { maxHpAdd: 50 }, maxStacks: 1 },

  // ── LEGENDARY ────────────────────────────────────────────────────────────────
  { id: "overcharge", name: "Overcharge", icon: "☢️", rarity: "legendary", description: "2× laser damage.", effect: { damageMult: 2 }, maxStacks: 1 },
  { id: "eagle-eye", name: "Eagle Eye", icon: "🦅", rarity: "legendary", description: "+3 vision radius.", effect: { visionAdd: 3 }, maxStacks: 1 },
  { id: "gemhoarder", name: "Gemhoarder", icon: "💎", rarity: "legendary", description: "+75% XP from gems.", effect: { xpMult: 1.75 }, maxStacks: 1 },

  // ── IMPOSSIBLE ───────────────────────────────────────────────────────────────
  { id: "singularity", name: "Singularity", icon: "🌌", rarity: "impossible", description: "4 lasers per shot, pierce +3, 1.5× damage.", effect: { projectiles: 4, pierceAdd: 3, damageMult: 1.5 }, maxStacks: 1 },
];

export const getPerk = (id: string): PerkDef | undefined => PERKS_DATA.find((p) => p.id === id);
