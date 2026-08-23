import { describe, it, expect } from "vitest";
import {
  buildPathGeometry,
  positionAt,
  headingAt,
  blockedTiles,
  creepHp,
  creepBounty,
  creepSpeedTilesPerS,
  damageAfterArmor,
  towerDamage,
  towerCooldownMs,
  towerRangeTiles,
  towerUpgradeCost,
  towerTotalInvested,
  towerSellValue,
  frostSlowPct,
  teslaChainCount,
  waveComposition,
  totalCreepsInWave,
  isBossWave,
  globalWaveNumber,
} from "@/lib/tower-defense";
import { TD_STAGES, getCreepType, getTowerType, CREEP_TYPES, TOWER_TYPES } from "@/lib/td-data";
import { TD_CREEP_BASE_HP, TD_TOWER_MAX_LEVEL, TD_STAGE_COUNT, TD_WAVES_PER_STAGE, TD_TOTAL_WAVES, TD_MIN_DAMAGE_AFTER_ARMOR, TD_GRID_COLS, TD_GRID_ROWS } from "@/lib/game-config";

describe("creepHp", () => {
  it("returns the base HP for an hpMult=1 creep on stage 1, wave 1 — same invariant as before", () => {
    const slime = getCreepType("slime");
    expect(slime.hpMult).toBe(1);
    expect(creepHp(slime, 1, 1)).toBe(TD_CREEP_BASE_HP);
  });

  it("scales up within a stage as the wave increases", () => {
    const slime = getCreepType("slime");
    expect(creepHp(slime, 1, 5)).toBeGreaterThan(creepHp(slime, 1, 1));
  });

  it("a stage boundary is a bigger jump than a wave-to-wave increase", () => {
    const slime = getCreepType("slime");
    expect(creepHp(slime, 2, 1)).toBeGreaterThan(creepHp(slime, 1, TD_WAVES_PER_STAGE));
  });
});

describe("creepBounty and creepSpeedTilesPerS", () => {
  it("bounty scales up per stage", () => {
    const slime = getCreepType("slime");
    expect(creepBounty(slime, 2)).toBeGreaterThan(creepBounty(slime, 1));
  });

  it("speed reflects the creep's own speedMult", () => {
    const gnawer = getCreepType("gnawer");
    const tusker = getCreepType("tusker");
    expect(creepSpeedTilesPerS(gnawer)).toBeGreaterThan(creepSpeedTilesPerS(tusker));
  });
});

describe("damageAfterArmor", () => {
  it("never returns below the configured floor", () => {
    expect(damageAfterArmor(2, 999)).toBe(TD_MIN_DAMAGE_AFTER_ARMOR);
  });

  it("ignoreArmor returns the raw damage exactly", () => {
    expect(damageAfterArmor(12, 999, true)).toBe(12);
  });

  it("subtracts flat armor from raw damage", () => {
    const arrowDamage = 12;
    const golemArmor = getCreepType("golem").armor;
    expect(damageAfterArmor(arrowDamage, golemArmor)).toBe(Math.max(TD_MIN_DAMAGE_AFTER_ARMOR, arrowDamage - golemArmor));
  });
});

describe("tower curves", () => {
  it("damage strictly increases and cooldown strictly decreases across every level, for all tower types", () => {
    for (const def of TOWER_TYPES) {
      for (let l = 1; l < TD_TOWER_MAX_LEVEL; l++) {
        expect(towerDamage(def, l + 1)).toBeGreaterThanOrEqual(towerDamage(def, l));
        expect(towerCooldownMs(def, l + 1)).toBeLessThanOrEqual(towerCooldownMs(def, l));
        expect(towerRangeTiles(def, l + 1)).toBeGreaterThan(towerRangeTiles(def, l));
      }
    }
  });

  it("towerUpgradeCost is a fraction of base cost at level 1, and grows with level", () => {
    const arrow = getTowerType("arrow");
    expect(towerUpgradeCost(arrow, 1)).toBeGreaterThan(0);
    expect(towerUpgradeCost(arrow, 2)).toBeGreaterThan(towerUpgradeCost(arrow, 1));
  });

  it("towerSellValue is always less than total invested, for every type and level", () => {
    for (const def of TOWER_TYPES) {
      for (let l = 1; l <= TD_TOWER_MAX_LEVEL; l++) {
        expect(towerSellValue(def, l)).toBeLessThan(towerTotalInvested(def, l));
      }
    }
  });

  it("frostSlowPct never reaches or exceeds 1 — a slow can never fully stop a creep", () => {
    expect(frostSlowPct(TD_TOWER_MAX_LEVEL)).toBeLessThan(1);
  });

  it("teslaChainCount adds a jump at level 3 and another at level 5", () => {
    const base = teslaChainCount(1);
    expect(teslaChainCount(2)).toBe(base);
    expect(teslaChainCount(3)).toBe(base + 1);
    expect(teslaChainCount(4)).toBe(base + 1);
    expect(teslaChainCount(5)).toBe(base + 2);
  });
});

describe("buildPathGeometry / positionAt / headingAt", () => {
  it("totalTiles equals the hand-summed segment lengths for stage 1", () => {
    const geo = buildPathGeometry(TD_STAGES[0].path);
    let expected = 0;
    const p = TD_STAGES[0].path;
    for (let i = 0; i < p.length - 1; i++) expected += Math.hypot(p[i + 1].x - p[i].x, p[i + 1].y - p[i].y);
    expect(geo.totalTiles).toBeCloseTo(expected);
  });

  it("cumulative is non-decreasing and ends at totalTiles", () => {
    const geo = buildPathGeometry(TD_STAGES[1].path);
    for (let i = 1; i < geo.cumulative.length; i++) {
      expect(geo.cumulative[i]).toBeGreaterThanOrEqual(geo.cumulative[i - 1]);
    }
    expect(geo.cumulative.at(-1)).toBeCloseTo(geo.totalTiles);
  });

  it("positionAt returns the first waypoint at t=0", () => {
    const geo = buildPathGeometry(TD_STAGES[0].path);
    expect(positionAt(geo, 0)).toEqual(TD_STAGES[0].path[0]);
  });

  it("positionAt returns null at or beyond t=1", () => {
    const geo = buildPathGeometry(TD_STAGES[0].path);
    expect(positionAt(geo, 1)).toBeNull();
    expect(positionAt(geo, 1.5)).toBeNull();
  });

  it("positionAt returns a defined point partway through the path", () => {
    const geo = buildPathGeometry(TD_STAGES[0].path);
    expect(positionAt(geo, 0.5)).not.toBeNull();
  });

  it("positionAt progresses monotonically along the path (no backtracking at joins)", () => {
    const geo = buildPathGeometry(TD_STAGES[2].path);
    let prevDist = -1;
    for (let i = 0; i <= 99; i++) {
      const t = i / 100;
      const p = positionAt(geo, t)!;
      const dist = t * geo.totalTiles;
      expect(dist).toBeGreaterThanOrEqual(prevDist);
      prevDist = dist;
      expect(p).toBeDefined();
    }
  });

  it("headingAt returns a unit vector for every stage at several sample points", () => {
    for (const stage of TD_STAGES) {
      const geo = buildPathGeometry(stage.path);
      for (let i = 0; i < 20; i++) {
        const h = headingAt(geo, i / 20);
        expect(Math.hypot(h.x, h.y)).toBeCloseTo(1, 5);
      }
    }
  });
});

describe("blockedTiles", () => {
  it("every returned tile is inside the grid, for every stage", () => {
    for (const stage of TD_STAGES) {
      const geo = buildPathGeometry(stage.path);
      const blocked = blockedTiles(geo);
      for (const key of blocked) {
        const gx = key % TD_GRID_COLS;
        const gy = Math.floor(key / TD_GRID_COLS);
        expect(gx).toBeGreaterThanOrEqual(0);
        expect(gx).toBeLessThan(TD_GRID_COLS);
        expect(gy).toBeGreaterThanOrEqual(0);
        expect(gy).toBeLessThan(TD_GRID_ROWS);
      }
    }
  });

  it("no on-grid waypoint is missing from the blocked set, for every stage", () => {
    for (const stage of TD_STAGES) {
      const geo = buildPathGeometry(stage.path);
      const blocked = blockedTiles(geo);
      for (const wp of stage.path) {
        const gx = Math.round(wp.x);
        const gy = Math.round(wp.y);
        if (gx < 0 || gy < 0 || gx >= TD_GRID_COLS || gy >= TD_GRID_ROWS) continue;
        expect(blocked.has(gy * TD_GRID_COLS + gx)).toBe(true);
      }
    }
  });

  it("leaves at least 55% of the board buildable, for every stage", () => {
    const totalTiles = TD_GRID_COLS * TD_GRID_ROWS;
    for (const stage of TD_STAGES) {
      const geo = buildPathGeometry(stage.path);
      const blocked = blockedTiles(geo);
      expect(blocked.size).toBeLessThan(totalTiles * 0.45);
    }
  });
});

describe("waveComposition", () => {
  it("every stage x wave produces at least one spawn group, every creepId resolves", () => {
    for (let stage = 1; stage <= TD_STAGE_COUNT; stage++) {
      for (let w = 1; w <= TD_WAVES_PER_STAGE; w++) {
        const groups = waveComposition(stage, w);
        expect(groups.length).toBeGreaterThan(0);
        for (const g of groups) {
          expect(CREEP_TYPES.some((c) => c.id === g.creepId)).toBe(true);
        }
      }
    }
  });

  it("the final wave of every stage contains that stage's boss and is flagged as a boss wave", () => {
    for (let stage = 1; stage <= TD_STAGE_COUNT; stage++) {
      const groups = waveComposition(stage, TD_WAVES_PER_STAGE);
      const stageDef = TD_STAGES[stage - 1];
      expect(groups.some((g) => g.creepId === stageDef.bossId)).toBe(true);
      expect(isBossWave(TD_WAVES_PER_STAGE)).toBe(true);
    }
  });

  it("totalCreepsInWave increases from wave 1 to wave 5 within a stage", () => {
    expect(totalCreepsInWave(1, 5)).toBeGreaterThan(totalCreepsInWave(1, 1));
  });
});

describe("globalWaveNumber", () => {
  it("the last wave of the last stage equals TD_TOTAL_WAVES", () => {
    expect(globalWaveNumber(TD_STAGE_COUNT, TD_WAVES_PER_STAGE)).toBe(TD_TOTAL_WAVES);
  });

  it("wave 1 of stage 1 is global wave 1", () => {
    expect(globalWaveNumber(1, 1)).toBe(1);
  });
});
