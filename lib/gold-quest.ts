// ─── Gold Quest chest & rival math ────────────────────────────────────────────
// Zero imports beyond game-config — pure state transitions, unit-testable without React or DOM.
// Weighted roll mirrors lib/roll.ts's pattern: a private weight table, subtract from
// Math.random() * totalWeight until it goes non-positive.

import { GQ_AI_COUNT, GQ_STEAL_PCT } from "@/lib/game-config";

export type ChestOutcomeKind = "gold" | "double" | "swap" | "steal" | "trap";

export type ChestOutcome = {
  kind: ChestOutcomeKind;
  amount: number; // gold delta for "gold"/"trap"; rival index for "swap"/"steal"
};

export type GoldQuestState = {
  playerGold: number;
  rivalGold: number[]; // length GQ_AI_COUNT
};

const CHEST_WEIGHTS: Record<ChestOutcomeKind, number> = {
  gold: 55,
  double: 15,
  steal: 15,
  swap: 10,
  trap: 5,
};

/** Base gold amount for a "gold" chest, before any per-round scaling the caller applies. */
export const CHEST_GOLD_BASE = 80;

function weightedKind(): ChestOutcomeKind {
  const entries = Object.entries(CHEST_WEIGHTS) as [ChestOutcomeKind, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [kind, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return kind;
  }
  return entries[entries.length - 1][0];
}

/** Rolls one chest's outcome. `goldAmount` lets the caller scale reward with round number. */
export function rollChestOutcome(goldAmount: number = CHEST_GOLD_BASE): ChestOutcome {
  const kind = weightedKind();
  switch (kind) {
    case "gold":
      return { kind, amount: goldAmount };
    case "double":
      return { kind, amount: 0 };
    case "trap":
      return { kind, amount: -Math.round(goldAmount * 0.5) };
    case "swap":
    case "steal":
      return { kind, amount: Math.floor(Math.random() * GQ_AI_COUNT) };
  }
}

/** Applies a chest outcome to the run state, returning a new state (never mutates the input). */
export function applyChestOutcome(state: GoldQuestState, outcome: ChestOutcome): GoldQuestState {
  const rivalGold = [...state.rivalGold];
  let playerGold = state.playerGold;

  switch (outcome.kind) {
    case "gold":
      playerGold += outcome.amount;
      break;
    case "double":
      playerGold *= 2;
      break;
    case "trap":
      playerGold = Math.max(0, playerGold + outcome.amount);
      break;
    case "swap": {
      const idx = outcome.amount;
      if (rivalGold[idx] !== undefined) {
        const rival = rivalGold[idx];
        rivalGold[idx] = playerGold;
        playerGold = rival;
      }
      break;
    }
    case "steal": {
      // Steal from whichever rival currently leads, not the rolled index — stealing
      // is only interesting against the leader.
      let leaderIdx = 0;
      for (let i = 1; i < rivalGold.length; i++) {
        if (rivalGold[i] > rivalGold[leaderIdx]) leaderIdx = i;
      }
      const amount = Math.round(rivalGold[leaderIdx] * GQ_STEAL_PCT);
      rivalGold[leaderIdx] = Math.max(0, rivalGold[leaderIdx] - amount);
      playerGold += amount;
      break;
    }
  }

  return { playerGold, rivalGold };
}
