import { describe, it, expect } from "vitest";
import {
  enemyHpForWave,
  enemyCountForWave,
  towerCost,
  towerUpgradeCost,
  towerDamage,
  towerRange,
  positionAtPathProgress,
  TD_PATH,
} from "@/lib/tower-defense";
import { TD_ENEMY_BASE_HP, TD_TOWER_BASE_COST, TD_TOWER_UPGRADE_COST } from "@/lib/game-config";

describe("enemyHpForWave", () => {
  it("returns the base HP for wave 1", () => {
    expect(enemyHpForWave(1)).toBe(TD_ENEMY_BASE_HP);
  });

  it("scales up for later waves", () => {
    expect(enemyHpForWave(5)).toBeGreaterThan(enemyHpForWave(1));
  });
});

describe("tower economy", () => {
  it("towerCost returns the flat base cost", () => {
    expect(towerCost()).toBe(TD_TOWER_BASE_COST);
  });

  it("towerUpgradeCost scales linearly with current level", () => {
    expect(towerUpgradeCost(1)).toBe(TD_TOWER_UPGRADE_COST);
    expect(towerUpgradeCost(2)).toBe(TD_TOWER_UPGRADE_COST * 2);
  });

  it("towerDamage and towerRange increase with level", () => {
    expect(towerDamage(2)).toBeGreaterThan(towerDamage(1));
    expect(towerRange(2, 32)).toBeGreaterThan(towerRange(1, 32));
  });
});

describe("positionAtPathProgress", () => {
  it("returns the first waypoint at t=0", () => {
    expect(positionAtPathProgress(0)).toEqual(TD_PATH[0]);
  });

  it("returns null at or beyond t=1", () => {
    expect(positionAtPathProgress(1)).toBeNull();
    expect(positionAtPathProgress(1.5)).toBeNull();
  });

  it("returns a defined point partway through the path", () => {
    const p = positionAtPathProgress(0.5);
    expect(p).not.toBeNull();
  });
});

describe("enemyCountForWave", () => {
  it("increases with wave number", () => {
    expect(enemyCountForWave(3)).toBeGreaterThan(enemyCountForWave(1));
  });
});
