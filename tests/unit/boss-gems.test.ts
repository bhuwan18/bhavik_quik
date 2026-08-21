import { describe, it, expect } from "vitest";
import { calculateBossGemPayout } from "@/lib/boss-gems";
import { BOSS_GEM_REWARD_MIN, BOSS_GEM_REWARD_MAX, BOSS_FINAL_BLOW_BONUS_GEMS } from "@/lib/game-config";

describe("calculateBossGemPayout", () => {
  it("gives exactly the floor to the top damage dealer when they also land the final blow's opposite (no bonus)", () => {
    // Someone who dealt the most damage, but did NOT land the final blow, gets the max scaled amount with no bonus.
    expect(calculateBossGemPayout(100, 100, false)).toBe(BOSS_GEM_REWARD_MAX);
  });

  it("gives exactly the floor to a contributor with negligible damage relative to the top dealer", () => {
    expect(calculateBossGemPayout(1, 1000, false)).toBe(BOSS_GEM_REWARD_MIN);
  });

  it("scales linearly between floor and max by damage share", () => {
    // Half the top damage → halfway between min and max
    const expected = Math.round(BOSS_GEM_REWARD_MIN + (BOSS_GEM_REWARD_MAX - BOSS_GEM_REWARD_MIN) * 0.5);
    expect(calculateBossGemPayout(50, 100, false)).toBe(expected);
  });

  it("adds the final-blow bonus on top of the scaled amount", () => {
    const withoutBonus = calculateBossGemPayout(100, 100, false);
    const withBonus = calculateBossGemPayout(100, 100, true);
    expect(withBonus).toBe(withoutBonus + BOSS_FINAL_BLOW_BONUS_GEMS);
  });

  it("never exceeds max + bonus even if damage somehow exceeds topDamage", () => {
    // Defensive: topDamage should always be >= any individual damage, but the formula
    // clamps the share at 1 regardless, so payout never runs away.
    expect(calculateBossGemPayout(500, 100, true)).toBe(BOSS_GEM_REWARD_MAX + BOSS_FINAL_BLOW_BONUS_GEMS);
  });

  it("does not divide by zero when topDamage is 0", () => {
    expect(() => calculateBossGemPayout(0, 0, false)).not.toThrow();
    expect(calculateBossGemPayout(0, 0, false)).toBe(BOSS_GEM_REWARD_MIN);
  });

  it("zero damage still gets the floor (every contributor is guaranteed the minimum)", () => {
    expect(calculateBossGemPayout(0, 100, false)).toBe(BOSS_GEM_REWARD_MIN);
  });
});
