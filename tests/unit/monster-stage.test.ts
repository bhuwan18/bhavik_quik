import { describe, it, expect, vi, afterEach } from "vitest";
import { getStage, getStageRoster, getStageScale, pickMonsterType, getSpawnIntervalMs, getMaxMonsters } from "@/lib/monster-stage";
import { MONSTER_TYPES, STAGE_ROSTERS, getMonsterType } from "@/lib/monsters-data";
import {
  MH_STAGE_LEVELS,
  MH_SPAWN_INTERVAL_STAGE1_MS,
  MH_SPAWN_INTERVAL_MIN_MS,
  MH_MAX_MONSTERS_BASE,
  MH_MAX_MONSTERS_CAP,
} from "@/lib/game-config";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getStage", () => {
  it("keeps levels 1 through MH_STAGE_LEVELS in stage 1", () => {
    expect(getStage(1)).toBe(1);
    expect(getStage(MH_STAGE_LEVELS)).toBe(1);
  });

  it("advances to stage 2 the level after the stage boundary", () => {
    expect(getStage(MH_STAGE_LEVELS + 1)).toBe(2);
  });

  it("clamps levels below 1 to stage 1", () => {
    expect(getStage(0)).toBe(1);
    expect(getStage(-5)).toBe(1);
  });
});

describe("getStageRoster", () => {
  it("returns the defined roster for stages within range", () => {
    const roster = getStageRoster(1);
    expect(roster.map((m) => m.id)).toEqual(STAGE_ROSTERS[0]);
  });

  it("reuses the last roster for stages beyond the defined list", () => {
    const farRoster = getStageRoster(STAGE_ROSTERS.length + 10);
    const lastRoster = STAGE_ROSTERS[STAGE_ROSTERS.length - 1];
    expect(farRoster.map((m) => m.id)).toEqual(lastRoster);
  });

  it("every roster entry resolves to a real monster type", () => {
    for (const roster of STAGE_ROSTERS) {
      for (const id of roster) {
        expect(MONSTER_TYPES.some((m) => m.id === id)).toBe(true);
      }
    }
  });
});

describe("getStageScale", () => {
  it("is a no-op at stage 1", () => {
    const scale = getStageScale(1);
    expect(scale.hp).toBe(1);
    expect(scale.damage).toBe(1);
    expect(scale.speed).toBe(1);
  });

  it("hp and damage grow with each stage", () => {
    const s1 = getStageScale(1);
    const s2 = getStageScale(2);
    const s3 = getStageScale(3);
    expect(s2.hp).toBeGreaterThan(s1.hp);
    expect(s3.hp).toBeGreaterThan(s2.hp);
    expect(s2.damage).toBeGreaterThan(s1.damage);
    expect(s3.damage).toBeGreaterThan(s2.damage);
  });

  it("speed multiplier is capped even at very high stages", () => {
    const scale = getStageScale(1000);
    expect(scale.speed).toBeLessThanOrEqual(1.6);
  });
});

describe("pickMonsterType", () => {
  it("only picks from the stage's roster", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const picked = pickMonsterType(2);
    const roster = getStageRoster(2).map((m) => m.id);
    expect(roster).toContain(picked.id);
  });

  it("picks the first roster entry when Math.random returns 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const picked = pickMonsterType(1);
    expect(picked.id).toBe(getStageRoster(1)[0].id);
  });
});

describe("getSpawnIntervalMs", () => {
  it("is exactly the stage-1 base interval at level 1", () => {
    expect(getSpawnIntervalMs(1, 1)).toBe(MH_SPAWN_INTERVAL_STAGE1_MS);
  });

  it("shrinks as levels progress within a stage", () => {
    const early = getSpawnIntervalMs(1, 1);
    const late = getSpawnIntervalMs(1, MH_STAGE_LEVELS);
    expect(late).toBeLessThan(early);
  });

  it("shrinks moving into the next stage", () => {
    const endOfStage1 = getSpawnIntervalMs(1, MH_STAGE_LEVELS);
    const startOfStage2 = getSpawnIntervalMs(2, MH_STAGE_LEVELS + 1);
    expect(startOfStage2).toBeLessThan(endOfStage1);
  });

  it("never drops below the floor even at very high stages", () => {
    expect(getSpawnIntervalMs(50, 500)).toBeGreaterThanOrEqual(MH_SPAWN_INTERVAL_MIN_MS);
    expect(getSpawnIntervalMs(50, 500)).toBe(MH_SPAWN_INTERVAL_MIN_MS);
  });

  it("clamps stage and level below 1 to stage 1, level 1", () => {
    expect(getSpawnIntervalMs(0, 0)).toBe(MH_SPAWN_INTERVAL_STAGE1_MS);
  });
});

describe("getMaxMonsters", () => {
  it("is the base cap at stage 1", () => {
    expect(getMaxMonsters(1)).toBe(MH_MAX_MONSTERS_BASE);
  });

  it("grows with each stage", () => {
    expect(getMaxMonsters(2)).toBeGreaterThan(getMaxMonsters(1));
    expect(getMaxMonsters(3)).toBeGreaterThan(getMaxMonsters(2));
  });

  it("never exceeds the absolute cap even at very high stages", () => {
    expect(getMaxMonsters(1000)).toBe(MH_MAX_MONSTERS_CAP);
  });
});

describe("getMonsterType", () => {
  it("falls back to the first monster type for an unknown id", () => {
    expect(getMonsterType("not-a-real-monster")).toBe(MONSTER_TYPES[0]);
  });
});
