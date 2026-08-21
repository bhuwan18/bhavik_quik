import { describe, it, expect, vi, afterEach } from "vitest";
import { aggregatePerks, rollPerkChoices, BASE_RUN_STATS } from "@/lib/perk-roll";
import { getPerk, PERKS_DATA } from "@/lib/perks-data";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("aggregatePerks", () => {
  it("returns base stats for an empty perk list", () => {
    expect(aggregatePerks([])).toEqual(BASE_RUN_STATS);
  });

  it("compounds multiplicative effects", () => {
    const stats = aggregatePerks(["sharpened-bolts", "sharpened-bolts"]);
    expect(stats.damage).toBeCloseTo(BASE_RUN_STATS.damage * 1.15 * 1.15);
  });

  it("sums additive effects", () => {
    const stats = aggregatePerks(["thick-hide", "thick-hide"]);
    expect(stats.maxHp).toBe(BASE_RUN_STATS.maxHp + 15 + 15);
  });

  it("ignores unknown perk ids", () => {
    expect(aggregatePerks(["not-a-real-perk"])).toEqual(BASE_RUN_STATS);
  });

  it("adds Trishot's extra projectiles onto the base of 1", () => {
    const stats = aggregatePerks(["trishot"]);
    expect(stats.projectiles).toBe(1 + (getPerk("trishot")?.effect.projectiles ?? 0));
  });
});

describe("rollPerkChoices", () => {
  it("returns the requested count when the pool is large enough", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(rollPerkChoices([], 3)).toHaveLength(3);
  });

  it("never returns duplicate perks within one roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const choices = rollPerkChoices([], 5);
    const ids = choices.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("excludes a perk once it has reached its maxStacks", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const trishot = getPerk("trishot")!;
    const owned = Array(trishot.maxStacks).fill("trishot");
    const choices = rollPerkChoices(owned, 20);
    expect(choices.find((p) => p.id === "trishot")).toBeUndefined();
  });

  it("returns fewer than requested once the eligible pool is exhausted", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const owned: string[] = [];
    for (const perk of PERKS_DATA) {
      if (perk.id === "sharpened-bolts") continue; // leave exactly one perk eligible
      for (let i = 0; i < perk.maxStacks; i++) owned.push(perk.id);
    }
    const choices = rollPerkChoices(owned, 5);
    expect(choices).toHaveLength(1);
    expect(choices[0].id).toBe("sharpened-bolts");
  });
});
