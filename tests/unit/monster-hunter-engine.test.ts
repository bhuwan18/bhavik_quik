// stepWorld/createWorld touch no DOM (only drawWorld's texture generators do, and those run
// lazily on first draw call), so they're testable in vitest's plain node environment just like
// any lib/ file — this exercises the ability-perk simulation (Turret Drone, Kinetic Barrier,
// Nova Burst, Second Wind) end to end without needing a browser.

import { describe, it, expect } from "vitest";
import { createWorld, stepWorld, type World, type InputState } from "@/components/game/monster-hunter-engine";
import { aggregateAbilities, BASE_RUN_STATS } from "@/lib/perk-roll";
import { getStage } from "@/lib/monster-stage";
import {
  MH_CORRIDOR_WIDTH_TILES,
  MH_TILE_PX,
  MH_SECOND_WIND_SPEED_MULT,
  MH_BARRIER_BASE_RECHARGE_MS,
  MH_MONSTER_HIT_COOLDOWN_MS,
  MH_STAGE_LEVELS,
} from "@/lib/game-config";

const NO_INPUT: InputState = { moveX: 0, moveY: 0, aimAngle: null };
const DT = 1 / 60;

// Offsets are applied on the *y* axis, never x: the player's own gun starts facing angle 0
// (+x) and NO_INPUT never rotates it, so an x-offset would put a monster directly in the
// player's own laser path and any damage measured couldn't be attributed to the ability
// under test.
//
// RANGE_OFFSET_PX stays inside the player's starting open block (a MH_CORRIDOR_WIDTH_TILES-wide
// square centered on the player) so it's guaranteed floor with a clear line of sight — no
// dependency on the maze's random layout — while being within Turret/Nova Burst's default
// range but too far away for player-radius contact damage (so it isolates ranged abilities
// from the unrelated monster-contact path).
const RANGE_OFFSET_PX = (MH_CORRIDOR_WIDTH_TILES / 2 - 0.3) * MH_TILE_PX;
// CONTACT_OFFSET_PX is close enough to actually trigger monster-contact damage (well inside
// the default player + monster contact radii used in stationaryMonster below).
const CONTACT_OFFSET_PX = 18;

function stationaryMonster(pos: { x: number; y: number }, overrides: Partial<{ hp: number; damage: number; hitCooldownMs: number }> = {}) {
  return {
    id: 999,
    typeId: "crawler",
    behavior: "chaser" as const,
    palette: { core: "#fff", mid: "#fff", edge: "#fff", glow: "rgba(0,0,0,0)" },
    pos,
    hp: overrides.hp ?? 100_000,
    maxHp: overrides.hp ?? 100_000,
    damage: overrides.damage ?? 10,
    speed: 0,
    radius: 12,
    hitCooldownMs: overrides.hitCooldownMs ?? 0,
    path: [],
    repathMs: 999_999, // never repaths, so it stays put and never moves toward/away from the player
    repathIntervalMs: 999_999,
    rangedCooldownMs: 999_999,
  };
}

function tick(world: World, abilities: ReturnType<typeof aggregateAbilities>, input: InputState = NO_INPUT, times = 1) {
  for (let i = 0; i < times; i++) stepWorld(world, DT, input, BASE_RUN_STATS, abilities);
}

describe("Turret Drone ability", () => {
  it("damages a nearby monster over time once unlocked", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities(["turret-drone"]);
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y + RANGE_OFFSET_PX }));

    tick(world, abilities, NO_INPUT, 90); // 1.5s — comfortably longer than the base 700ms cooldown

    expect(world.monsters[0].hp).toBeLessThan(100_000);
  });

  it("never fires when unowned, even with a monster in range", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities([]); // no turret
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y + RANGE_OFFSET_PX }));

    tick(world, abilities, NO_INPUT, 90);

    expect(world.monsters[0].hp).toBe(100_000);
    expect(world.turretLasers).toHaveLength(0);
  });

  it("deals more damage per shot with Turret Barrage stacked", () => {
    const worldA = createWorld(BASE_RUN_STATS);
    const worldB = createWorld(BASE_RUN_STATS);
    const abilitiesBase = aggregateAbilities(["turret-drone"]);
    const abilitiesUpgraded = aggregateAbilities(["turret-drone", "turret-barrage", "turret-barrage"]);
    worldA.monsters.push(stationaryMonster({ x: worldA.player.pos.x, y: worldA.player.pos.y + RANGE_OFFSET_PX }));
    worldB.monsters.push(stationaryMonster({ x: worldB.player.pos.x, y: worldB.player.pos.y + RANGE_OFFSET_PX }));

    tick(worldA, abilitiesBase, NO_INPUT, 50);
    tick(worldB, abilitiesUpgraded, NO_INPUT, 50);

    const damageA = 100_000 - worldA.monsters[0].hp;
    const damageB = 100_000 - worldB.monsters[0].hp;
    expect(damageB).toBeGreaterThan(damageA);
  });
});

describe("Kinetic Barrier ability", () => {
  it("fully absorbs the next hit and starts recharging instead of damaging the player", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities(["kinetic-barrier"]);
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y + CONTACT_OFFSET_PX }, { damage: 9999 }));

    tick(world, abilities, NO_INPUT, 1);

    expect(world.player.hp).toBe(BASE_RUN_STATS.maxHp);
    expect(world.barrierCooldownMs).toBeGreaterThan(0);
    expect(world.barrierFlashMs).toBeGreaterThan(0);
  });

  it("lets damage through again once the shield is on cooldown", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities(["kinetic-barrier"]);
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y + CONTACT_OFFSET_PX }, { damage: 15 }));

    tick(world, abilities, NO_INPUT, 1); // absorbed
    expect(world.player.hp).toBe(BASE_RUN_STATS.maxHp);

    // Advance well past the player's post-absorb iframe and the monster's own hit cooldown,
    // while the barrier itself is still deep in its multi-second recharge — so this second
    // contact should land for real.
    world.monsters[0].hitCooldownMs = 0;
    tick(world, abilities, NO_INPUT, Math.ceil((MH_MONSTER_HIT_COOLDOWN_MS / 1000) * 60) + 30);

    expect(world.player.hp).toBeLessThan(BASE_RUN_STATS.maxHp);
  });

  it("recharges faster with Barrier Capacitor stacked", () => {
    const base = aggregateAbilities(["kinetic-barrier"]);
    const upgraded = aggregateAbilities(["kinetic-barrier", "barrier-capacitor"]);
    expect(upgraded.barrier.rechargeMs).toBeLessThan(base.barrier.rechargeMs);
    expect(base.barrier.rechargeMs).toBe(MH_BARRIER_BASE_RECHARGE_MS);
  });
});

describe("Nova Burst ability", () => {
  it("damages every monster within radius simultaneously, the instant it's unlocked", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities(["nova-burst"]);
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y + RANGE_OFFSET_PX }));
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y - RANGE_OFFSET_PX }));

    tick(world, abilities, NO_INPUT, 1); // novaCooldownMs starts at 0 — fires on the very first tick

    expect(world.monsters[0].hp).toBeLessThan(100_000);
    expect(world.monsters[1].hp).toBeLessThan(100_000);
    expect(world.novaPulseMs).toBeGreaterThan(0);
  });

  it("hits harder with Nova Amplifier stacked", () => {
    const worldA = createWorld(BASE_RUN_STATS);
    const worldB = createWorld(BASE_RUN_STATS);
    worldA.monsters.push(stationaryMonster({ x: worldA.player.pos.x, y: worldA.player.pos.y + RANGE_OFFSET_PX }));
    worldB.monsters.push(stationaryMonster({ x: worldB.player.pos.x, y: worldB.player.pos.y + RANGE_OFFSET_PX }));

    tick(worldA, aggregateAbilities(["nova-burst"]), NO_INPUT, 1);
    tick(worldB, aggregateAbilities(["nova-burst", "nova-amplifier"]), NO_INPUT, 1);

    const damageA = 100_000 - worldA.monsters[0].hp;
    const damageB = 100_000 - worldB.monsters[0].hp;
    expect(damageB).toBeGreaterThan(damageA);
  });
});

describe("Second Wind ability", () => {
  it("grants a temporary speed boost after taking a hit", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities(["second-wind"]);
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y + CONTACT_OFFSET_PX }, { damage: 5 }));

    tick(world, abilities, NO_INPUT, 1); // takes the hit, which grants Second Wind
    expect(world.secondWindMs).toBeGreaterThan(0);

    const before = world.player.pos.x;
    // Move along x (perpendicular to the y-offset monster) so this step can't be slowed by
    // bumping into it, isolating the speed measurement to the Second Wind multiplier alone.
    stepWorld(world, DT, { moveX: 1, moveY: 0, aimAngle: null }, BASE_RUN_STATS, abilities);
    const boosted = world.player.pos.x - before;

    const expectedNormal = BASE_RUN_STATS.speed * DT;
    expect(boosted).toBeGreaterThan(expectedNormal * (MH_SECOND_WIND_SPEED_MULT - 0.05));
  });

  it("player speed is unaffected without the perk", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities([]);
    world.monsters.push(stationaryMonster({ x: world.player.pos.x, y: world.player.pos.y + CONTACT_OFFSET_PX }, { damage: 5 }));

    tick(world, abilities, NO_INPUT, 1);
    expect(world.secondWindMs).toBe(0);
  });
});

describe("Stage transitions", () => {
  it("flags stagedUp as false when a level-up doesn't cross a stage boundary", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities([]);
    world.xp = world.xpToNext; // force the very next tick to level up from 1 -> 2, still stage 1

    const events = stepWorld(world, DT, NO_INPUT, BASE_RUN_STATS, abilities);

    expect(events.leveledUp).toBe(true);
    expect(events.stagedUp).toBe(false);
    expect(world.stage).toBe(1);
  });

  it("flags stagedUp as true exactly when a level-up crosses into a new stage", () => {
    const world = createWorld(BASE_RUN_STATS);
    const abilities = aggregateAbilities([]);
    world.level = MH_STAGE_LEVELS; // last level of stage 1
    world.stage = getStage(world.level);
    world.xp = world.xpToNext; // force the next tick to level up into MH_STAGE_LEVELS + 1 -> stage 2

    const events = stepWorld(world, DT, NO_INPUT, BASE_RUN_STATS, abilities);

    expect(events.leveledUp).toBe(true);
    expect(events.stagedUp).toBe(true);
    expect(world.stage).toBe(2);
  });
});
