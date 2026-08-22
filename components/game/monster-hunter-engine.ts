// Plain TypeScript, no React — the world is a mutable object owned by a ref in
// MonsterHunterGame.tsx. React never re-renders per-frame; it only reads throttled HUD
// snapshots pushed out via the `onHud` callback threading through the caller.

import {
  MH_TILE_PX,
  MH_MAZE_LOGICAL_COLS,
  MH_MAZE_LOGICAL_ROWS,
  MH_CORRIDOR_WIDTH_TILES,
  MH_PLAYER_IFRAME_MS,
  MH_LASER_SPEED,
  MH_LASER_RANGE_TILES,
  MH_TRISHOT_SPREAD_RAD,
  MH_MONSTER_HP,
  MH_MONSTER_DAMAGE,
  MH_MONSTER_HIT_COOLDOWN_MS,
  MH_MONSTER_SPEED,
  MH_SPAWN_MIN_DIST_TILES,
  MH_SPAWN_MAX_DIST_TILES,
  MH_MONSTER_REPATH_MS,
  MH_STALKER_REPATH_MS,
  MH_RANGED_ATTACK_RANGE_TILES,
  MH_RANGED_PROJECTILE_SPEED,
  MH_RANGED_PROJECTILE_DAMAGE,
  MH_RANGED_COOLDOWN_MS,
  MH_GEM_XP,
  MH_XP_BASE,
  MH_XP_GROWTH,
  MH_EXIT_REACH_RADIUS_TILES,
  MH_TURRET_ORBIT_RADIUS_TILES,
  MH_TURRET_ORBIT_SPEED,
  MH_TURRET_BASE_DAMAGE,
  MH_TURRET_LASER_SPEED,
  MH_BARRIER_FLASH_MS,
  MH_NOVA_VISUAL_MS,
  MH_SECOND_WIND_SPEED_MULT,
  MH_SECOND_WIND_DURATION_MS,
  MH_SECOND_WIND_BONUS_IFRAME_MS,
} from "@/lib/game-config";
import { generateMaze, expandMaze, computeVisible, isWall, type MazeGrid } from "@/lib/maze";
import type { RunStats, AbilityState } from "@/lib/perk-roll";
import { getStage, getStageScale, pickMonsterType, getSpawnIntervalMs, getMaxMonsters } from "@/lib/monster-stage";
import type { MonsterBehavior, MonsterPalette } from "@/lib/monsters-data";

type Vec2 = { x: number; y: number };

type Player = {
  pos: Vec2;
  hp: number;
  angle: number;
  fireCooldownMs: number;
  iframeMs: number;
  moving: boolean; // cosmetic — drives the walk-cycle animation, never gameplay-affecting
  animPhase: number; // cosmetic — walk-cycle clock, advances only while moving
};
type Monster = {
  id: number;
  typeId: string;
  behavior: MonsterBehavior;
  palette: MonsterPalette;
  pos: Vec2;
  hp: number;
  maxHp: number;
  damage: number; // contact damage (chaser/skirmisher/brute) or projectile base damage (ranged)
  speed: number;
  radius: number;
  hitCooldownMs: number;
  path: Vec2[];
  repathMs: number;
  repathIntervalMs: number; // per-behavior repath cadence — Stalker reacts faster than the rest
  rangedCooldownMs: number; // unused by non-ranged types
};
type Laser = { id: number; pos: Vec2; vel: Vec2; traveledPx: number; pierceLeft: number; hitIds: Set<number> };
type MonsterProjectile = { id: number; pos: Vec2; vel: Vec2; traveledPx: number; damage: number };
type TurretLaser = { id: number; pos: Vec2; vel: Vec2; traveledPx: number; damage: number };
type Gem = { id: number; pos: Vec2 };

export type InputState = { moveX: number; moveY: number; aimAngle: number | null };

export type World = {
  grid: MazeGrid;
  cols: number;
  rows: number;
  player: Player;
  monsters: Monster[];
  lasers: Laser[];
  monsterProjectiles: MonsterProjectile[];
  gems: Gem[];
  visible: Set<number>;
  spawnTimerMs: number;
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  gemsCollected: number;
  nextId: number;
  timeMs: number; // accumulated run time — purely cosmetic (gem pulse, iframe flicker), never gameplay-affecting
  exitPos: Vec2; // world-px center of the exit block — the win condition target
  stage: number; // derived from level via getStage() — which monster roster is currently spawning

  // ── Ability perks — runtime state, only meaningful once the matching ability is owned ────
  turretOrbitAngle: number; // continuously advances — the drone visibly orbits even with no target
  turretAimAngle: number; // last known direction to the current/most recent target, for smooth visual tracking
  turretHasTarget: boolean; // cosmetic — draws the drone "engaged" vs idle
  turretCooldownMs: number;
  turretLasers: TurretLaser[];
  barrierCooldownMs: number; // 0 = shield charged and ready; >0 = recharging after absorbing a hit
  barrierFlashMs: number; // counts down after an absorbed hit — drives the "shield broke" flash
  novaCooldownMs: number;
  novaPulseMs: number; // counts down after a pulse fires — drives the expanding-ring visual
  secondWindMs: number; // remaining duration of the post-hit speed/iframe burst
};

export type StepEvents = { leveledUp: boolean; died: boolean; wonMaze: boolean; killed: number };

function tileCenter(cx: number, cy: number): Vec2 {
  return { x: cx * MH_TILE_PX + MH_TILE_PX / 2, y: cy * MH_TILE_PX + MH_TILE_PX / 2 };
}

function worldToTile(pos: Vec2): { x: number; y: number } {
  return { x: Math.floor(pos.x / MH_TILE_PX), y: Math.floor(pos.y / MH_TILE_PX) };
}

/**
 * Picks a random floor tile at least `minDist` and at most `maxDist` tiles from `fromTile`.
 * The upper bound keeps spawns within a band around the player instead of anywhere on a large
 * maze — see MH_SPAWN_MAX_DIST_TILES in lib/game-config.ts for why that matters. If nothing
 * lands in the band within the sampling budget, falls back to the closest safe (>= minDist)
 * tile found even if it overshoots `maxDist`, and only as an absolute last resort (no floor
 * tile anywhere is even `minDist` away) to the farthest tile seen — a spawn must never land on
 * top of the player.
 */
function randomFloorTile(grid: MazeGrid, fromTile: { x: number; y: number }, minDist: number, maxDist: number): { x: number; y: number } {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  let closestBeyondMax: { x: number; y: number } | null = null;
  let closestBeyondMaxDist = Infinity;
  let farthestUnderMin: { x: number; y: number } | null = null;
  let farthestUnderMinDist = -1;

  for (let attempt = 0; attempt < 200; attempt++) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (isWall(grid, x, y)) continue;
    const dist = Math.hypot(x - fromTile.x, y - fromTile.y);

    if (dist >= minDist && dist <= maxDist) return { x, y };

    if (dist > maxDist && dist < closestBeyondMaxDist) {
      closestBeyondMaxDist = dist;
      closestBeyondMax = { x, y };
    } else if (dist < minDist && dist > farthestUnderMinDist) {
      farthestUnderMinDist = dist;
      farthestUnderMin = { x, y };
    }
  }

  return closestBeyondMax ?? farthestUnderMin ?? { x: fromTile.x, y: fromTile.y };
}

/** BFS shortest path in tile space from `from` to `to`, returned as world-pixel tile centers. */
function bfsPath(grid: MazeGrid, from: { x: number; y: number }, to: { x: number; y: number }): Vec2[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const key = (x: number, y: number) => y * cols + x;
  const start = key(from.x, from.y);
  const goal = key(to.x, to.y);
  if (start === goal) return [];

  const visited = new Set<number>([start]);
  const prev = new Map<number, number>();
  const queue: number[] = [start];
  let qi = 0;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  let found = false;
  while (qi < queue.length) {
    const cur = queue[qi++];
    if (cur === goal) {
      found = true;
      break;
    }
    const cx = cur % cols;
    const cy = Math.floor(cur / cols);
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (isWall(grid, nx, ny)) continue;
      const nk = key(nx, ny);
      if (visited.has(nk)) continue;
      visited.add(nk);
      prev.set(nk, cur);
      queue.push(nk);
    }
  }

  if (!found) return [];

  const path: Vec2[] = [];
  let cur = goal;
  while (cur !== start) {
    const x = cur % cols;
    const y = Math.floor(cur / cols);
    path.push(tileCenter(x, y));
    const p = prev.get(cur);
    if (p === undefined) break;
    cur = p;
  }
  return path.reverse();
}

/** Center tile of the corridor-width×corridor-width physical block a logical cell expands into. */
function blockCenterTile(logicalCoord: number): number {
  return logicalCoord * MH_CORRIDOR_WIDTH_TILES + Math.floor(MH_CORRIDOR_WIDTH_TILES / 2);
}

export function createWorld(stats: RunStats): World {
  // Generate a small logical maze, then blow it up into wide, easy-to-navigate corridors.
  // Expansion is a uniform scale-up (see lib/maze.ts), so the logical maze's guarantees —
  // fully connected, no unreachable pockets, exactly one spanning path between any two
  // rooms — carry over unchanged to the physical grid the game actually runs on.
  const logicalGrid = generateMaze(MH_MAZE_LOGICAL_COLS, MH_MAZE_LOGICAL_ROWS);
  const grid = expandMaze(logicalGrid, MH_CORRIDOR_WIDTH_TILES);

  const startTile = { x: blockCenterTile(1), y: blockCenterTile(1) };
  // The recursive backtracker visits every (odd, odd) logical cell — a full spanning tree
  // over the whole interior, not just a subset — so the far corner is always reachable
  // floor, making it a safe, honest "opposite side of the maze" exit.
  const exitLogicalX = logicalGrid[0].length - 2;
  const exitLogicalY = logicalGrid.length - 2;
  const exitTile = { x: blockCenterTile(exitLogicalX), y: blockCenterTile(exitLogicalY) };

  const player: Player = {
    pos: tileCenter(startTile.x, startTile.y),
    hp: stats.maxHp,
    angle: 0,
    fireCooldownMs: 0,
    iframeMs: 0,
    moving: false,
    animPhase: 0,
  };

  const world: World = {
    grid,
    cols: grid[0]?.length ?? 0,
    rows: grid.length,
    player,
    monsters: [],
    lasers: [],
    monsterProjectiles: [],
    gems: [],
    visible: computeVisible(grid, startTile.x, startTile.y, stats.visionTiles),
    spawnTimerMs: getSpawnIntervalMs(1, 1),
    level: 1,
    xp: 0,
    xpToNext: MH_XP_BASE,
    kills: 0,
    gemsCollected: 0,
    nextId: 1,
    timeMs: 0,
    exitPos: tileCenter(exitTile.x, exitTile.y),
    stage: getStage(1),
    turretOrbitAngle: 0,
    turretAimAngle: 0,
    turretHasTarget: false,
    turretCooldownMs: 0,
    turretLasers: [],
    barrierCooldownMs: 0,
    barrierFlashMs: 0,
    novaCooldownMs: 0,
    novaPulseMs: 0,
    secondWindMs: 0,
  };

  return world;
}

function moveWithCollision(grid: MazeGrid, pos: Vec2, dx: number, dy: number, radius: number): Vec2 {
  let x = pos.x;
  let y = pos.y;

  // Resolve X and Y independently so the player slides along walls instead of sticking.
  const tryX = x + dx;
  if (!circleHitsWall(grid, tryX, y, radius)) x = tryX;
  const tryY = y + dy;
  if (!circleHitsWall(grid, x, tryY, radius)) y = tryY;

  return { x, y };
}

function circleHitsWall(grid: MazeGrid, x: number, y: number, radius: number): boolean {
  const minTx = Math.floor((x - radius) / MH_TILE_PX);
  const maxTx = Math.floor((x + radius) / MH_TILE_PX);
  const minTy = Math.floor((y - radius) / MH_TILE_PX);
  const maxTy = Math.floor((y + radius) / MH_TILE_PX);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!isWall(grid, tx, ty)) continue;
      const closestX = Math.max(tx * MH_TILE_PX, Math.min(x, tx * MH_TILE_PX + MH_TILE_PX));
      const closestY = Math.max(ty * MH_TILE_PX, Math.min(y, ty * MH_TILE_PX + MH_TILE_PX));
      if (Math.hypot(x - closestX, y - closestY) < radius) return true;
    }
  }
  return false;
}

function spawnLaser(world: World, stats: RunStats, angle: number) {
  const spreadCount = stats.projectiles;
  const mid = (spreadCount - 1) / 2;
  for (let i = 0; i < spreadCount; i++) {
    const offset = (i - mid) * MH_TRISHOT_SPREAD_RAD;
    const a = angle + offset;
    world.lasers.push({
      id: world.nextId++,
      pos: { ...world.player.pos },
      vel: { x: Math.cos(a) * MH_LASER_SPEED, y: Math.sin(a) * MH_LASER_SPEED },
      traveledPx: 0,
      pierceLeft: stats.pierce,
      hitIds: new Set(),
    });
  }
}

const PLAYER_RADIUS = MH_TILE_PX * 0.38; // deliberately bigger than MONSTER_RADIUS so the hunter reads as the primary, most important figure on screen
const MONSTER_RADIUS = MH_TILE_PX * 0.3;
const LASER_RADIUS = 4;
const GEM_RADIUS = MH_TILE_PX * 0.18;
const GEM_PICKUP_RADIUS = MH_TILE_PX * 0.4;

function isPosVisible(world: World, pos: Vec2): boolean {
  const t = worldToTile(pos);
  return world.visible.has(t.y * world.cols + t.x);
}

/**
 * Single entry point for any damage the player takes (monster contact, monster projectile).
 * Centralizes Kinetic Barrier's full-hit absorption and Second Wind's on-hit speed/iframe
 * burst so both abilities apply identically regardless of which threat triggered them.
 */
function applyDamageToPlayer(world: World, abilities: AbilityState, amount: number, events: StepEvents): void {
  if (world.player.iframeMs > 0) return;

  if (abilities.barrier.owned && world.barrierCooldownMs <= 0) {
    world.barrierCooldownMs = abilities.barrier.rechargeMs;
    world.barrierFlashMs = MH_BARRIER_FLASH_MS;
    world.player.iframeMs = MH_PLAYER_IFRAME_MS; // brief grace so the same swarm can't instantly re-trigger it
    return;
  }

  world.player.hp -= amount;
  world.player.iframeMs = MH_PLAYER_IFRAME_MS;
  if (abilities.secondWind.owned) {
    world.secondWindMs = MH_SECOND_WIND_DURATION_MS;
    world.player.iframeMs += MH_SECOND_WIND_BONUS_IFRAME_MS;
  }
  if (world.player.hp <= 0) events.died = true;
}

export function stepWorld(world: World, dtSeconds: number, input: InputState, stats: RunStats, abilities: AbilityState): StepEvents {
  const events: StepEvents = { leveledUp: false, died: false, wonMaze: false, killed: 0 };
  const dtMs = dtSeconds * 1000;
  world.timeMs += dtMs;

  if (world.player.iframeMs > 0) world.player.iframeMs -= dtMs;
  if (world.barrierCooldownMs > 0) world.barrierCooldownMs -= dtMs;
  if (world.barrierFlashMs > 0) world.barrierFlashMs -= dtMs;
  if (world.novaPulseMs > 0) world.novaPulseMs -= dtMs;
  if (world.secondWindMs > 0) world.secondWindMs -= dtMs;
  if (world.player.hp <= 0) {
    events.died = true;
    return events;
  }

  // ── Player movement — Second Wind grants a temporary speed burst after taking a hit ──────
  const moveLen = Math.hypot(input.moveX, input.moveY);
  if (moveLen > 0.01) {
    const nx = input.moveX / moveLen;
    const ny = input.moveY / moveLen;
    const speedMult = world.secondWindMs > 0 ? MH_SECOND_WIND_SPEED_MULT : 1;
    const dx = nx * stats.speed * speedMult * dtSeconds;
    const dy = ny * stats.speed * speedMult * dtSeconds;
    world.player.pos = moveWithCollision(world.grid, world.player.pos, dx, dy, PLAYER_RADIUS);
  }
  if (input.aimAngle !== null) {
    world.player.angle = input.aimAngle;
  } else if (moveLen > 0.01) {
    world.player.angle = Math.atan2(input.moveY, input.moveX);
  }

  world.player.moving = moveLen > 0.01;
  if (world.player.moving) world.player.animPhase += dtSeconds * 9;

  // ── Win condition: reaching the exit ────────────────────────────────────────
  const distToExit = Math.hypot(world.player.pos.x - world.exitPos.x, world.player.pos.y - world.exitPos.y);
  if (distToExit <= MH_EXIT_REACH_RADIUS_TILES * MH_TILE_PX) {
    events.wonMaze = true;
    return events;
  }

  // ── Visibility ────────────────────────────────────────────────────────────
  const playerTile = worldToTile(world.player.pos);
  world.visible = computeVisible(world.grid, playerTile.x, playerTile.y, stats.visionTiles);

  // ── Firing ────────────────────────────────────────────────────────────────
  world.player.fireCooldownMs -= dtMs;
  if (world.player.fireCooldownMs <= 0) {
    spawnLaser(world, stats, world.player.angle);
    world.player.fireCooldownMs = stats.fireCooldownMs;
  }

  // ── Lasers: move, wall collision, monster collision ──────────────────────
  const maxRangePx = MH_LASER_RANGE_TILES * MH_TILE_PX;
  world.lasers = world.lasers.filter((laser) => {
    const stepDx = laser.vel.x * dtSeconds;
    const stepDy = laser.vel.y * dtSeconds;
    laser.pos = { x: laser.pos.x + stepDx, y: laser.pos.y + stepDy };
    laser.traveledPx += Math.hypot(stepDx, stepDy);

    if (laser.traveledPx > maxRangePx) return false;
    const tile = worldToTile(laser.pos);
    if (isWall(world.grid, tile.x, tile.y)) return false;

    for (const monster of world.monsters) {
      if (laser.hitIds.has(monster.id)) continue;
      const dist = Math.hypot(laser.pos.x - monster.pos.x, laser.pos.y - monster.pos.y);
      if (dist < LASER_RADIUS + MONSTER_RADIUS) {
        monster.hp -= stats.damage;
        laser.hitIds.add(monster.id);
        if (stats.lifestealPct > 0) {
          world.player.hp = Math.min(stats.maxHp, world.player.hp + stats.damage * stats.lifestealPct);
        }
        if (laser.pierceLeft <= 0) return false;
        laser.pierceLeft -= 1;
      }
    }

    return true;
  });

  // ── Turret Drone: orbits the player, tracks the best target every frame, fires on cooldown ──
  // Continuous targeting (not gated by the fire cooldown) is what makes the drone visibly
  // track a monster between shots instead of only snapping to face it the instant it fires.
  if (abilities.turret.owned) {
    world.turretOrbitAngle += MH_TURRET_ORBIT_SPEED * dtSeconds;
    const orbitRPx = MH_TURRET_ORBIT_RADIUS_TILES * MH_TILE_PX;
    const turretPos = {
      x: world.player.pos.x + Math.cos(world.turretOrbitAngle) * orbitRPx,
      y: world.player.pos.y + Math.sin(world.turretOrbitAngle) * orbitRPx,
    };
    const turretRangePx = abilities.turret.rangeTiles * MH_TILE_PX;

    let target: Monster | null = null;
    let bestScore = Infinity;
    for (const m of world.monsters) {
      if (!isPosVisible(world, m.pos)) continue;
      const d = Math.hypot(m.pos.x - turretPos.x, m.pos.y - turretPos.y);
      if (d > turretRangePx) continue;
      // Default targeting is nearest-first; Precision Targeting instead finishes off the
      // weakest monster in range, trading reach for cleaning up the swarm faster.
      const score = abilities.turret.smartTargeting ? m.hp : d;
      if (score < bestScore) {
        bestScore = score;
        target = m;
      }
    }
    world.turretHasTarget = target !== null;
    if (target) world.turretAimAngle = Math.atan2(target.pos.y - turretPos.y, target.pos.x - turretPos.x);

    world.turretCooldownMs -= dtMs;
    if (target && world.turretCooldownMs <= 0) {
      world.turretCooldownMs = abilities.turret.fireCooldownMs;
      const spreadCount = abilities.turret.projectiles;
      const mid = (spreadCount - 1) / 2;
      const dmg = MH_TURRET_BASE_DAMAGE * abilities.turret.damageMult;
      for (let i = 0; i < spreadCount; i++) {
        const a = world.turretAimAngle + (i - mid) * MH_TRISHOT_SPREAD_RAD;
        world.turretLasers.push({
          id: world.nextId++,
          pos: { ...turretPos },
          vel: { x: Math.cos(a) * MH_TURRET_LASER_SPEED, y: Math.sin(a) * MH_TURRET_LASER_SPEED },
          traveledPx: 0,
          damage: dmg,
        });
      }
    }
  }

  // ── Turret lasers: move, wall collision, monster collision (single-hit, no pierce) ────────
  const turretMaxRangePx = abilities.turret.rangeTiles * MH_TILE_PX * 1.6; // let shots overshoot nominal range a bit before despawning
  world.turretLasers = world.turretLasers.filter((laser) => {
    const stepDx = laser.vel.x * dtSeconds;
    const stepDy = laser.vel.y * dtSeconds;
    laser.pos = { x: laser.pos.x + stepDx, y: laser.pos.y + stepDy };
    laser.traveledPx += Math.hypot(stepDx, stepDy);

    if (laser.traveledPx > turretMaxRangePx) return false;
    const tile = worldToTile(laser.pos);
    if (isWall(world.grid, tile.x, tile.y)) return false;

    for (const monster of world.monsters) {
      const dist = Math.hypot(laser.pos.x - monster.pos.x, laser.pos.y - monster.pos.y);
      if (dist < LASER_RADIUS + monster.radius) {
        monster.hp -= laser.damage;
        return false;
      }
    }
    return true;
  });

  // ── Nova Burst: periodic AoE pulse centered on the player — a burst, not a projectile, so ──
  // it ignores walls and hits every monster in radius at once regardless of line of sight.
  if (abilities.novaBurst.owned) {
    world.novaCooldownMs -= dtMs;
    if (world.novaCooldownMs <= 0) {
      world.novaCooldownMs = abilities.novaBurst.intervalMs;
      world.novaPulseMs = MH_NOVA_VISUAL_MS;
      const novaRadiusPx = abilities.novaBurst.radiusTiles * MH_TILE_PX;
      for (const m of world.monsters) {
        const d = Math.hypot(m.pos.x - world.player.pos.x, m.pos.y - world.player.pos.y);
        if (d <= novaRadiusPx) m.hp -= abilities.novaBurst.damage;
      }
    }
  }

  // ── Monster deaths → gems ────────────────────────────────────────────────
  const survivors: Monster[] = [];
  for (const monster of world.monsters) {
    if (monster.hp <= 0) {
      events.killed += 1;
      world.kills += 1;
      world.gems.push({ id: world.nextId++, pos: { ...monster.pos } });
    } else {
      survivors.push(monster);
    }
  }
  world.monsters = survivors;

  // ── Monster AI: BFS repath periodically, follow waypoints, attack ───────────
  for (const monster of world.monsters) {
    const distToPlayerPx = Math.hypot(monster.pos.x - world.player.pos.x, monster.pos.y - world.player.pos.y);

    // Ranged monsters hold a standoff distance instead of closing to melee: they path in like
    // any other chaser until inside their attack range, then stop and spit projectiles.
    const holdingRange = monster.behavior === "ranged" && distToPlayerPx <= MH_RANGED_ATTACK_RANGE_TILES * MH_TILE_PX;

    monster.repathMs -= dtMs;
    if (monster.repathMs <= 0) {
      const mTile = worldToTile(monster.pos);
      monster.path = bfsPath(world.grid, mTile, playerTile);
      monster.repathMs = monster.repathIntervalMs;
    }

    if (!holdingRange && monster.path.length > 0) {
      const target = monster.path[0];
      const dx = target.x - monster.pos.x;
      const dy = target.y - monster.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        monster.path.shift();
      } else {
        monster.pos = {
          x: monster.pos.x + (dx / dist) * monster.speed * dtSeconds,
          y: monster.pos.y + (dy / dist) * monster.speed * dtSeconds,
        };
      }
    }

    if (monster.behavior === "ranged") {
      monster.rangedCooldownMs -= dtMs;
      if (holdingRange && monster.rangedCooldownMs <= 0) {
        monster.rangedCooldownMs = MH_RANGED_COOLDOWN_MS;
        const dx = world.player.pos.x - monster.pos.x;
        const dy = world.player.pos.y - monster.pos.y;
        const dist = Math.hypot(dx, dy) || 1;
        world.monsterProjectiles.push({
          id: world.nextId++,
          pos: { ...monster.pos },
          vel: { x: (dx / dist) * MH_RANGED_PROJECTILE_SPEED, y: (dy / dist) * MH_RANGED_PROJECTILE_SPEED },
          traveledPx: 0,
          damage: monster.damage,
        });
      }
      continue; // ranged monsters never deal contact damage
    }

    monster.hitCooldownMs -= dtMs;
    if (monster.hitCooldownMs <= 0) {
      if (distToPlayerPx < monster.radius + PLAYER_RADIUS) {
        monster.hitCooldownMs = MH_MONSTER_HIT_COOLDOWN_MS;
        applyDamageToPlayer(world, abilities, monster.damage, events);
      }
    }
  }

  // ── Monster projectiles: move, wall collision, player collision ────────────
  const maxProjectileRangePx = MH_RANGED_ATTACK_RANGE_TILES * 2 * MH_TILE_PX;
  world.monsterProjectiles = world.monsterProjectiles.filter((proj) => {
    const stepDx = proj.vel.x * dtSeconds;
    const stepDy = proj.vel.y * dtSeconds;
    proj.pos = { x: proj.pos.x + stepDx, y: proj.pos.y + stepDy };
    proj.traveledPx += Math.hypot(stepDx, stepDy);

    if (proj.traveledPx > maxProjectileRangePx) return false;
    const tile = worldToTile(proj.pos);
    if (isWall(world.grid, tile.x, tile.y)) return false;

    const dist = Math.hypot(proj.pos.x - world.player.pos.x, proj.pos.y - world.player.pos.y);
    if (dist < LASER_RADIUS + PLAYER_RADIUS) {
      applyDamageToPlayer(world, abilities, proj.damage, events);
      return false;
    }

    return true;
  });

  // ── Gem pickup ────────────────────────────────────────────────────────────
  world.gems = world.gems.filter((gem) => {
    const dist = Math.hypot(gem.pos.x - world.player.pos.x, gem.pos.y - world.player.pos.y);
    if (dist < GEM_PICKUP_RADIUS + GEM_RADIUS) {
      world.gemsCollected += 1;
      world.xp += MH_GEM_XP * stats.xpMult;
      return false;
    }
    return true;
  });

  // ── Leveling ──────────────────────────────────────────────────────────────
  if (world.xp >= world.xpToNext) {
    world.xp -= world.xpToNext;
    world.level += 1;
    world.xpToNext = Math.round(MH_XP_BASE * Math.pow(MH_XP_GROWTH, world.level - 1));
    world.stage = getStage(world.level);
    events.leveledUp = true;
  }

  // ── Spawning ──────────────────────────────────────────────────────────────
  world.spawnTimerMs -= dtMs;
  if (world.spawnTimerMs <= 0 && world.monsters.length < getMaxMonsters(world.stage)) {
    const spot = randomFloorTile(world.grid, playerTile, MH_SPAWN_MIN_DIST_TILES, MH_SPAWN_MAX_DIST_TILES);
    const type = pickMonsterType(world.stage);
    const scale = getStageScale(world.stage);
    const maxHp = Math.round(MH_MONSTER_HP * type.hpMult * scale.hp);
    world.monsters.push({
      id: world.nextId++,
      typeId: type.id,
      behavior: type.behavior,
      palette: type.palette,
      pos: tileCenter(spot.x, spot.y),
      hp: maxHp,
      maxHp,
      damage: MH_MONSTER_DAMAGE * type.damageMult * scale.damage,
      speed: MH_MONSTER_SPEED * type.speedMult * scale.speed,
      radius: MONSTER_RADIUS * type.radiusMult,
      hitCooldownMs: 0,
      path: [],
      repathMs: 0,
      repathIntervalMs: type.behavior === "skirmisher" ? MH_STALKER_REPATH_MS : MH_MONSTER_REPATH_MS,
      rangedCooldownMs: MH_RANGED_COOLDOWN_MS,
    });
    world.spawnTimerMs = getSpawnIntervalMs(world.stage, world.level);
  }

  return events;
}

// ── Procedural textures ───────────────────────────────────────────────────────
// No image assets exist in this codebase, so the mossy-stone wall and grass floor are
// generated once onto small offscreen tile canvases and repeated via CanvasPattern.
// Because a pattern always tiles from a fixed origin (not from each fillRect's own x/y),
// any two fillRect calls whose positions differ by an exact multiple of MH_TILE_PX line up
// pixel-for-pixel — which every wall/floor tile's screen position always does here — so the
// tiling is seamless by construction. Decorative organic details (moss blobs, cracks, grass
// blades) are kept inset from the tile edges so nothing gets asymmetrically clipped at the
// wrap-around; the structural grid (stone blocks) is hard-edged and axis-aligned, which tiles
// perfectly regardless.

function drawStoneWallTile(tctx: CanvasRenderingContext2D, size: number): void {
  const base = tctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, "#5f5b52");
  base.addColorStop(1, "#38352c");
  tctx.fillStyle = base;
  tctx.fillRect(0, 0, size, size);

  // Cobblestone grid — evenly divides the tile, so grid lines are periodic and seamless.
  const cols = 4;
  const cell = size / cols;
  for (let gy = 0; gy < cols; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const x0 = gx * cell;
      const y0 = gy * cell;
      const inset = 1.2;
      const shade = 0.82 + Math.random() * 0.32; // per-stone brightness jitter
      const rx = x0 + inset;
      const ry = y0 + inset;
      const rw = cell - inset * 2;
      const rh = cell - inset * 2;
      tctx.fillStyle = `rgb(${Math.round(96 * shade)},${Math.round(90 * shade)},${Math.round(78 * shade)})`;
      tctx.fillRect(rx, ry, rw, rh);
      tctx.fillStyle = "rgba(255,255,255,0.08)";
      tctx.fillRect(rx, ry, rw, 1);
      tctx.fillStyle = "rgba(0,0,0,0.22)";
      tctx.fillRect(rx, ry + rh - 1, rw, 1);
    }
  }

  // Moss, biased toward the lower half — kept well inside the tile so it never clips at an edge.
  for (let i = 0; i < 3; i++) {
    const mx = 6 + Math.random() * (size - 12);
    const my = size * 0.5 + Math.random() * (size * 0.45);
    const mr = 3 + Math.random() * 4;
    const grad = tctx.createRadialGradient(mx, my, 0, mx, my, mr);
    grad.addColorStop(0, "rgba(74,124,58,0.85)");
    grad.addColorStop(1, "rgba(74,124,58,0)");
    tctx.fillStyle = grad;
    tctx.beginPath();
    tctx.arc(mx, my, mr, 0, Math.PI * 2);
    tctx.fill();
  }

  // Fine cracks, also inset.
  tctx.strokeStyle = "rgba(0,0,0,0.3)";
  tctx.lineWidth = 0.6;
  for (let i = 0; i < 2; i++) {
    const sx0 = 5 + Math.random() * (size - 10);
    const sy0 = 5 + Math.random() * (size - 10);
    tctx.beginPath();
    tctx.moveTo(sx0, sy0);
    tctx.lineTo(sx0 + (Math.random() - 0.5) * 10, sy0 + (Math.random() - 0.5) * 10);
    tctx.stroke();
  }
}

function drawGrassFloorTile(tctx: CanvasRenderingContext2D, size: number): void {
  const base = tctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, "#3f7a34");
  base.addColorStop(1, "#25491d");
  tctx.fillStyle = base;
  tctx.fillRect(0, 0, size, size);

  // Dirt/shadow patches for natural variation.
  for (let i = 0; i < 3; i++) {
    const mx = Math.random() * size;
    const my = Math.random() * size;
    const mr = 4 + Math.random() * 6;
    const grad = tctx.createRadialGradient(mx, my, 0, mx, my, mr);
    grad.addColorStop(0, "rgba(25,45,18,0.35)");
    grad.addColorStop(1, "rgba(25,45,18,0)");
    tctx.fillStyle = grad;
    tctx.beginPath();
    tctx.arc(mx, my, mr, 0, Math.PI * 2);
    tctx.fill();
  }

  // Scattered grass blades — small enough that occasional edge crossings are imperceptible.
  for (let i = 0; i < 55; i++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    const len = 2 + Math.random() * 3;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9; // mostly upright
    const bright = Math.random() > 0.5;
    tctx.strokeStyle = bright ? "rgba(150,210,100,0.55)" : "rgba(18,55,14,0.5)";
    tctx.lineWidth = 1;
    tctx.beginPath();
    tctx.moveTo(bx, by);
    tctx.lineTo(bx + Math.cos(angle) * len, by + Math.sin(angle) * len);
    tctx.stroke();
  }
}

let wallTextureCanvas: HTMLCanvasElement | null = null;
let floorTextureCanvas: HTMLCanvasElement | null = null;

function getWallTexture(): HTMLCanvasElement {
  if (!wallTextureCanvas) {
    const c = document.createElement("canvas");
    c.width = MH_TILE_PX;
    c.height = MH_TILE_PX;
    drawStoneWallTile(c.getContext("2d")!, MH_TILE_PX);
    wallTextureCanvas = c;
  }
  return wallTextureCanvas;
}

function getFloorTexture(): HTMLCanvasElement {
  if (!floorTextureCanvas) {
    const c = document.createElement("canvas");
    c.width = MH_TILE_PX;
    c.height = MH_TILE_PX;
    drawGrassFloorTile(c.getContext("2d")!, MH_TILE_PX);
    floorTextureCanvas = c;
  }
  return floorTextureCanvas;
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: World, cssW: number, cssH: number, abilities: AbilityState): void {
  ctx.fillStyle = "#020208";
  ctx.fillRect(0, 0, cssW, cssH);

  const camX = world.player.pos.x - cssW / 2;
  const camY = world.player.pos.y - cssH / 2;

  const minTx = Math.floor(camX / MH_TILE_PX) - 1;
  const maxTx = Math.floor((camX + cssW) / MH_TILE_PX) + 1;
  const minTy = Math.floor(camY / MH_TILE_PX) - 1;
  const maxTy = Math.floor((camY + cssH) / MH_TILE_PX) + 1;

  // ── Tiles: mossy cobblestone walls, grass floor — both seamlessly tiled patterns ──
  const wallPattern = ctx.createPattern(getWallTexture(), "repeat") ?? "#3a352d";
  const floorPattern = ctx.createPattern(getFloorTexture(), "repeat") ?? "#25491d";
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const key = ty * world.cols + tx;
      if (!world.visible.has(key)) continue;
      const sx = tx * MH_TILE_PX - camX;
      const sy = ty * MH_TILE_PX - camY;
      const wall = isWall(world.grid, tx, ty);

      ctx.fillStyle = wall ? wallPattern : floorPattern;
      ctx.fillRect(sx, sy, MH_TILE_PX, MH_TILE_PX);

      if (wall) {
        // Per-cell ambient occlusion so individual maze wall blocks still read as distinct
        // blocks even though the stone texture itself tiles continuously across them.
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(sx, sy, MH_TILE_PX, 2);
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.strokeRect(sx + 0.5, sy + 0.5, MH_TILE_PX - 1, MH_TILE_PX - 1);
      }
    }
  }

  const toScreen = (p: Vec2) => ({ x: p.x - camX, y: p.y - camY });
  const tileKeyOf = (p: Vec2) => {
    const t = worldToTile(p);
    return t.y * world.cols + t.x;
  };

  // ── Exit portal: the win-condition marker, only drawn once discovered ──────
  if (world.visible.has(tileKeyOf(world.exitPos))) {
    const s = toScreen(world.exitPos);
    const pulse = 1 + Math.sin(world.timeMs / 260) * 0.12;
    const outerR = MH_TILE_PX * 0.9 * pulse;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(world.timeMs / 900);
    ctx.strokeStyle = "rgba(74,222,128,0.7)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, outerR * 0.65);
    grad.addColorStop(0, "#f0fdf4");
    grad.addColorStop(0.5, "#4ade80");
    grad.addColorStop(1, "rgba(74,222,128,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, outerR * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Gems: pulsing glow ──────────────────────────────────────────────────────
  const gemPulse = 1 + Math.sin(world.timeMs / 220) * 0.15;
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 14;
  for (const gem of world.gems) {
    if (!world.visible.has(tileKeyOf(gem.pos))) continue;
    const s = toScreen(gem.pos);
    const r = GEM_RADIUS * gemPulse;
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
    grad.addColorStop(0, "#eafeff");
    grad.addColorStop(0.5, "#22d3ee");
    grad.addColorStop(1, "#0e7490");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // ── Monsters: type-tinted gradient body + eyes + a damage ring once hurt ───
  // Each monster type (lib/monsters-data.ts) carries its own palette/radius so stages read as
  // visually distinct rosters, not just recolored reskins of the same blob.
  for (const monster of world.monsters) {
    if (!world.visible.has(tileKeyOf(monster.pos))) continue;
    const s = toScreen(monster.pos);
    ctx.shadowColor = monster.palette.glow;
    ctx.shadowBlur = 9;
    const grad = ctx.createRadialGradient(s.x - 5, s.y - 5, 2, s.x, s.y, monster.radius);
    grad.addColorStop(0, monster.palette.core);
    grad.addColorStop(0.45, monster.palette.mid);
    grad.addColorStop(1, monster.palette.edge);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, monster.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#1a0505";
    const eyeOffset = monster.radius * 0.35;
    ctx.beginPath();
    ctx.arc(s.x - eyeOffset, s.y - eyeOffset * 0.6, 1.6, 0, Math.PI * 2);
    ctx.arc(s.x + eyeOffset, s.y - eyeOffset * 0.6, 1.6, 0, Math.PI * 2);
    ctx.fill();

    if (monster.hp < monster.maxHp) {
      const pct = Math.max(0, monster.hp / monster.maxHp);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, monster.radius + 4, -Math.PI / 2, Math.PI * 2 * pct - Math.PI / 2);
      ctx.stroke();
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, monster.radius + 4, -Math.PI / 2, Math.PI * 2 * pct - Math.PI / 2);
      ctx.stroke();
    }
  }

  // ── Lasers: hot glowing core ─────────────────────────────────────────────────
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 12;
  for (const laser of world.lasers) {
    const s = toScreen(laser.pos);
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, LASER_RADIUS * 1.9);
    grad.addColorStop(0, "#fffbeb");
    grad.addColorStop(0.5, "#fbbf24");
    grad.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, LASER_RADIUS * 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // ── Monster projectiles: sickly green spit, distinct from the player's amber lasers ──
  ctx.shadowColor = "#16a34a";
  ctx.shadowBlur = 12;
  for (const proj of world.monsterProjectiles) {
    if (!world.visible.has(tileKeyOf(proj.pos))) continue;
    const s = toScreen(proj.pos);
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, LASER_RADIUS * 1.9);
    grad.addColorStop(0, "#f0fdf4");
    grad.addColorStop(0.5, "#4ade80");
    grad.addColorStop(1, "rgba(74,222,128,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, LASER_RADIUS * 1.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // ── Turret Drone: orbiting companion, violet-tech palette distinct from the player's blue ──
  if (abilities.turret.owned) {
    const orbitRPx = MH_TURRET_ORBIT_RADIUS_TILES * MH_TILE_PX;
    const turretWorldPos = {
      x: world.player.pos.x + Math.cos(world.turretOrbitAngle) * orbitRPx,
      y: world.player.pos.y + Math.sin(world.turretOrbitAngle) * orbitRPx,
    };
    const ts = toScreen(turretWorldPos);
    const engaged = world.turretHasTarget;
    const bodyR = MH_TILE_PX * 0.22;

    // Faint orbit trail so the "rotates around the player" behavior reads clearly even idle.
    const playerScreen = toScreen(world.player.pos);
    ctx.strokeStyle = "rgba(168,85,247,0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(playerScreen.x, playerScreen.y, orbitRPx, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(ts.x, ts.y);
    ctx.rotate(world.turretAimAngle);

    // Hexagonal drone chassis — glows hotter pink when actively engaging a target.
    ctx.shadowColor = engaged ? "#f472b6" : "#a855f7";
    ctx.shadowBlur = engaged ? 14 : 8;
    const bodyGrad = ctx.createRadialGradient(-bodyR * 0.3, -bodyR * 0.3, 1, 0, 0, bodyR);
    bodyGrad.addColorStop(0, engaged ? "#fbcfe8" : "#e9d5ff");
    bodyGrad.addColorStop(0.55, engaged ? "#ec4899" : "#a855f7");
    bodyGrad.addColorStop(1, "#4c1d95");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = Math.cos(a) * bodyR;
      const py = Math.sin(a) * bodyR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Barrel, pointed at the current aim angle (already applied via the rotate above).
    ctx.fillStyle = "#2b2f3a";
    ctx.fillRect(bodyR * 0.2, -bodyR * 0.16, bodyR * 0.9, bodyR * 0.32);
    const muzzleColor = engaged ? "#f472b6" : "#c084fc";
    ctx.fillStyle = muzzleColor;
    ctx.shadowColor = muzzleColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(bodyR * 1.05, 0, bodyR * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // ── Turret lasers: violet bolts, distinct from the player's amber and monsters' green ──
  ctx.shadowColor = "#c084fc";
  ctx.shadowBlur = 10;
  for (const laser of world.turretLasers) {
    const s = toScreen(laser.pos);
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, LASER_RADIUS * 1.7);
    grad.addColorStop(0, "#fdf4ff");
    grad.addColorStop(0.5, "#c084fc");
    grad.addColorStop(1, "rgba(192,132,252,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, LASER_RADIUS * 1.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // ── Player: an animated top-down hunter — legs, torso, hooded head, blaster ─────
  // Deliberately a different silhouette, palette, and animation from the monsters'
  // round gradient blobs, and rendered larger (PLAYER_RADIUS > MONSTER_RADIUS) so the
  // hunter always reads as the primary figure on screen.
  const pScreen = toScreen(world.player.pos);
  const flashing = world.player.iframeMs > 0 && Math.floor(world.timeMs / 80) % 2 === 0;
  if (!flashing) {
    const legSwing = world.player.moving ? Math.sin(world.player.animPhase) * 4 : 0;
    const idleBreath = world.player.moving ? 0 : Math.sin(world.timeMs / 320) * 0.035;

    ctx.save();
    ctx.translate(pScreen.x, pScreen.y);
    ctx.rotate(world.player.angle);
    ctx.scale(1 + idleBreath, 1 + idleBreath);

    // Legs (behind the body), positioned to poke out past the torso's sides so they stay
    // visible even at rest, and alternating fore/aft via the walk-cycle phase.
    ctx.fillStyle = "#2e2719";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(-PLAYER_RADIUS * 0.25 + legSwing, -PLAYER_RADIUS * 0.74, PLAYER_RADIUS * 0.26, PLAYER_RADIUS * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-PLAYER_RADIUS * 0.25 - legSwing, PLAYER_RADIUS * 0.74, PLAYER_RADIUS * 0.26, PLAYER_RADIUS * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Torso — rugged leather-and-hide hunter gear, outlined for a clean silhouette.
    ctx.shadowColor = "#5ac8fa";
    ctx.shadowBlur = 14;
    const bodyGrad = ctx.createRadialGradient(-PLAYER_RADIUS * 0.2, -PLAYER_RADIUS * 0.3, 1, 0, 0, PLAYER_RADIUS);
    bodyGrad.addColorStop(0, "#8a7350");
    bodyGrad.addColorStop(0.55, "#5c4c31");
    bodyGrad.addColorStop(1, "#2e2517");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(-PLAYER_RADIUS * 0.15, 0, PLAYER_RADIUS * 0.8, PLAYER_RADIUS * 0.66, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Chest strap accent, tying into the laser/blaster color identity.
    ctx.strokeStyle = "rgba(90,200,250,0.6)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(-PLAYER_RADIUS * 0.15, 0, PLAYER_RADIUS * 0.48, PLAYER_RADIUS * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Hooded head, pushed toward the facing direction — noticeably lighter/warmer than
    // the torso so it reads as a distinct part rather than blending into one blob.
    ctx.shadowColor = "#5ac8fa";
    ctx.shadowBlur = 8;
    const headGrad = ctx.createRadialGradient(PLAYER_RADIUS * 0.28, -PLAYER_RADIUS * 0.16, 1, PLAYER_RADIUS * 0.42, 0, PLAYER_RADIUS * 0.52);
    headGrad.addColorStop(0, "#c9a875");
    headGrad.addColorStop(0.6, "#8a6f45");
    headGrad.addColorStop(1, "#4a3a22");
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(PLAYER_RADIUS * 0.46, 0, PLAYER_RADIUS * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Visor — a small tech accent that also doubles as an unmistakable "front" indicator.
    ctx.fillStyle = "#5ac8fa";
    ctx.shadowColor = "#5ac8fa";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(PLAYER_RADIUS * 0.58, 0, PLAYER_RADIUS * 0.22, PLAYER_RADIUS * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Blaster, extended along the aim direction with a glowing muzzle.
    ctx.fillStyle = "#2b2f3a";
    ctx.fillRect(PLAYER_RADIUS * 0.3, -PLAYER_RADIUS * 0.14, PLAYER_RADIUS * 1.1, PLAYER_RADIUS * 0.28);
    ctx.fillStyle = "#5ac8fa";
    ctx.shadowColor = "#5ac8fa";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(PLAYER_RADIUS * 1.4, 0, PLAYER_RADIUS * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // ── Kinetic Barrier: charged ring / recharge progress / absorb flash around the player ──
  if (abilities.barrier.owned) {
    if (world.barrierFlashMs > 0) {
      // Just absorbed a hit — a fast white ring expanding outward and fading, distinct from
      // the steady charged ring so "the shield just worked" reads as a one-off event.
      const t = 1 - world.barrierFlashMs / MH_BARRIER_FLASH_MS;
      const r = PLAYER_RADIUS * (1.4 + t * 1.3);
      ctx.strokeStyle = `rgba(224,242,254,${0.75 * (1 - t)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pScreen.x, pScreen.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (world.barrierCooldownMs <= 0) {
      // Charged and ready — a slowly rotating cyan ring around the player.
      ctx.save();
      ctx.translate(pScreen.x, pScreen.y);
      ctx.rotate(world.timeMs / 1400);
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(56,189,248,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      // Recharging — a faint dashed arc that fills back in as it approaches ready.
      const pct = 1 - world.barrierCooldownMs / abilities.barrier.rechargeMs;
      ctx.strokeStyle = "rgba(56,189,248,0.28)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(pScreen.x, pScreen.y, PLAYER_RADIUS * 1.5, -Math.PI / 2, Math.PI * 2 * pct - Math.PI / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── Second Wind: fiery motion streaks trailing the player during the post-hit speed burst ──
  if (world.secondWindMs > 0) {
    const pct = world.secondWindMs / MH_SECOND_WIND_DURATION_MS;
    ctx.strokeStyle = `rgba(251,146,60,${0.55 * pct})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const spread = (i - 1) * 0.4;
      const a = world.player.angle + Math.PI + spread;
      const innerR = PLAYER_RADIUS * 0.6;
      const outerR = PLAYER_RADIUS * (1.3 + i * 0.5);
      ctx.beginPath();
      ctx.moveTo(pScreen.x + Math.cos(a) * innerR, pScreen.y + Math.sin(a) * innerR);
      ctx.lineTo(pScreen.x + Math.cos(a) * outerR, pScreen.y + Math.sin(a) * outerR);
      ctx.stroke();
    }
  }

  // ── Nova Burst: expanding shockwave ring the instant a pulse fires ──────────────────────
  if (abilities.novaBurst.owned && world.novaPulseMs > 0) {
    const t = 1 - world.novaPulseMs / MH_NOVA_VISUAL_MS;
    const maxR = abilities.novaBurst.radiusTiles * MH_TILE_PX;
    const r = maxR * t;
    ctx.strokeStyle = `rgba(250,204,21,${0.55 * (1 - t)})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(pScreen.x, pScreen.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Atmosphere: warm torchlight near the player fading to darkness at the vision edge ──
  const glow = ctx.createRadialGradient(cssW / 2, cssH / 2, 0, cssW / 2, cssH / 2, MH_TILE_PX * 2.5);
  glow.addColorStop(0, "rgba(255,196,120,0.05)");
  glow.addColorStop(1, "rgba(255,196,120,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, cssW, cssH);

  const vignette = ctx.createRadialGradient(cssW / 2, cssH / 2, MH_TILE_PX * 2, cssW / 2, cssH / 2, cssW * 0.65);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, cssW, cssH);
}
