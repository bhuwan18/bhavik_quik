// Plain TypeScript, no React — the world is a mutable object owned by a ref in
// MonsterHunterGame.tsx. React never re-renders per-frame; it only reads throttled HUD
// snapshots pushed out via the `onHud` callback threading through the caller.

import {
  MH_TILE_PX,
  MH_MAZE_COLS,
  MH_MAZE_ROWS,
  MH_PLAYER_IFRAME_MS,
  MH_LASER_SPEED,
  MH_LASER_RANGE_TILES,
  MH_TRISHOT_SPREAD_RAD,
  MH_MONSTER_HP,
  MH_MONSTER_DAMAGE,
  MH_MONSTER_HIT_COOLDOWN_MS,
  MH_MONSTER_SPEED,
  MH_SPAWN_INTERVAL_MS,
  MH_SPAWN_INTERVAL_MIN_MS,
  MH_SPAWN_RAMP_PER_LEVEL,
  MH_MAX_MONSTERS,
  MH_MONSTER_REPATH_MS,
  MH_GEM_XP,
  MH_XP_BASE,
  MH_XP_GROWTH,
} from "@/lib/game-config";
import { generateMaze, computeVisible, isWall, type MazeGrid } from "@/lib/maze";
import type { RunStats } from "@/lib/perk-roll";

type Vec2 = { x: number; y: number };

type Player = { pos: Vec2; hp: number; angle: number; fireCooldownMs: number; iframeMs: number };
type Monster = { id: number; pos: Vec2; hp: number; hitCooldownMs: number; path: Vec2[]; repathMs: number };
type Laser = { id: number; pos: Vec2; vel: Vec2; traveledPx: number; pierceLeft: number; hitIds: Set<number> };
type Gem = { id: number; pos: Vec2 };

export type InputState = { moveX: number; moveY: number; aimAngle: number | null };

export type World = {
  grid: MazeGrid;
  cols: number;
  rows: number;
  player: Player;
  monsters: Monster[];
  lasers: Laser[];
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
};

export type StepEvents = { leveledUp: boolean; died: boolean; killed: number };

function tileCenter(cx: number, cy: number): Vec2 {
  return { x: cx * MH_TILE_PX + MH_TILE_PX / 2, y: cy * MH_TILE_PX + MH_TILE_PX / 2 };
}

function worldToTile(pos: Vec2): { x: number; y: number } {
  return { x: Math.floor(pos.x / MH_TILE_PX), y: Math.floor(pos.y / MH_TILE_PX) };
}

function randomFloorTile(grid: MazeGrid, minDistFromTile: { x: number; y: number }, minDist: number): { x: number; y: number } {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  for (let attempt = 0; attempt < 200; attempt++) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    if (isWall(grid, x, y)) continue;
    const dist = Math.hypot(x - minDistFromTile.x, y - minDistFromTile.y);
    if (dist >= minDist) return { x, y };
  }
  return { x: minDistFromTile.x, y: minDistFromTile.y };
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

export function createWorld(stats: RunStats): World {
  const grid = generateMaze(MH_MAZE_COLS, MH_MAZE_ROWS);
  const startTile = { x: 1, y: 1 };
  const player: Player = {
    pos: tileCenter(startTile.x, startTile.y),
    hp: stats.maxHp,
    angle: 0,
    fireCooldownMs: 0,
    iframeMs: 0,
  };

  const world: World = {
    grid,
    cols: grid[0]?.length ?? 0,
    rows: grid.length,
    player,
    monsters: [],
    lasers: [],
    gems: [],
    visible: computeVisible(grid, startTile.x, startTile.y, stats.visionTiles),
    spawnTimerMs: MH_SPAWN_INTERVAL_MS,
    level: 1,
    xp: 0,
    xpToNext: MH_XP_BASE,
    kills: 0,
    gemsCollected: 0,
    nextId: 1,
    timeMs: 0,
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

const PLAYER_RADIUS = MH_TILE_PX * 0.28;
const MONSTER_RADIUS = MH_TILE_PX * 0.3;
const LASER_RADIUS = 4;
const GEM_RADIUS = MH_TILE_PX * 0.18;
const GEM_PICKUP_RADIUS = MH_TILE_PX * 0.4;

export function stepWorld(world: World, dtSeconds: number, input: InputState, stats: RunStats): StepEvents {
  const events: StepEvents = { leveledUp: false, died: false, killed: 0 };
  const dtMs = dtSeconds * 1000;
  world.timeMs += dtMs;

  if (world.player.iframeMs > 0) world.player.iframeMs -= dtMs;
  if (world.player.hp <= 0) {
    events.died = true;
    return events;
  }

  // ── Player movement ──────────────────────────────────────────────────────
  const moveLen = Math.hypot(input.moveX, input.moveY);
  if (moveLen > 0.01) {
    const nx = input.moveX / moveLen;
    const ny = input.moveY / moveLen;
    const dx = nx * stats.speed * dtSeconds;
    const dy = ny * stats.speed * dtSeconds;
    world.player.pos = moveWithCollision(world.grid, world.player.pos, dx, dy, PLAYER_RADIUS);
  }
  if (input.aimAngle !== null) {
    world.player.angle = input.aimAngle;
  } else if (moveLen > 0.01) {
    world.player.angle = Math.atan2(input.moveY, input.moveX);
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

  // ── Monster AI: BFS repath periodically, follow waypoints, contact damage ──
  for (const monster of world.monsters) {
    monster.repathMs -= dtMs;
    if (monster.repathMs <= 0) {
      const mTile = worldToTile(monster.pos);
      monster.path = bfsPath(world.grid, mTile, playerTile);
      monster.repathMs = MH_MONSTER_REPATH_MS;
    }

    if (monster.path.length > 0) {
      const target = monster.path[0];
      const dx = target.x - monster.pos.x;
      const dy = target.y - monster.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        monster.path.shift();
      } else {
        monster.pos = {
          x: monster.pos.x + (dx / dist) * MH_MONSTER_SPEED * dtSeconds,
          y: monster.pos.y + (dy / dist) * MH_MONSTER_SPEED * dtSeconds,
        };
      }
    }

    monster.hitCooldownMs -= dtMs;
    if (monster.hitCooldownMs <= 0) {
      const dist = Math.hypot(monster.pos.x - world.player.pos.x, monster.pos.y - world.player.pos.y);
      if (dist < MONSTER_RADIUS + PLAYER_RADIUS) {
        monster.hitCooldownMs = MH_MONSTER_HIT_COOLDOWN_MS;
        if (world.player.iframeMs <= 0) {
          world.player.hp -= MH_MONSTER_DAMAGE;
          world.player.iframeMs = MH_PLAYER_IFRAME_MS;
          if (world.player.hp <= 0) events.died = true;
        }
      }
    }
  }

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
    events.leveledUp = true;
  }

  // ── Spawning ──────────────────────────────────────────────────────────────
  world.spawnTimerMs -= dtMs;
  if (world.spawnTimerMs <= 0 && world.monsters.length < MH_MAX_MONSTERS) {
    const spot = randomFloorTile(world.grid, playerTile, 6);
    world.monsters.push({
      id: world.nextId++,
      pos: tileCenter(spot.x, spot.y),
      hp: MH_MONSTER_HP,
      hitCooldownMs: 0,
      path: [],
      repathMs: 0,
    });
    const interval = MH_SPAWN_INTERVAL_MS * Math.pow(MH_SPAWN_RAMP_PER_LEVEL, world.level - 1);
    world.spawnTimerMs = Math.max(MH_SPAWN_INTERVAL_MIN_MS, interval);
  }

  return events;
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: World, cssW: number, cssH: number): void {
  ctx.fillStyle = "#020208";
  ctx.fillRect(0, 0, cssW, cssH);

  const camX = world.player.pos.x - cssW / 2;
  const camY = world.player.pos.y - cssH / 2;

  const minTx = Math.floor(camX / MH_TILE_PX) - 1;
  const maxTx = Math.floor((camX + cssW) / MH_TILE_PX) + 1;
  const minTy = Math.floor(camY / MH_TILE_PX) - 1;
  const maxTy = Math.floor((camY + cssH) / MH_TILE_PX) + 1;

  // ── Tiles: gradient-shaded blocks with a top highlight edge for a beveled, 3D feel ──
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const key = ty * world.cols + tx;
      if (!world.visible.has(key)) continue;
      const sx = tx * MH_TILE_PX - camX;
      const sy = ty * MH_TILE_PX - camY;
      const wall = isWall(world.grid, tx, ty);

      const grad = ctx.createLinearGradient(sx, sy, sx, sy + MH_TILE_PX);
      if (wall) {
        grad.addColorStop(0, "#3f3378");
        grad.addColorStop(1, "#1a1440");
      } else {
        grad.addColorStop(0, "#161b3f");
        grad.addColorStop(1, "#0a0e26");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, MH_TILE_PX, MH_TILE_PX);

      if (wall) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(sx, sy, MH_TILE_PX, 3);
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.strokeRect(sx + 0.5, sy + 0.5, MH_TILE_PX - 1, MH_TILE_PX - 1);
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.025)";
        ctx.strokeRect(sx, sy, MH_TILE_PX, MH_TILE_PX);
      }
    }
  }

  const toScreen = (p: Vec2) => ({ x: p.x - camX, y: p.y - camY });
  const tileKeyOf = (p: Vec2) => {
    const t = worldToTile(p);
    return t.y * world.cols + t.x;
  };

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

  // ── Monsters: gradient body + eyes + a damage ring once hurt ────────────────
  ctx.shadowColor = "rgba(248,113,113,0.65)";
  ctx.shadowBlur = 9;
  for (const monster of world.monsters) {
    if (!world.visible.has(tileKeyOf(monster.pos))) continue;
    const s = toScreen(monster.pos);
    const grad = ctx.createRadialGradient(s.x - 5, s.y - 5, 2, s.x, s.y, MONSTER_RADIUS);
    grad.addColorStop(0, "#fecaca");
    grad.addColorStop(0.45, "#f87171");
    grad.addColorStop(1, "#7f1d1d");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, MONSTER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1a0505";
  for (const monster of world.monsters) {
    if (!world.visible.has(tileKeyOf(monster.pos))) continue;
    const s = toScreen(monster.pos);
    ctx.beginPath();
    ctx.arc(s.x - 4, s.y - 2, 1.6, 0, Math.PI * 2);
    ctx.arc(s.x + 4, s.y - 2, 1.6, 0, Math.PI * 2);
    ctx.fill();
    if (monster.hp < MH_MONSTER_HP) {
      const pct = Math.max(0, monster.hp / MH_MONSTER_HP);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, MONSTER_RADIUS + 4, -Math.PI / 2, Math.PI * 2 * pct - Math.PI / 2);
      ctx.stroke();
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, MONSTER_RADIUS + 4, -Math.PI / 2, Math.PI * 2 * pct - Math.PI / 2);
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

  // ── Player: gradient hull, iframe flicker, aim-facing hull ─────────────────
  const pScreen = toScreen(world.player.pos);
  const flashing = world.player.iframeMs > 0 && Math.floor(world.timeMs / 80) % 2 === 0;
  if (!flashing) {
    ctx.save();
    ctx.translate(pScreen.x, pScreen.y);
    ctx.rotate(world.player.angle);
    ctx.shadowColor = "#60a5fa";
    ctx.shadowBlur = 16;
    const grad = ctx.createLinearGradient(-PLAYER_RADIUS, 0, PLAYER_RADIUS + 6, 0);
    grad.addColorStop(0, "#1d4ed8");
    grad.addColorStop(1, "#bfdbfe");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(PLAYER_RADIUS + 6, 0);
    ctx.lineTo(-PLAYER_RADIUS, PLAYER_RADIUS);
    ctx.lineTo(-PLAYER_RADIUS * 0.4, 0);
    ctx.lineTo(-PLAYER_RADIUS, -PLAYER_RADIUS);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
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
