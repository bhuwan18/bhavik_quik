import { describe, it, expect, vi, afterEach } from "vitest";
import type { Quizlet } from "@prisma/client";
import { rollPackOpening } from "@/lib/roll";

afterEach(() => {
  vi.restoreAllMocks();
});

// Minimal mock quizlet factory
function q(id: string, rarity: string, isHidden = false): Quizlet {
  return { id, name: id, rarity, pack: "test-pack", icon: "🎮", colorFrom: "", colorTo: "", description: "", isHidden, sellValue: 10 };
}

const POOL = [
  q("c1", "common"),
  q("c2", "common"),
  q("u1", "uncommon"),
  q("r1", "rare"),
  q("e1", "epic"),
  q("l1", "legendary"),
  q("h1", "secret", true),  // hidden — should never appear in normal rolls
];

const UNIQUES = [q("unique1", "unique"), q("unique2", "unique")];
const IMPOSSIBLE = [q("imp1", "impossible")];
const ALL_QUIZLETS = [...POOL, ...UNIQUES, ...IMPOSSIBLE];

describe("rollPackOpening()", () => {
  it("returns an array with one quizlet under normal conditions", () => {
    // Force Math.random to skip impossible/unique paths (>0.0001)
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = rollPackOpening("starter-pack", POOL, ALL_QUIZLETS);
    expect(result).toHaveLength(1);
  });

  it("never returns hidden quizlets in a normal roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    for (let i = 0; i < 20; i++) {
      const result = rollPackOpening("starter-pack", POOL, ALL_QUIZLETS);
      expect(result.every((q) => !q.isHidden)).toBe(true);
    }
  });

  it("returns empty array when pack pool is empty", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = rollPackOpening("starter-pack", [], ALL_QUIZLETS);
    expect(result).toHaveLength(0);
  });

  it("returns unique quizlet when random < 0.0001 threshold", () => {
    // For a non-rainbow pack, the impossible check is short-circuited (no Math.random() call).
    // First call is the unique threshold check; second call picks the index.
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.00005)  // hit unique threshold
      .mockReturnValueOnce(0);       // pick first unique
    const result = rollPackOpening("starter-pack", POOL, ALL_QUIZLETS);
    expect(result[0].rarity).toBe("unique");
  });

  it("returns impossible quizlet from rainbow-pack when random < 0.00001", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.000005); // hit rainbow impossible threshold
    const result = rollPackOpening("rainbow-pack", POOL, ALL_QUIZLETS);
    expect(result[0].rarity).toBe("impossible");
  });

  it("does NOT return impossible from a non-rainbow pack even with tiny random", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.000005) // would hit rainbow threshold — but not rainbow pack
      .mockReturnValueOnce(0.5)      // skip unique
      .mockReturnValueOnce(0.5);     // normal weighted roll
    const result = rollPackOpening("starter-pack", POOL, ALL_QUIZLETS);
    expect(result[0]?.rarity).not.toBe("impossible");
  });
});
