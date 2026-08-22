import { describe, it, expect, vi, afterEach } from "vitest";
import { pickNextQuestion } from "@/lib/question-picker";
import { QP_LEVELS_TO_FULL_POOL, QP_MIN_BAND_FRACTION } from "@/lib/game-config";

afterEach(() => {
  vi.restoreAllMocks();
});

function q(id: string) {
  return { id };
}

describe("pickNextQuestion", () => {
  it("returns null for an empty question list", () => {
    expect(pickNextQuestion([], new Set(), 1)).toBeNull();
  });

  it("never repeats a question already asked, as long as unasked ones remain", () => {
    const pool = Array.from({ length: 10 }, (_, i) => q(`q${i}`));
    const asked = new Set(["q0", "q1", "q2"]);
    for (let i = 0; i < 20; i++) {
      const pick = pickNextQuestion(pool, asked, 10); // level 10 = full pool eligible
      expect(pick).not.toBeNull();
      expect(asked.has(pick!.id)).toBe(false);
    }
  });

  it("at level 1, only draws from the easiest QP_MIN_BAND_FRACTION slice of the pool", () => {
    const pool = Array.from({ length: 10 }, (_, i) => q(`q${i}`));
    const bandSize = Math.max(1, Math.ceil(pool.length * QP_MIN_BAND_FRACTION));
    for (let i = 0; i < 20; i++) {
      const pick = pickNextQuestion(pool, new Set(), 1)!;
      const idx = pool.findIndex((p) => p.id === pick.id);
      expect(idx).toBeLessThan(bandSize);
    }
  });

  it("at level QP_LEVELS_TO_FULL_POOL + 1, the full pool is eligible", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999); // bias toward the last eligible index
    const pool = Array.from({ length: 10 }, (_, i) => q(`q${i}`));
    const pick = pickNextQuestion(pool, new Set(), QP_LEVELS_TO_FULL_POOL + 1)!;
    expect(pick.id).toBe("q9");
  });

  it("widens beyond the current band once it's fully asked, before falling back to repeats", () => {
    const pool = Array.from({ length: 10 }, (_, i) => q(`q${i}`));
    const bandSize = Math.max(1, Math.ceil(pool.length * QP_MIN_BAND_FRACTION));
    // Exhaust every question in the level-1 band.
    const asked = new Set(pool.slice(0, bandSize).map((p) => p.id));
    const pick = pickNextQuestion(pool, asked, 1)!;
    expect(pick).not.toBeNull();
    expect(asked.has(pick.id)).toBe(false); // still picks an unasked question outside the band
  });

  it("falls back to repeating within the band once the entire pool has been asked", () => {
    const pool = Array.from({ length: 5 }, (_, i) => q(`q${i}`));
    const asked = new Set(pool.map((p) => p.id)); // every question asked
    const pick = pickNextQuestion(pool, asked, 1);
    expect(pick).not.toBeNull(); // still returns something rather than null
  });
});
