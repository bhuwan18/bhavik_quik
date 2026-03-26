import { describe, it, expect } from "vitest";
import { cn, CATEGORIES, RARITY_COLORS, SELL_VALUES } from "@/lib/utils";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("filters falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
  });
});

describe("CATEGORIES", () => {
  it("has 17 categories", () => {
    expect(CATEGORIES).toHaveLength(17);
  });

  it("every category has slug, label, and icon", () => {
    for (const cat of CATEGORIES) {
      expect(cat.slug).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
    }
  });

  it("includes all expected slugs", () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(slugs).toContain("football");
    expect(slugs).toContain("cricket");
    expect(slugs).toContain("technology");
    expect(slugs).toContain("world-languages");
    expect(slugs).toContain("anime");
  });
});

describe("SELL_VALUES", () => {
  it("values increase with rarity", () => {
    expect(SELL_VALUES.common).toBeLessThan(SELL_VALUES.uncommon);
    expect(SELL_VALUES.uncommon).toBeLessThan(SELL_VALUES.rare);
    expect(SELL_VALUES.rare).toBeLessThan(SELL_VALUES.epic);
    expect(SELL_VALUES.epic).toBeLessThan(SELL_VALUES.legendary);
    expect(SELL_VALUES.legendary).toBeLessThan(SELL_VALUES.secret);
    expect(SELL_VALUES.secret).toBeLessThan(SELL_VALUES.unique);
    expect(SELL_VALUES.unique).toBeLessThan(SELL_VALUES.impossible);
  });

  it("has all 8 rarity tiers", () => {
    const tiers = ["common", "uncommon", "rare", "epic", "legendary", "secret", "unique", "impossible"];
    for (const t of tiers) {
      expect(SELL_VALUES[t]).toBeGreaterThan(0);
    }
  });
});

describe("RARITY_COLORS", () => {
  it("has all 8 rarity tiers", () => {
    const tiers = ["common", "uncommon", "rare", "epic", "legendary", "secret", "unique", "impossible"];
    for (const t of tiers) {
      expect(RARITY_COLORS[t]).toBeDefined();
      expect(RARITY_COLORS[t].label).toBeTruthy();
      expect(RARITY_COLORS[t].border).toBeTruthy();
    }
  });
});
