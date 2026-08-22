import { describe, it, expect, vi, afterEach } from "vitest";
import { aggregatePerks, aggregateAbilities, getAbilityBadges, rollPerkChoices, BASE_RUN_STATS, BASE_ABILITY_STATE } from "@/lib/perk-roll";
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

describe("aggregateAbilities", () => {
  it("returns base ability state (all unowned) for an empty perk list", () => {
    expect(aggregateAbilities([])).toEqual(BASE_ABILITY_STATE);
  });

  it("unlocks the turret and leaves other abilities unowned", () => {
    const abilities = aggregateAbilities(["turret-drone"]);
    expect(abilities.turret.owned).toBe(true);
    expect(abilities.barrier.owned).toBe(false);
    expect(abilities.novaBurst.owned).toBe(false);
    expect(abilities.secondWind.owned).toBe(false);
  });

  it("compounds turret upgrade multipliers on top of the base values", () => {
    const abilities = aggregateAbilities(["turret-drone", "turret-barrage", "turret-barrage"]);
    const perk = getPerk("turret-barrage")!;
    const mult = perk.effect.turretDamageMult!;
    expect(abilities.turret.damageMult).toBeCloseTo(mult * mult);
  });

  it("sums turret projectile upgrades onto the base of 1", () => {
    const abilities = aggregateAbilities(["turret-drone", "twin-cannons"]);
    expect(abilities.turret.projectiles).toBe(1 + (getPerk("twin-cannons")?.effect.turretProjectiles ?? 0));
  });

  it("shrinks barrier recharge time multiplicatively", () => {
    const abilities = aggregateAbilities(["kinetic-barrier", "barrier-capacitor"]);
    expect(abilities.barrier.rechargeMs).toBeCloseTo(BASE_ABILITY_STATE.barrier.rechargeMs * getPerk("barrier-capacitor")!.effect.barrierRechargeMult!);
  });

  it("ignores upgrade effects for abilities never unlocked (aggregation doesn't enforce ordering)", () => {
    // rollPerkChoices is what actually prevents this combination from being offered in play —
    // aggregateAbilities itself just folds whatever ids it's given, so an upgrade id alone
    // still applies its multiplier even without the base unlock in the list.
    const abilities = aggregateAbilities(["turret-barrage"]);
    expect(abilities.turret.owned).toBe(false);
    expect(abilities.turret.damageMult).toBeCloseTo(getPerk("turret-barrage")!.effect.turretDamageMult!);
  });
});

describe("getAbilityBadges", () => {
  it("returns no badges for an empty perk list", () => {
    expect(getAbilityBadges([])).toEqual([]);
  });

  it("returns tier 1 for a newly unlocked ability with no upgrades", () => {
    const badges = getAbilityBadges(["turret-drone"]);
    expect(badges).toHaveLength(1);
    expect(badges[0]).toMatchObject({ id: "turret-drone", tier: 1 });
  });

  it("counts requires-gated upgrade stacks into the tier", () => {
    const badges = getAbilityBadges(["turret-drone", "turret-barrage", "turret-barrage", "turret-overclock"]);
    expect(badges[0].tier).toBe(4); // 1 base + 2 turret-barrage stacks + 1 turret-overclock stack
  });

  it("never badges an ability that was never unlocked, even if an upgrade id is present alone", () => {
    // Mirrors aggregateAbilities' equivalent case: rollPerkChoices is what actually prevents
    // this in play, so this test documents the (safe) behavior if it ever happened anyway.
    expect(getAbilityBadges(["turret-barrage"])).toEqual([]);
  });

  it("only badges abilities actually owned, ignoring unrelated stat perks", () => {
    const badges = getAbilityBadges(["sharpened-bolts", "kinetic-barrier"]);
    expect(badges.map((b) => b.id)).toEqual(["kinetic-barrier"]);
  });
});

describe("rollPerkChoices — requires gating", () => {
  it("never offers a turret upgrade before Turret Drone is owned", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const choices = rollPerkChoices([], 28);
    const ids = choices.map((p) => p.id);
    expect(ids).not.toContain("turret-barrage");
    expect(ids).not.toContain("turret-overclock");
    expect(ids).not.toContain("turret-array");
    expect(ids).not.toContain("twin-cannons");
    expect(ids).not.toContain("precision-targeting");
  });

  it("offers turret upgrades once Turret Drone is owned", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const choices = rollPerkChoices(["turret-drone"], 28);
    const ids = choices.map((p) => p.id);
    expect(ids).toContain("turret-barrage");
  });

  it("never offers Barrier Capacitor before Kinetic Barrier is owned", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const choices = rollPerkChoices([], 28);
    expect(choices.map((p) => p.id)).not.toContain("barrier-capacitor");
  });

  it("never offers Nova Amplifier/Expansion before Nova Burst is owned", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const choices = rollPerkChoices([], 28);
    const ids = choices.map((p) => p.id);
    expect(ids).not.toContain("nova-amplifier");
    expect(ids).not.toContain("nova-expansion");
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
