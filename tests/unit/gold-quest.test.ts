import { describe, it, expect, vi, afterEach } from "vitest";
import { rollChestOutcome, applyChestOutcome, CHEST_GOLD_BASE, type GoldQuestState } from "@/lib/gold-quest";
import { GQ_STEAL_PCT } from "@/lib/game-config";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rollChestOutcome", () => {
  it("returns a gold outcome with the requested amount at the lowest random roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const outcome = rollChestOutcome(100);
    expect(outcome.kind).toBe("gold");
    expect(outcome.amount).toBe(100);
  });

  it("defaults to CHEST_GOLD_BASE when no amount is passed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(rollChestOutcome().amount).toBe(CHEST_GOLD_BASE);
  });
});

describe("applyChestOutcome", () => {
  const baseState: GoldQuestState = { playerGold: 100, rivalGold: [50, 200, 10] };

  it("gold: adds the amount to player gold, leaves rivals untouched", () => {
    const next = applyChestOutcome(baseState, { kind: "gold", amount: 40 });
    expect(next.playerGold).toBe(140);
    expect(next.rivalGold).toEqual(baseState.rivalGold);
  });

  it("double: doubles player gold", () => {
    const next = applyChestOutcome(baseState, { kind: "double", amount: 0 });
    expect(next.playerGold).toBe(200);
  });

  it("trap: subtracts and floors at zero", () => {
    const next = applyChestOutcome({ playerGold: 10, rivalGold: [0, 0, 0] }, { kind: "trap", amount: -50 });
    expect(next.playerGold).toBe(0);
  });

  it("swap: exchanges player gold with the targeted rival", () => {
    const next = applyChestOutcome(baseState, { kind: "swap", amount: 1 });
    expect(next.playerGold).toBe(200);
    expect(next.rivalGold[1]).toBe(100);
  });

  it("steal: takes GQ_STEAL_PCT from whichever rival currently leads, regardless of the rolled index", () => {
    const next = applyChestOutcome(baseState, { kind: "steal", amount: 0 }); // rolled index 0, but rivalGold[1]=200 leads
    const expectedStolen = Math.round(200 * GQ_STEAL_PCT);
    expect(next.rivalGold[1]).toBe(200 - expectedStolen);
    expect(next.playerGold).toBe(100 + expectedStolen);
  });

  it("does not mutate the input state", () => {
    const snapshot = { playerGold: baseState.playerGold, rivalGold: [...baseState.rivalGold] };
    applyChestOutcome(baseState, { kind: "gold", amount: 40 });
    expect(baseState).toEqual(snapshot);
  });
});
