export type MilestoneTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "cosmic";
export type MilestoneType = "coins" | "quizzes" | "answers" | "categories" | "streak";

export interface MilestoneDef {
  threshold: number;
  name: string;
  emoji: string;
  tier: MilestoneTier;
  colorFrom: string;
  colorTo: string;
  description: string;
  animationClass?: string;
  milestoneType: MilestoneType;
}

// Internal base type used to build typed milestone arrays
interface MilestoneDefBase {
  threshold: number;
  name: string;
  emoji: string;
  tier: MilestoneTier;
  colorFrom: string;
  colorTo: string;
  description: string;
  animationClass?: string;
}

export const MILESTONE_THRESHOLDS: number[] = [
  ...Array.from({ length: 60 }, (_, i) => (i + 1) * 1000),
  65000, 70000, 75000, 85000, 100000,
];

const COIN_MILESTONES_RAW: MilestoneDefBase[] = [
  // ── Bronze (1K–5K) ──────────────────────────────────────────────────────────
  {
    threshold: 1000,
    name: "First Step",
    emoji: "🪙",
    tier: "bronze",
    colorFrom: "#92400e",
    colorTo: "#b45309",
    description: "Earned your first 1,000 coins. The journey begins!",
  },
  {
    threshold: 2000,
    name: "Coin Collector",
    emoji: "💰",
    tier: "bronze",
    colorFrom: "#78350f",
    colorTo: "#d97706",
    description: "2,000 coins in the bank. You're getting the hang of it!",
  },
  {
    threshold: 3000,
    name: "Quiz Enthusiast",
    emoji: "📚",
    tier: "bronze",
    colorFrom: "#92400e",
    colorTo: "#f59e0b",
    description: "3,000 coins earned — a true quiz enthusiast.",
  },
  {
    threshold: 4000,
    name: "Copper Crown",
    emoji: "🏅",
    tier: "bronze",
    colorFrom: "#7c2d12",
    colorTo: "#ea580c",
    description: "4,000 coins. The copper crown is yours!",
  },
  {
    threshold: 5000,
    name: "Bronze Champion",
    emoji: "🥉",
    tier: "bronze",
    colorFrom: "#92400e",
    colorTo: "#c2410c",
    description: "5,000 coins! You've mastered the bronze tier.",
  },

  // ── Silver (6K–10K) ─────────────────────────────────────────────────────────
  {
    threshold: 6000,
    name: "Silver Spark",
    emoji: "⚡",
    tier: "silver",
    colorFrom: "#334155",
    colorTo: "#64748b",
    description: "6,000 coins — the silver era has begun.",
  },
  {
    threshold: 7000,
    name: "Steel Resolve",
    emoji: "🛡️",
    tier: "silver",
    colorFrom: "#1e293b",
    colorTo: "#475569",
    description: "7,000 coins of pure determination.",
  },
  {
    threshold: 8000,
    name: "Moonbeam",
    emoji: "🌙",
    tier: "silver",
    colorFrom: "#1e3a5f",
    colorTo: "#94a3b8",
    description: "8,000 coins bright as the moon.",
  },
  {
    threshold: 9000,
    name: "Quicksilver",
    emoji: "💨",
    tier: "silver",
    colorFrom: "#0f172a",
    colorTo: "#64748b",
    description: "9,000 coins — moving at quicksilver speed!",
  },
  {
    threshold: 10000,
    name: "Silver Legend",
    emoji: "🥈",
    tier: "silver",
    colorFrom: "#1e293b",
    colorTo: "#cbd5e1",
    description: "10,000 coins! A true silver legend.",
  },

  // ── Gold (11K–20K) ──────────────────────────────────────────────────────────
  {
    threshold: 11000,
    name: "Golden Touch",
    emoji: "✨",
    tier: "gold",
    colorFrom: "#713f12",
    colorTo: "#ca8a04",
    description: "11,000 coins — everything you touch turns to gold.",
    animationClass: "legendary-card",
  },
  {
    threshold: 12000,
    name: "Sun Seeker",
    emoji: "☀️",
    tier: "gold",
    colorFrom: "#78350f",
    colorTo: "#eab308",
    description: "12,000 coins blazing like the sun.",
    animationClass: "legendary-card",
  },
  {
    threshold: 13000,
    name: "Golden Streak",
    emoji: "🔥",
    tier: "gold",
    colorFrom: "#92400e",
    colorTo: "#f59e0b",
    description: "13,000 coins on a golden streak.",
    animationClass: "legendary-card",
  },
  {
    threshold: 14000,
    name: "Gilded Mind",
    emoji: "🧠",
    tier: "gold",
    colorFrom: "#713f12",
    colorTo: "#fbbf24",
    description: "14,000 coins — a gilded mind at work.",
    animationClass: "legendary-card",
  },
  {
    threshold: 15000,
    name: "Fortune Seeker",
    emoji: "🍀",
    tier: "gold",
    colorFrom: "#78350f",
    colorTo: "#facc15",
    description: "15,000 coins. Fortune favours the persistent!",
    animationClass: "legendary-card",
  },
  {
    threshold: 16000,
    name: "Gold Rush",
    emoji: "⛏️",
    tier: "gold",
    colorFrom: "#92400e",
    colorTo: "#eab308",
    description: "16,000 coins mined from sheer effort.",
    animationClass: "legendary-card",
  },
  {
    threshold: 17000,
    name: "Aureus",
    emoji: "🏛️",
    tier: "gold",
    colorFrom: "#713f12",
    colorTo: "#f59e0b",
    description: "17,000 coins — worthy of ancient gold coins.",
    animationClass: "legendary-card",
  },
  {
    threshold: 18000,
    name: "Midas Mark",
    emoji: "👑",
    tier: "gold",
    colorFrom: "#7c2d12",
    colorTo: "#fbbf24",
    description: "18,000 coins. The Midas mark is earned.",
    animationClass: "legendary-card",
  },
  {
    threshold: 19000,
    name: "Solar Flare",
    emoji: "🌟",
    tier: "gold",
    colorFrom: "#92400e",
    colorTo: "#fde047",
    description: "19,000 coins — a solar flare of achievement.",
    animationClass: "legendary-card",
  },
  {
    threshold: 20000,
    name: "Gold Master",
    emoji: "🥇",
    tier: "gold",
    colorFrom: "#78350f",
    colorTo: "#facc15",
    description: "20,000 coins! You've achieved Gold Mastery.",
    animationClass: "legendary-card",
  },

  // ── Platinum (21K–35K) ──────────────────────────────────────────────────────
  {
    threshold: 21000,
    name: "Ice Breaker",
    emoji: "🧊",
    tier: "platinum",
    colorFrom: "#164e63",
    colorTo: "#06b6d4",
    description: "21,000 coins — breaking into platinum territory.",
  },
  {
    threshold: 22000,
    name: "Tidal Force",
    emoji: "🌊",
    tier: "platinum",
    colorFrom: "#0c4a6e",
    colorTo: "#0891b2",
    description: "22,000 coins with the force of the tide.",
  },
  {
    threshold: 23000,
    name: "Arctic Star",
    emoji: "❄️",
    tier: "platinum",
    colorFrom: "#0f172a",
    colorTo: "#22d3ee",
    description: "23,000 coins, cold and brilliant as an arctic star.",
  },
  {
    threshold: 24000,
    name: "Cyber Sage",
    emoji: "🤖",
    tier: "platinum",
    colorFrom: "#164e63",
    colorTo: "#67e8f9",
    description: "24,000 coins — the wisdom of a cyber sage.",
  },
  {
    threshold: 25000,
    name: "Quarter Century",
    emoji: "🔵",
    tier: "platinum",
    colorFrom: "#0c4a6e",
    colorTo: "#38bdf8",
    description: "25,000 coins! A quarter century of earning.",
  },
  {
    threshold: 26000,
    name: "Crystal Clear",
    emoji: "💎",
    tier: "platinum",
    colorFrom: "#0f172a",
    colorTo: "#7dd3fc",
    description: "26,000 coins — crystal clear brilliance.",
  },
  {
    threshold: 27000,
    name: "Deep Diver",
    emoji: "🐋",
    tier: "platinum",
    colorFrom: "#1e3a5f",
    colorTo: "#0ea5e9",
    description: "27,000 coins. You dive deeper than anyone.",
  },
  {
    threshold: 28000,
    name: "Glacier Peak",
    emoji: "🏔️",
    tier: "platinum",
    colorFrom: "#0c4a6e",
    colorTo: "#22d3ee",
    description: "28,000 coins atop the glacier peak.",
  },
  {
    threshold: 29000,
    name: "Prism Elite",
    emoji: "🔷",
    tier: "platinum",
    colorFrom: "#164e63",
    colorTo: "#38bdf8",
    description: "29,000 coins — the prism elite.",
  },
  {
    threshold: 30000,
    name: "Platinum Prestige",
    emoji: "🌐",
    tier: "platinum",
    colorFrom: "#0f172a",
    colorTo: "#7dd3fc",
    description: "30,000 coins! Platinum Prestige achieved.",
  },
  {
    threshold: 31000,
    name: "Frost Titan",
    emoji: "🧊",
    tier: "platinum",
    colorFrom: "#0c4a6e",
    colorTo: "#06b6d4",
    description: "31,000 coins — a titan of frost and wisdom.",
  },
  {
    threshold: 32000,
    name: "Sapphire Soul",
    emoji: "💠",
    tier: "platinum",
    colorFrom: "#1e3a5f",
    colorTo: "#0891b2",
    description: "32,000 coins with the soul of a sapphire.",
  },
  {
    threshold: 33000,
    name: "Tempest",
    emoji: "🌪️",
    tier: "platinum",
    colorFrom: "#164e63",
    colorTo: "#22d3ee",
    description: "33,000 coins — an unstoppable tempest.",
  },
  {
    threshold: 34000,
    name: "Aether Knight",
    emoji: "⚔️",
    tier: "platinum",
    colorFrom: "#0f172a",
    colorTo: "#67e8f9",
    description: "34,000 coins. The aether knight rises.",
  },
  {
    threshold: 35000,
    name: "Platinum Sovereign",
    emoji: "🏆",
    tier: "platinum",
    colorFrom: "#0c4a6e",
    colorTo: "#38bdf8",
    description: "35,000 coins! The Platinum Sovereign reigns.",
  },

  // ── Diamond (36K–50K) ───────────────────────────────────────────────────────
  {
    threshold: 36000,
    name: "Starborn",
    emoji: "🌠",
    tier: "diamond",
    colorFrom: "#3b0764",
    colorTo: "#7c3aed",
    description: "36,000 coins — born of stardust and brilliance.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 37000,
    name: "Nebula Walker",
    emoji: "🌌",
    tier: "diamond",
    colorFrom: "#2e1065",
    colorTo: "#6d28d9",
    description: "37,000 coins walking through nebulae.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 38000,
    name: "Void Breaker",
    emoji: "🌑",
    tier: "diamond",
    colorFrom: "#1e1b4b",
    colorTo: "#7c3aed",
    description: "38,000 coins breaking through the void.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 39000,
    name: "Aurora",
    emoji: "🌈",
    tier: "diamond",
    colorFrom: "#3b0764",
    colorTo: "#a855f7",
    description: "39,000 coins — radiant as the aurora borealis.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 40000,
    name: "Cosmic Forty",
    emoji: "🚀",
    tier: "diamond",
    colorFrom: "#2e1065",
    colorTo: "#c026d3",
    description: "40,000 coins! A cosmic milestone achieved.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 41000,
    name: "Prism Lord",
    emoji: "💜",
    tier: "diamond",
    colorFrom: "#1e1b4b",
    colorTo: "#8b5cf6",
    description: "41,000 coins — the Prism Lord commands.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 42000,
    name: "Galaxy Brain",
    emoji: "🧬",
    tier: "diamond",
    colorFrom: "#3b0764",
    colorTo: "#d946ef",
    description: "42,000 coins of galaxy-level thinking.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 43000,
    name: "Supernova",
    emoji: "💥",
    tier: "diamond",
    colorFrom: "#2e1065",
    colorTo: "#a855f7",
    description: "43,000 coins — a supernova of achievement.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 44000,
    name: "Eternal Flame",
    emoji: "🔮",
    tier: "diamond",
    colorFrom: "#1e1b4b",
    colorTo: "#c026d3",
    description: "44,000 coins, burning eternally bright.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 45000,
    name: "Celestial",
    emoji: "✨",
    tier: "diamond",
    colorFrom: "#3b0764",
    colorTo: "#7c3aed",
    description: "45,000 coins — celestial power unlocked.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 46000,
    name: "Arcane Ascendant",
    emoji: "🌀",
    tier: "diamond",
    colorFrom: "#2e1065",
    colorTo: "#8b5cf6",
    description: "46,000 coins. Arcane ascendance achieved.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 47000,
    name: "Infinite Spark",
    emoji: "⚡",
    tier: "diamond",
    colorFrom: "#1e1b4b",
    colorTo: "#d946ef",
    description: "47,000 coins — infinite spark, infinite potential.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 48000,
    name: "Transcendent",
    emoji: "🦋",
    tier: "diamond",
    colorFrom: "#3b0764",
    colorTo: "#a855f7",
    description: "48,000 coins. You have transcended the ordinary.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 49000,
    name: "Diamond Overlord",
    emoji: "👾",
    tier: "diamond",
    colorFrom: "#2e1065",
    colorTo: "#c026d3",
    description: "49,000 coins — overlord of the diamond realm.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 50000,
    name: "BittsQuiz Legend",
    emoji: "🏆",
    tier: "diamond",
    colorFrom: "#1e1b4b",
    colorTo: "#7c3aed",
    description: "50,000 coins! The ultimate BittsQuiz Legend.",
    animationClass: "rainbow-card",
  },

  // ── Cosmic (51K–60K) ────────────────────────────────────────────────────────
  {
    threshold: 51000,
    name: "Beyond Legend",
    emoji: "🌟",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#ff6fd8",
    description: "51,000 coins — you have surpassed legend itself.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 52000,
    name: "Myth Maker",
    emoji: "📖",
    tier: "cosmic",
    colorFrom: "#0a0118",
    colorTo: "#f0abfc",
    description: "52,000 coins — your story is now myth.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 53000,
    name: "Cosmos Reborn",
    emoji: "🌌",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#a78bfa",
    description: "53,000 coins. The cosmos itself bows to you.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 54000,
    name: "Infinity Seeker",
    emoji: "♾️",
    tier: "cosmic",
    colorFrom: "#0a0118",
    colorTo: "#e879f9",
    description: "54,000 coins chasing infinity and winning.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 55000,
    name: "Omniscient",
    emoji: "👁️",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#c084fc",
    description: "55,000 coins — all knowledge is yours.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 56000,
    name: "Singularity",
    emoji: "🕳️",
    tier: "cosmic",
    colorFrom: "#0a0118",
    colorTo: "#f472b6",
    description: "56,000 coins — a singular force in the quiz universe.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 57000,
    name: "Astral Overlord",
    emoji: "🪐",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#818cf8",
    description: "57,000 coins. The astral plane answers to you.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 58000,
    name: "Epoch Master",
    emoji: "⏳",
    tier: "cosmic",
    colorFrom: "#0a0118",
    colorTo: "#fb7185",
    description: "58,000 coins spanning epochs of achievement.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 59000,
    name: "Time Bender",
    emoji: "🌀",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#a5b4fc",
    description: "59,000 coins — you bend time to earn more.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 60000,
    name: "BittsQuiz Immortal",
    emoji: "⚜️",
    tier: "cosmic",
    colorFrom: "#0a0118",
    colorTo: "#ff6fd8",
    description: "60,000 coins! Truly immortal — the greatest BittsQuiz player of all time.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 65000,
    name: "Galactic Scholar",
    emoji: "🔭",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#f9a8d4",
    description: "65,000 coins — a scholar whose wisdom spans entire galaxies.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 70000,
    name: "Void Emperor",
    emoji: "🌑",
    tier: "cosmic",
    colorFrom: "#0a0118",
    colorTo: "#c026d3",
    description: "70,000 coins. Emperor of the void — nothing can stop you.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 75000,
    name: "Quantum Ascendant",
    emoji: "⚛️",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#a78bfa",
    description: "75,000 coins — ascending beyond the boundaries of reality.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 85000,
    name: "Eternal Sovereign",
    emoji: "👑",
    tier: "cosmic",
    colorFrom: "#0a0118",
    colorTo: "#fb7185",
    description: "85,000 coins. An eternal sovereign who rules all of time.",
    animationClass: "rainbow-card",
  },
  {
    threshold: 100000,
    name: "BittsQuiz Addicted",
    emoji: "🫀",
    tier: "cosmic",
    colorFrom: "#0d0221",
    colorTo: "#ff6fd8",
    description: "100,000 coins. Officially, irrevocably, gloriously addicted to BittsQuiz.",
    animationClass: "rainbow-card",
  },
];

export const MILESTONES: MilestoneDef[] = COIN_MILESTONES_RAW.map((m) => ({
  ...m,
  milestoneType: "coins" as MilestoneType,
}));

// ── Quizzes Played ────────────────────────────────────────────────────────────
const QUIZ_MILESTONES_RAW: MilestoneDefBase[] = [
  { threshold: 10,   name: "Quiz Rookie",       emoji: "🎮", tier: "bronze",   colorFrom: "#92400e", colorTo: "#b45309", description: "Played 10 quizzes. Just getting started!" },
  { threshold: 25,   name: "Quiz Apprentice",   emoji: "📝", tier: "bronze",   colorFrom: "#78350f", colorTo: "#d97706", description: "25 quizzes completed. You're learning fast!" },
  { threshold: 50,   name: "Quiz Practitioner", emoji: "🎯", tier: "silver",   colorFrom: "#334155", colorTo: "#64748b", description: "50 quizzes! A seasoned quiz taker." },
  { threshold: 100,  name: "Century Scorer",    emoji: "💯", tier: "gold",     colorFrom: "#713f12", colorTo: "#ca8a04", description: "100 quizzes completed. A true centurion!", animationClass: "legendary-card" },
  { threshold: 250,  name: "Quiz Veteran",      emoji: "⚔️", tier: "platinum", colorFrom: "#164e63", colorTo: "#06b6d4", description: "250 quizzes — a battle-hardened quiz veteran." },
  { threshold: 500,  name: "Quiz Overlord",     emoji: "👑", tier: "diamond",  colorFrom: "#3b0764", colorTo: "#7c3aed", description: "500 quizzes! You rule the quiz realm.", animationClass: "rainbow-card" },
  { threshold: 1000, name: "Quiz Immortal",     emoji: "♾️", tier: "cosmic",   colorFrom: "#0d0221", colorTo: "#ff6fd8", description: "1,000 quizzes! Truly immortal in dedication.", animationClass: "rainbow-card" },
];
export const QUIZ_MILESTONES: MilestoneDef[] = QUIZ_MILESTONES_RAW.map((m) => ({ ...m, milestoneType: "quizzes" as MilestoneType }));
export const QUIZ_MILESTONE_THRESHOLDS = QUIZ_MILESTONES.map((m) => m.threshold);

// ── Unique Correct Answers ────────────────────────────────────────────────────
const ANSWER_MILESTONES_RAW: MilestoneDefBase[] = [
  { threshold: 50,   name: "Sharp Eye",      emoji: "👁️", tier: "bronze",   colorFrom: "#92400e", colorTo: "#b45309", description: "50 unique correct answers. A sharp eye!" },
  { threshold: 100,  name: "Hundred Club",   emoji: "💯", tier: "bronze",   colorFrom: "#78350f", colorTo: "#d97706", description: "100 unique correct answers. Welcome to the club!" },
  { threshold: 250,  name: "Answer Machine", emoji: "🤖", tier: "silver",   colorFrom: "#334155", colorTo: "#64748b", description: "250 correct answers — a true answer machine." },
  { threshold: 500,  name: "Knowledge Base", emoji: "📚", tier: "gold",     colorFrom: "#713f12", colorTo: "#ca8a04", description: "500 unique correct answers. A living knowledge base!", animationClass: "legendary-card" },
  { threshold: 1000, name: "Trivia Master",  emoji: "🧠", tier: "platinum", colorFrom: "#164e63", colorTo: "#06b6d4", description: "1,000 correct answers. A trivia master!" },
  { threshold: 2500, name: "Encyclopedia",   emoji: "📖", tier: "diamond",  colorFrom: "#3b0764", colorTo: "#7c3aed", description: "2,500 correct answers. You are a living encyclopedia.", animationClass: "rainbow-card" },
  { threshold: 5000, name: "Oracle",         emoji: "🔮", tier: "cosmic",   colorFrom: "#0d0221", colorTo: "#ff6fd8", description: "5,000 unique correct answers. The Oracle speaks.", animationClass: "rainbow-card" },
];
export const ANSWER_MILESTONES: MilestoneDef[] = ANSWER_MILESTONES_RAW.map((m) => ({ ...m, milestoneType: "answers" as MilestoneType }));
export const ANSWER_MILESTONE_THRESHOLDS = ANSWER_MILESTONES.map((m) => m.threshold);

// ── Category Coverage ─────────────────────────────────────────────────────────
const CATEGORY_MILESTONES_RAW: MilestoneDefBase[] = [
  { threshold: 3,  name: "Dabbler",           emoji: "🗺️", tier: "bronze",   colorFrom: "#92400e", colorTo: "#b45309", description: "Tried 3 different quiz categories. A curious mind!" },
  { threshold: 5,  name: "Multitasker",       emoji: "🎭", tier: "silver",   colorFrom: "#334155", colorTo: "#64748b", description: "5 categories explored. You wear many hats!" },
  { threshold: 8,  name: "Generalist",        emoji: "🌐", tier: "gold",     colorFrom: "#713f12", colorTo: "#ca8a04", description: "8 categories conquered. A true generalist.", animationClass: "legendary-card" },
  { threshold: 11, name: "All-Rounder",       emoji: "🏆", tier: "platinum", colorFrom: "#164e63", colorTo: "#06b6d4", description: "11 categories mastered. An all-rounder extraordinaire!" },
  { threshold: 16, name: "Universal Scholar", emoji: "🌟", tier: "diamond",  colorFrom: "#3b0764", colorTo: "#7c3aed", description: "All 16 categories explored. A universal scholar!", animationClass: "rainbow-card" },
];
export const CATEGORY_MILESTONES: MilestoneDef[] = CATEGORY_MILESTONES_RAW.map((m) => ({ ...m, milestoneType: "categories" as MilestoneType }));
export const CATEGORY_MILESTONE_THRESHOLDS = CATEGORY_MILESTONES.map((m) => m.threshold);

// ── Max (Longest) Streak ──────────────────────────────────────────────────────
const STREAK_BADGE_MILESTONES_RAW: MilestoneDefBase[] = [
  { threshold: 5,   name: "On Fire",        emoji: "🔥", tier: "bronze",   colorFrom: "#92400e", colorTo: "#b45309", description: "Reached a 5-day streak. You're on fire!" },
  { threshold: 10,  name: "Hot Streak",     emoji: "⚡", tier: "bronze",   colorFrom: "#78350f", colorTo: "#d97706", description: "10-day streak! The heat is rising." },
  { threshold: 20,  name: "Dedicated",      emoji: "📅", tier: "silver",   colorFrom: "#334155", colorTo: "#64748b", description: "20-day streak. Your dedication is admirable." },
  { threshold: 30,  name: "Monthly Master", emoji: "🗓️", tier: "gold",     colorFrom: "#713f12", colorTo: "#ca8a04", description: "A full month of daily play. Incredible!", animationClass: "legendary-card" },
  { threshold: 50,  name: "Unstoppable",    emoji: "🚀", tier: "gold",     colorFrom: "#78350f", colorTo: "#eab308", description: "50-day streak — truly unstoppable.", animationClass: "legendary-card" },
  { threshold: 75,  name: "Iron Will",      emoji: "💪", tier: "platinum", colorFrom: "#164e63", colorTo: "#06b6d4", description: "75-day streak. Iron will, iron discipline." },
  { threshold: 100, name: "Centurion",      emoji: "🏅", tier: "platinum", colorFrom: "#0c4a6e", colorTo: "#0891b2", description: "100-day streak! A true centurion." },
  { threshold: 150, name: "Relentless",     emoji: "⚔️", tier: "diamond",  colorFrom: "#3b0764", colorTo: "#7c3aed", description: "150-day streak. Nothing can stop you.", animationClass: "rainbow-card" },
  { threshold: 200, name: "Bicentennial",   emoji: "🏆", tier: "diamond",  colorFrom: "#2e1065", colorTo: "#a855f7", description: "200-day streak! A legendary achievement.", animationClass: "rainbow-card" },
  { threshold: 365, name: "Year Long",      emoji: "🎊", tier: "cosmic",   colorFrom: "#0d0221", colorTo: "#ff6fd8", description: "A full year of daily quizzes. A legend among legends.", animationClass: "rainbow-card" },
];
export const STREAK_BADGE_MILESTONES: MilestoneDef[] = STREAK_BADGE_MILESTONES_RAW.map((m) => ({ ...m, milestoneType: "streak" as MilestoneType }));
export const STREAK_BADGE_MILESTONE_THRESHOLDS = STREAK_BADGE_MILESTONES.map((m) => m.threshold);

// ── Combined ──────────────────────────────────────────────────────────────────
export const ALL_MILESTONES: MilestoneDef[] = [
  ...MILESTONES,
  ...QUIZ_MILESTONES,
  ...ANSWER_MILESTONES,
  ...CATEGORY_MILESTONES,
  ...STREAK_BADGE_MILESTONES,
];

export function getMilestoneByThreshold(threshold: number): MilestoneDef {
  return MILESTONES.find((m) => m.threshold === threshold) ?? MILESTONES[0];
}

export function getMilestone(type: MilestoneType, threshold: number): MilestoneDef {
  return ALL_MILESTONES.find((m) => m.milestoneType === type && m.threshold === threshold) ?? ALL_MILESTONES[0];
}

export const TIER_COLORS: Record<MilestoneTier, { border: string; label: string; text: string }> = {
  bronze:   { border: "border-amber-600",   label: "Bronze",   text: "text-amber-500"  },
  silver:   { border: "border-slate-400",   label: "Silver",   text: "text-slate-300"  },
  gold:     { border: "border-yellow-400",  label: "Gold",     text: "text-yellow-400" },
  platinum: { border: "border-cyan-400",    label: "Platinum", text: "text-cyan-400"   },
  diamond:  { border: "border-purple-400",  label: "Diamond",  text: "text-purple-400" },
  cosmic:   { border: "border-pink-400",    label: "Cosmic",   text: "text-pink-400"   },
};
