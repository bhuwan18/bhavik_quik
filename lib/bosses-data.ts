export type BossDef = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  taunt: string;       // shown when a player answers a boss-battle question wrong
  colorFrom: string;
  colorTo: string;
  baseHp: number;       // 500–1500
  variant: "round" | "spiky" | "serpentine"; // BossCreature body silhouette
};

export const BOSSES_DATA: BossDef[] = [
  {
    slug: "glitchwyrm",
    name: "Glitchwyrm",
    icon: "🐉",
    description: "A serpent stitched together from corrupted save files. Every wrong answer feeds it.",
    taunt: "Is that the best you've got?",
    colorFrom: "#22c55e",
    colorTo: "#166534",
    baseHp: 750,
    variant: "serpentine",
  },
  {
    slug: "obsidian-sentinel",
    name: "Obsidian Sentinel",
    icon: "🗿",
    description: "An ancient guardian carved from pure exam-hall dread. It has never lost.",
    taunt: "Predictable.",
    colorFrom: "#64748b",
    colorTo: "#1e293b",
    baseHp: 1100,
    variant: "spiky",
  },
  {
    slug: "cinderclaw",
    name: "Cinderclaw",
    icon: "🦂",
    description: "A scorpion forged in the embers of a thousand pop quizzes.",
    taunt: "You call that an answer?",
    colorFrom: "#f97316",
    colorTo: "#7c2d12",
    baseHp: 650,
    variant: "spiky",
  },
  {
    slug: "voidmaw",
    name: "Voidmaw",
    icon: "🦑",
    description: "A creature from beyond the syllabus. It swallows wrong answers whole and grows stronger.",
    taunt: "Weak.",
    colorFrom: "#8b5cf6",
    colorTo: "#312e81",
    baseHp: 1400,
    variant: "round",
  },
  {
    slug: "frostfang",
    name: "Frostfang",
    icon: "🐺",
    description: "A wolf of pure exam-week panic, frozen mid-howl and thawing with every mistake.",
    taunt: "Try again. If you can.",
    colorFrom: "#38bdf8",
    colorTo: "#0c4a6e",
    baseHp: 850,
    variant: "spiky",
  },
  {
    slug: "goldmaw-tyrant",
    name: "Goldmaw Tyrant",
    icon: "🦖",
    description: "A gilded beast that hoards coins stolen from the daily leaderboard.",
    taunt: "Pathetic.",
    colorFrom: "#facc15",
    colorTo: "#854d0e",
    baseHp: 1250,
    variant: "serpentine",
  },
  {
    slug: "shade-of-doubt",
    name: "Shade of Doubt",
    icon: "👤",
    description: "A shadow that whispers the wrong answer just before you click.",
    taunt: "Second-guessing yourself already?",
    colorFrom: "#a1a1aa",
    colorTo: "#27272a",
    baseHp: 550,
    variant: "round",
  },
  {
    slug: "tempest-roc",
    name: "Tempest Roc",
    icon: "🦅",
    description: "A storm-bird that circles above every timed round, screeching at the clock.",
    taunt: "Too slow.",
    colorFrom: "#60a5fa",
    colorTo: "#1e3a8a",
    baseHp: 950,
    variant: "serpentine",
  },
];

/** Picks the next boss, avoiding an immediate repeat of the last defeated/expired boss. */
export function pickNextBoss(lastSlug?: string | null): BossDef {
  const pool = lastSlug ? BOSSES_DATA.filter((b) => b.slug !== lastSlug) : BOSSES_DATA;
  const candidates = pool.length > 0 ? pool : BOSSES_DATA;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** Looks up a boss's creature body variant by slug — client-safe (no DB/prisma import). */
export function getBossVariant(slug: string): BossDef["variant"] {
  return BOSSES_DATA.find((b) => b.slug === slug)?.variant ?? "round";
}
