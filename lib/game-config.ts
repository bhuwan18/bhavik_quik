// ─── Game Mode Timing & Mechanics ────────────────────────────────────────────

export const HACKDEV_DURATION_S = 60;          // HackDev: total time limit
export const HACKDEV_CATEGORY = "technology";  // HackDev: quiz category to load
export const HACKDEV_TIMER_WARNING_S = 10;     // HackDev: show warning below this many seconds
export const HACKDEV_ANSWER_REVEAL_MS = 600;   // HackDev: delay before advancing to next question

export const SPEEDBLITZ_DURATION_S = 30;       // SpeedBlitz: total time limit
export const SPEEDBLITZ_QUESTION_COUNT = 20;   // SpeedBlitz: number of questions per game
export const SPEEDBLITZ_TIMER_WARNING_S = 10;  // SpeedBlitz: show warning below this many seconds

export const SURVIVAL_TIMER_S = 10;            // Survival: seconds per question
export const SURVIVAL_TIMER_WARNING_S = 3;     // Survival: show warning below this many seconds
export const SURVIVAL_ANSWER_REVEAL_MS = 700;  // Survival: delay before advancing to next question

export const DAILY_CHALLENGE_TIMER_S = 30;     // Daily Challenge: seconds per question
export const DAILY_CHALLENGE_QUESTION_COUNT = 5; // Daily Challenge: questions per day
export const DAILY_ANSWER_REVEAL_MS = 800;     // Daily Challenge: delay before advancing
export const DAILY_SCORE_GOOD_THRESHOLD = 60;  // Daily Challenge: % score for ⭐ (vs 📅)

export const DINOREX_TIMER_S = 15;            // DinoRex: seconds per question
export const DINOREX_QUESTION_COUNT = 8;      // DinoRex: questions per match
export const DINOREX_WIN_BONUS_COINS = 50;    // DinoRex: bonus coins for winning the match
export const DINOREX_TIMER_WARNING_S = 5;     // DinoRex: show warning below this many seconds
export const DINOREX_BOT_NAMES = ["DinoBot_X", "RexChallenger", "QuizMaster_99"] as const;

// Shared: warning threshold used by modes that don't have a mode-specific one
export const TIMER_WARNING_THRESHOLD_S = 5;

// Flat coins per correct answer used in game modes (estimated before API confirms)
export const GAME_COINS_PER_CORRECT = 5;

// ─── Coin Economy ─────────────────────────────────────────────────────────────

/** Coins earned per correct answer based on quiz difficulty (1–5) */
export const COINS_BY_DIFFICULTY: Record<number, number> = {
  1: 3,
  2: 5,
  3: 8,
  4: 12,
  5: 20,
};

/** Flat coins awarded for marking a question explanation as read (before multiplier) */
export const EXPLANATION_READ_COINS = 2;

export const DAILY_LIMIT_REGULAR = 500;
export const DAILY_LIMIT_PRO = 1000;
export const DAILY_LIMIT_MAX = 1500;

export const MULTIPLIER_REGULAR = 1;
export const MULTIPLIER_PRO = 1.5;
export const MULTIPLIER_MAX = 2;

// ─── Membership Pricing ───────────────────────────────────────────────────────

export const BLACKSMITH_AMOUNT_INR = 100;  // Blacksmith tier monthly price
export const PRO_AMOUNT_INR = 250;         // Pro membership monthly price
export const MAX_AMOUNT_INR = 500;         // Max membership monthly price
export const MEMBERSHIP_DURATION_DAYS = 30; // Duration of a membership period

// ─── Buy Coins ────────────────────────────────────────────────────────────────

export const DAILY_RESET_AMOUNT_INR = 100;  // One-time fee to reset today's daily coin limit

export const BUY_COINS_MIN = 10;
export const BUY_COINS_MAX = 10000;
export const BUY_COINS_QUICK_AMOUNTS = [50, 100, 250, 500, 1000] as const;

// ─── Streak System ────────────────────────────────────────────────────────────

export const STREAK_FREEZE_COST_1 = 1000;   // cost when owning 0 freezes
export const STREAK_FREEZE_COST_2 = 2500;   // cost when owning 1 freeze
export const STREAK_FREEZE_MAX = 2;
export const STREAK_MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100, 150, 200, 365] as const;

// ─── Premium Categories ───────────────────────────────────────────────────────

/** Display names for each premium category tier */
export const PREMIUM_TIER_NAMES: Record<1 | 2 | 3, string> = {
  1: "🎓 Scholar",
  2: "🧠 Expert",
  3: "🏆 Master",
};

/** totalCoinsEarned required to unlock each premium category tier */
export const PREMIUM_TIER_UNLOCK_COINS: Record<1 | 2 | 3, number> = {
  1: 3000,
  2: 6000,
  3: 11000,
};

// ─── Online Presence ──────────────────────────────────────────────────────────

export const ONLINE_PING_INTERVAL_MS = 5 * 60 * 1000;  // Ping every 5 minutes
export const ONLINE_PING_DEBOUNCE_MS = 3 * 60 * 1000;  // Skip DB write if updated within 3 minutes
export const ONLINE_THRESHOLD_MS = 6 * 60 * 1000;      // Consider online if seen within 6 minutes

// ─── Boss Battles ───────────────────────────────────────────────────────────

export const BOSS_MIN_HP = 500;
export const BOSS_MAX_HP = 1500;
export const BOSS_DURATION_DAYS = 7;   // event window per boss

/** Damage per correct answer in regular quizzes, scaled by difficulty (1–5) — mirrors COINS_BY_DIFFICULTY */
export const DAMAGE_BY_DIFFICULTY: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
};

/** Flat damage per correct answer in game modes, which have no difficulty — mirrors GAME_COINS_PER_CORRECT */
export const GAME_DAMAGE_PER_CORRECT = 2;

export const BOSS_GEM_REWARD_MIN = 50;       // floor for any contributor
export const BOSS_GEM_REWARD_MAX = 100;      // top damage dealer
export const BOSS_FINAL_BLOW_BONUS_GEMS = 25;

// Overlay animation timing — must stay under the shortest game-mode reveal delay
// (HACKDEV_ANSWER_REVEAL_MS = 600) so a hit/taunt never bleeds into the next question.
export const BOSS_HIT_ANIM_MS = 420;
export const BOSS_TAUNT_ANIM_MS = 420;
export const BOSS_POLL_INTERVAL_MS = 30_000; // refresh HP client-side to reflect other players' damage

/** Gem → coin redemption tiers shown in /shop */
export const GEM_REDEMPTION_TIERS = [
  { gems: 500, coins: 1500 },
  { gems: 1000, coins: 3500 },
  { gems: 5000, coins: 20000 },
] as const;
