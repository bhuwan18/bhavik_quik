import { describe, it, expect } from "vitest";
import { TOWER_TYPES, CREEP_TYPES, TD_STAGES, getTowerType, getCreepType, getStageDef } from "@/lib/td-data";
import { RARITY_COLORS } from "@/lib/utils";
import { TD_STAGE_COUNT } from "@/lib/game-config";

describe("TOWER_TYPES", () => {
  it("has unique ids", () => {
    const ids = TOWER_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every tier is a valid RARITY_COLORS key", () => {
    for (const t of TOWER_TYPES) {
      expect(RARITY_COLORS[t.tier]).toBeDefined();
    }
  });

  it("at least one tower cannot hit air, and at least three can — flying is meaningful without being unbeatable", () => {
    expect(TOWER_TYPES.some((t) => !t.canHitAir)).toBe(true);
    expect(TOWER_TYPES.filter((t) => t.canHitAir).length).toBeGreaterThanOrEqual(3);
  });

  it("every palette has four defined colour strings", () => {
    for (const t of TOWER_TYPES) {
      expect(t.palette.core).toBeTruthy();
      expect(t.palette.mid).toBeTruthy();
      expect(t.palette.edge).toBeTruthy();
      expect(t.palette.glow).toBeTruthy();
    }
  });

  it("getTowerType falls back to the first tower type for an unknown id", () => {
    expect(getTowerType("nope")).toBe(TOWER_TYPES[0]);
  });
});

describe("CREEP_TYPES", () => {
  it("has unique ids", () => {
    const ids = CREEP_TYPES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every palette has four defined colour strings", () => {
    for (const c of CREEP_TYPES) {
      expect(c.palette.core).toBeTruthy();
      expect(c.palette.mid).toBeTruthy();
      expect(c.palette.edge).toBeTruthy();
      expect(c.palette.glow).toBeTruthy();
    }
  });

  it("getCreepType falls back to the first creep type for an unknown id", () => {
    expect(getCreepType("nope")).toBe(CREEP_TYPES[0]);
  });

  it("every boss-behavior creep has a bossOverlay", () => {
    for (const c of CREEP_TYPES) {
      if (c.behavior === "boss") expect(c.bossOverlay).toBeDefined();
    }
  });
});

describe("TD_STAGES", () => {
  it("has exactly TD_STAGE_COUNT stages", () => {
    expect(TD_STAGES.length).toBe(TD_STAGE_COUNT);
  });

  it("every stage's roster entries and bossId resolve to a real creep type", () => {
    for (const stage of TD_STAGES) {
      for (const id of stage.roster) {
        expect(CREEP_TYPES.some((c) => c.id === id)).toBe(true);
      }
      expect(CREEP_TYPES.some((c) => c.id === stage.bossId)).toBe(true);
    }
  });

  it("every path has at least 2 waypoints with axis-aligned, non-zero-length segments", () => {
    for (const stage of TD_STAGES) {
      expect(stage.path.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < stage.path.length - 1; i++) {
        const a = stage.path[i];
        const b = stage.path[i + 1];
        const sameX = a.x === b.x;
        const sameY = a.y === b.y;
        expect(sameX || sameY).toBe(true); // axis-aligned
        expect(sameX && sameY).toBe(false); // non-zero length
      }
    }
  });

  it("getStageDef clamps to the last stage beyond the defined list", () => {
    expect(getStageDef(TD_STAGE_COUNT + 10)).toBe(TD_STAGES[TD_STAGE_COUNT - 1]);
  });

  it("getStageDef clamps stage numbers below 1 to the first stage", () => {
    expect(getStageDef(0)).toBe(TD_STAGES[0]);
  });

  it("each stage's ambient/terrain theme fields are non-empty", () => {
    for (const stage of TD_STAGES) {
      expect(stage.theme.bgTop).toBeTruthy();
      expect(stage.theme.bgBottom).toBeTruthy();
      expect(stage.theme.accent).toBeTruthy();
    }
  });
});
