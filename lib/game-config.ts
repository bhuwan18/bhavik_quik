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

export const DAILY_LIMIT_REGULAR = 500;
export const DAILY_LIMIT_PRO = 1000;
export const DAILY_LIMIT_MAX = 1500;

export const MULTIPLIER_REGULAR = 1;
export const MULTIPLIER_PRO = 1.5;
export const MULTIPLIER_MAX = 2;

// ─── Membership Pricing ───────────────────────────────────────────────────────

export const PRO_AMOUNT_INR = 250;         // Pro membership monthly price
export const MAX_AMOUNT_INR = 500;         // Max membership monthly price
export const MEMBERSHIP_DURATION_DAYS = 30; // Duration of a membership period

// ─── Buy Coins ────────────────────────────────────────────────────────────────

export const BUY_COINS_MIN = 10;
export const BUY_COINS_MAX = 10000;
export const BUY_COINS_QUICK_AMOUNTS = [50, 100, 250, 500, 1000] as const;

// ─── Online Presence ──────────────────────────────────────────────────────────

export const ONLINE_PING_INTERVAL_MS = 2 * 60 * 1000; // Ping every 2 minutes
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;     // Consider online if seen within 5 minutes
