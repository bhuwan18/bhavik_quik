import { describe, it, expect } from "vitest";
import {
  COINS_BY_DIFFICULTY,
  DAILY_LIMIT_REGULAR,
  DAILY_LIMIT_PRO,
  DAILY_LIMIT_MAX,
  MULTIPLIER_REGULAR,
  MULTIPLIER_PRO,
  MULTIPLIER_MAX,
} from "@/lib/game-config";

describe("COINS_BY_DIFFICULTY", () => {
  it("has entries for all 5 difficulty levels", () => {
    for (let d = 1; d <= 5; d++) {
      expect(COINS_BY_DIFFICULTY[d]).toBeGreaterThan(0);
    }
  });

  it("coins increase with difficulty", () => {
    for (let d = 1; d < 5; d++) {
      expect(COINS_BY_DIFFICULTY[d]).toBeLessThan(COINS_BY_DIFFICULTY[d + 1]);
    }
  });

  it("matches documented values (1→3, 2→5, 3→8, 4→12, 5→20)", () => {
    expect(COINS_BY_DIFFICULTY[1]).toBe(3);
    expect(COINS_BY_DIFFICULTY[2]).toBe(5);
    expect(COINS_BY_DIFFICULTY[3]).toBe(8);
    expect(COINS_BY_DIFFICULTY[4]).toBe(12);
    expect(COINS_BY_DIFFICULTY[5]).toBe(20);
  });
});

describe("Daily limits", () => {
  it("limits increase by tier", () => {
    expect(DAILY_LIMIT_REGULAR).toBeLessThan(DAILY_LIMIT_PRO);
    expect(DAILY_LIMIT_PRO).toBeLessThan(DAILY_LIMIT_MAX);
  });

  it("matches documented values (Regular 500, Pro 1000, Max 1500)", () => {
    expect(DAILY_LIMIT_REGULAR).toBe(500);
    expect(DAILY_LIMIT_PRO).toBe(1000);
    expect(DAILY_LIMIT_MAX).toBe(1500);
  });
});

describe("Multipliers", () => {
  it("multipliers increase by tier", () => {
    expect(MULTIPLIER_REGULAR).toBeLessThan(MULTIPLIER_PRO);
    expect(MULTIPLIER_PRO).toBeLessThan(MULTIPLIER_MAX);
  });

  it("matches documented values (Regular 1×, Pro 1.5×, Max 2×)", () => {
    expect(MULTIPLIER_REGULAR).toBe(1);
    expect(MULTIPLIER_PRO).toBe(1.5);
    expect(MULTIPLIER_MAX).toBe(2);
  });
});

describe("Coin calculation (inline logic from /api/attempt)", () => {
  function calcCoins(
    newCorrect: number,
    difficulty: number,
    multiplier: number,
    dailyLimit: number,
    currentDailyEarned: number
  ) {
    const coinsPerCorrect = COINS_BY_DIFFICULTY[difficulty] ?? 5;
    const rawCoins = Math.round(newCorrect * coinsPerCorrect * multiplier);
    const remaining = Math.max(0, dailyLimit - currentDailyEarned);
    return Math.min(rawCoins, remaining);
  }

  it("regular user, diff 3, 5 new correct = 40 coins", () => {
    expect(calcCoins(5, 3, MULTIPLIER_REGULAR, DAILY_LIMIT_REGULAR, 0)).toBe(40);
  });

  it("pro user gets 1.5× multiplier", () => {
    expect(calcCoins(4, 2, MULTIPLIER_PRO, DAILY_LIMIT_PRO, 0)).toBe(30); // 4*5*1.5=30
  });

  it("max user gets 2× multiplier", () => {
    expect(calcCoins(3, 5, MULTIPLIER_MAX, DAILY_LIMIT_MAX, 0)).toBe(120); // 3*20*2=120
  });

  it("daily cap is respected", () => {
    // Only 10 coins remaining before cap
    expect(calcCoins(10, 5, MULTIPLIER_REGULAR, DAILY_LIMIT_REGULAR, 490)).toBe(10);
  });

  it("already at daily cap earns 0 coins", () => {
    expect(calcCoins(10, 5, MULTIPLIER_REGULAR, DAILY_LIMIT_REGULAR, 500)).toBe(0);
  });
});
