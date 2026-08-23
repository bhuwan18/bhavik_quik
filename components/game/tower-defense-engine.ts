// Plain TypeScript, no React — mirrors monster-hunter-engine.ts's split. The world is a
// mutable object owned by a ref in TowerDefenseGame.tsx; React only reads throttled HUD
// snapshots. Unlike Monster Hunter, everything here runs in TILE-space (not px): creep
// position, tower range, projectile speed. tilePx is derived per-device from the viewport
// (TD_MIN/MAX_TILE_PX), so baking pixels into the simulation would make physics
// resolution-dependent — only drawWorld converts tiles → screen pixels, at draw time.

import {
  TD_GRID_COLS,
  TD_GRID_ROWS,
  TD_MAX_CREEPS,
  TD_STAGE_COUNT,
  TD_WAVES_PER_STAGE,
  TD_BUILD_TIME_MS,
  TD_FIRST_BUILD_TIME_MS,
  TD_EARLY_SEND_GOLD_PER_S,
  TD_TOWER_MAX_LEVEL,
  TD_CREEP_REGEN_PCT_PER_S,
  TD_SPAWN_ANIM_MS,
  TD_HIT_FLASH_MS,
  TD_DEATH_ANIM_MS,
  TD_FLOATER_MS,
  TD_TRACER_MS,
  TD_CHAIN_ARC_MS,
  TD_SHAKE_MS,
  TD_MAX_PARTICLES,
  TD_BOSS_LEAK_LIVES,
  TD_ARROW_SPEED_TILES,
  TD_CANNON_SPEED_TILES,
  TD_FROST_SPEED_TILES,
  TD_FROST_SLOW_MS,
  TD_CANNON_SPLASH_FALLOFF,
  TD_TESLA_CHAIN_FALLOFF,
  TD_TESLA_CHAIN_RANGE_TILES,
} from "@/lib/game-config";
import {
  getStageDef,
  getCreepType,
  getTowerType,
  type CreepBehavior,
  type TdPalette,
  type BossOverlay,
} from "@/lib/td-data";
import {
  buildPathGeometry,
  blockedTiles,
  positionAt,
  headingAt,
  waveComposition,
  isBossWave,
  creepHp,
  creepBounty,
  creepSpeedTilesPerS,
  damageAfterArmor,
  towerDamage,
  towerCooldownMs,
  towerRangeTiles,
  towerUpgradeCost,
  towerSellValue,
  frostSlowPct,
  cannonSplashRadiusTiles,
  teslaChainCount,
  beaconDamageBuff,
  beaconRateBuff,
  type PathGeometry,
} from "@/lib/tower-defense";
import { CREEP_SPRITES, BOSS_OVERLAYS, TOWER_SPRITES, getTerrainTile, getPathTile } from "./td-sprites";

type Vec2 = { x: number; y: number };

type Creep = {
  id: number;
  typeId: string;
  behavior: CreepBehavior;
  palette: TdPalette;
  spriteId: string;
  bossOverlay?: BossOverlay;
  regenBoss: boolean;
  t: number;
  pos: Vec2;
  hp: number;
  maxHp: number;
  armor: number;
  speedTilesPerS: number;
  radiusTiles: number;
  slowMs: number;
  slowPct: number;
  hurtMs: number;
  spawnMs: number;
  dying: boolean;
  deathMs: number;
  animPhase: number;
  weaveSeed: number;
};

type Tower = {
  id: number;
  typeId: string;
  gx: number;
  gy: number;
  level: number;
  cooldownMs: number;
  aimAngle: number;
  hasTarget: boolean;
  recoil: number;
};

type Projectile = {
  id: number;
  kind: "arrow" | "frost" | "cannon";
  pos: Vec2;
  targetId: number | null; // null for cannon (fire-and-forget to a fixed point)
  impactPoint: Vec2;
  speedTiles: number;
  damage: number;
  splashRadiusTiles?: number;
  slowPct?: number;
};

type Tracer = { id: number; from: Vec2; to: Vec2; ageMs: number };
type ChainArc = { id: number; points: Vec2[]; ageMs: number };
type Particle = { id: number; pos: Vec2; vel: Vec2; color: string; size: number; ageMs: number; lifeMs: number };
type Floater = { id: number; pos: Vec2; text: string; color: string; ageMs: number };

type PendingSpawn = { creepId: string; atMs: number };

export type WorldPhase = "build" | "wave";

export type World = {
  stage: number;
  waveInStage: number;
  phase: WorldPhase;
  geo: PathGeometry;
  blocked: Set<number>;
  creeps: Creep[];
  towers: Tower[];
  projectiles: Projectile[];
  tracers: Tracer[];
  chainArcs: ChainArc[];
  particles: Particle[];
  floaters: Floater[];
  gold: number;
  lives: number;
  buildTimerMs: number;
  buildTimerTotalMs: number;
  pendingSpawns: PendingSpawn[];
  spawnElapsedMs: number;
  nextId: number;
  timeMs: number;
  shakeMs: number;
};

export type TdStepEvents = {
  waveCleared: boolean;
  stageCleared: boolean; // final wave of a non-final stage cleared — component opens the stage-clear modal
  victory: boolean; // final wave of the final stage cleared
  defeat: boolean;
  creepsKilled: number;
};

function buildSpawnQueue(stage: number, waveInStage: number): PendingSpawn[] {
  const groups = waveComposition(stage, waveInStage);
  const events: PendingSpawn[] = [];
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) {
      events.push({ creepId: g.creepId, atMs: g.delayMs + i * g.spacingMs });
    }
  }
  events.sort((a, b) => a.atMs - b.atMs);
  return events;
}

export function createStageWorld(stage: number, gold: number, lives: number): World {
  const stageDef = getStageDef(stage);
  const geo = buildPathGeometry(stageDef.path);
  const buildTime = stage === 1 ? TD_FIRST_BUILD_TIME_MS : TD_BUILD_TIME_MS;
  return {
    stage,
    waveInStage: 1,
    phase: "build",
    geo,
    blocked: blockedTiles(geo),
    creeps: [],
    towers: [],
    projectiles: [],
    tracers: [],
    chainArcs: [],
    particles: [],
    floaters: [],
    gold,
    lives,
    buildTimerMs: buildTime,
    buildTimerTotalMs: buildTime,
    pendingSpawns: buildSpawnQueue(stage, 1),
    spawnElapsedMs: 0,
    nextId: 1,
    timeMs: 0,
    shakeMs: 0,
  };
}

// ─── Placement / upgrades ─────────────────────────────────────────────────────

export function canPlaceTower(world: World, gx: number, gy: number): boolean {
  if (gx < 0 || gy < 0 || gx >= TD_GRID_COLS) return false;
  if (world.blocked.has(gy * TD_GRID_COLS + gx)) return false;
  return !world.towers.some((t) => t.gx === gx && t.gy === gy);
}

export function tryPlaceTower(world: World, typeId: string, gx: number, gy: number): boolean {
  if (!canPlaceTower(world, gx, gy)) return false;
  const def = getTowerType(typeId);
  if (world.gold < def.cost) return false;
  world.gold -= def.cost;
  world.towers.push({ id: world.nextId++, typeId, gx, gy, level: 1, cooldownMs: 0, aimAngle: 0, hasTarget: false, recoil: 0 });
  return true;
}

export function tryUpgradeTower(world: World, towerId: number): boolean {
  const tower = world.towers.find((t) => t.id === towerId);
  if (!tower || tower.level >= TD_TOWER_MAX_LEVEL) return false;
  const def = getTowerType(tower.typeId);
  const cost = towerUpgradeCost(def, tower.level);
  if (world.gold < cost) return false;
  world.gold -= cost;
  tower.level += 1;
  return true;
}

export function sellTower(world: World, towerId: number): void {
  const idx = world.towers.findIndex((t) => t.id === towerId);
  if (idx === -1) return;
  const tower = world.towers[idx];
  world.gold += towerSellValue(getTowerType(tower.typeId), tower.level);
  world.towers.splice(idx, 1);
}

/** Grants bonus gold proportional to build time skipped and starts the wave immediately. */
export function sendWaveEarly(world: World): number {
  if (world.phase !== "build") return 0;
  const bonus = Math.round((world.buildTimerMs / 1000) * TD_EARLY_SEND_GOLD_PER_S);
  world.gold += bonus;
  world.phase = "wave";
  world.buildTimerMs = 0;
  world.spawnElapsedMs = 0;
  return bonus;
}

// ─── VFX helpers ────────────────────────────────────────────────────────────────

function pushFloater(world: World, pos: Vec2, text: string, color: string): void {
  world.floaters.push({ id: world.nextId++, pos: { ...pos }, text, color, ageMs: 0 });
}

function pushParticles(world: World, pos: Vec2, color: string, count: number): void {
  for (let i = 0; i < count; i++) {
    if (world.particles.length >= TD_MAX_PARTICLES) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    world.particles.push({
      id: world.nextId++,
      pos: { ...pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      color,
      size: 0.05 + Math.random() * 0.05,
      ageMs: 0,
      lifeMs: 380 + Math.random() * 260,
    });
  }
}

// ─── Combat ─────────────────────────────────────────────────────────────────────

function damageCreep(world: World, creep: Creep, rawDamage: number, ignoreArmor: boolean, events: TdStepEvents): void {
  if (creep.dying) return;
  const dmg = damageAfterArmor(rawDamage, creep.armor, ignoreArmor);
  creep.hp -= dmg;
  creep.hurtMs = TD_HIT_FLASH_MS;
  if (creep.hp <= 0) {
    creep.dying = true;
    creep.deathMs = 0;
    const bounty = creepBounty(getCreepType(creep.typeId), world.stage);
    world.gold += bounty;
    pushFloater(world, creep.pos, `+${bounty}`, "#facc15");
    pushParticles(world, creep.pos, creep.palette.mid, 6);
    events.creepsKilled += 1;
  }
}

function applySlow(creep: Creep, slowPct: number): void {
  creep.slowMs = TD_FROST_SLOW_MS;
  creep.slowPct = Math.max(creep.slowPct, slowPct);
}

function computeBeaconBuffs(world: World): Map<number, { dmgMult: number; rateMult: number }> {
  const buffs = new Map<number, { dmgMult: number; rateMult: number }>();
  const beacons = world.towers.filter((t) => getTowerType(t.typeId).special === "aura");
  if (beacons.length === 0) return buffs;
  for (const tower of world.towers) {
    if (getTowerType(tower.typeId).special === "aura") continue;
    const center = { x: tower.gx + 0.5, y: tower.gy + 0.5 };
    let best: { dmgMult: number; rateMult: number } | null = null;
    for (const beacon of beacons) {
      const bCenter = { x: beacon.gx + 0.5, y: beacon.gy + 0.5 };
      const range = towerRangeTiles(getTowerType(beacon.typeId), beacon.level);
      if (Math.hypot(center.x - bCenter.x, center.y - bCenter.y) > range) continue;
      const dmgMult = 1 + beaconDamageBuff(beacon.level);
      const rateMult = 1 - beaconRateBuff(beacon.level);
      if (!best || dmgMult > best.dmgMult) best = { dmgMult, rateMult };
    }
    if (best) buffs.set(tower.id, best);
  }
  return buffs;
}

function pickTarget(world: World, tower: Tower, def: ReturnType<typeof getTowerType>): Creep | null {
  const range = towerRangeTiles(def, tower.level);
  const center = { x: tower.gx + 0.5, y: tower.gy + 0.5 };
  let best: Creep | null = null;
  let bestScore = -Infinity;
  for (const c of world.creeps) {
    if (c.dying) continue;
    if (!def.canHitAir && c.behavior === "flying") continue;
    const d = Math.hypot(c.pos.x - center.x, c.pos.y - center.y);
    if (d > range) continue;
    const score = def.targeting === "first" ? c.t : def.targeting === "strongest" ? c.hp : -d;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function fireTower(world: World, tower: Tower, def: ReturnType<typeof getTowerType>, target: Creep, dmg: number, events: TdStepEvents): void {
  const center = { x: tower.gx + 0.5, y: tower.gy + 0.5 };

  if (def.id === "sniper") {
    damageCreep(world, target, dmg, true, events);
    world.tracers.push({ id: world.nextId++, from: center, to: { ...target.pos }, ageMs: 0 });
    return;
  }

  if (def.id === "tesla") {
    const points: Vec2[] = [center];
    const hit = new Set<number>();
    let current = target;
    let jumpDamage = dmg;
    const maxTargets = teslaChainCount(tower.level);
    for (let i = 0; i < maxTargets; i++) {
      damageCreep(world, current, jumpDamage, false, events);
      points.push({ ...current.pos });
      hit.add(current.id);
      let next: Creep | null = null;
      let nextDist = Infinity;
      for (const c of world.creeps) {
        if (c.dying || hit.has(c.id)) continue;
        const d = Math.hypot(c.pos.x - current.pos.x, c.pos.y - current.pos.y);
        if (d <= TD_TESLA_CHAIN_RANGE_TILES && d < nextDist) {
          nextDist = d;
          next = c;
        }
      }
      if (!next) break;
      current = next;
      jumpDamage *= TD_TESLA_CHAIN_FALLOFF;
    }
    world.chainArcs.push({ id: world.nextId++, points, ageMs: 0 });
    return;
  }

  if (def.id === "cannon") {
    world.projectiles.push({
      id: world.nextId++,
      kind: "cannon",
      pos: { ...center },
      targetId: null,
      impactPoint: { ...target.pos },
      speedTiles: TD_CANNON_SPEED_TILES,
      damage: dmg,
      splashRadiusTiles: cannonSplashRadiusTiles(tower.level),
    });
    return;
  }

  // arrow / frost — homing projectile
  world.projectiles.push({
    id: world.nextId++,
    kind: def.id === "frost" ? "frost" : "arrow",
    pos: { ...center },
    targetId: target.id,
    impactPoint: { ...target.pos },
    speedTiles: def.id === "frost" ? TD_FROST_SPEED_TILES : TD_ARROW_SPEED_TILES,
    damage: dmg,
    slowPct: def.special === "slow" ? frostSlowPct(tower.level) : undefined,
  });
}

// ─── Step ───────────────────────────────────────────────────────────────────────

export function stepWorld(world: World, dtSeconds: number): TdStepEvents {
  const events: TdStepEvents = { waveCleared: false, stageCleared: false, victory: false, defeat: false, creepsKilled: 0 };
  const dtMs = dtSeconds * 1000;
  world.timeMs += dtMs;
  if (world.shakeMs > 0) world.shakeMs -= dtMs;

  if (world.lives <= 0) {
    events.defeat = true;
    return events;
  }

  // ── Build breather ──────────────────────────────────────────────────────────
  if (world.phase === "build") {
    world.buildTimerMs -= dtMs;
    if (world.buildTimerMs <= 0) {
      world.phase = "wave";
      world.spawnElapsedMs = 0;
    }
  }

  // ── Spawning ─────────────────────────────────────────────────────────────────
  if (world.phase === "wave") {
    world.spawnElapsedMs += dtMs;
    while (world.pendingSpawns.length > 0 && world.pendingSpawns[0].atMs <= world.spawnElapsedMs && world.creeps.length < TD_MAX_CREEPS) {
      const ev = world.pendingSpawns.shift()!;
      spawnCreep(world, ev.creepId);
    }
  }

  // ── Creeps: lifecycle, movement, regen, leaks ───────────────────────────────
  const survivors: Creep[] = [];
  for (const c of world.creeps) {
    if (c.spawnMs > 0) c.spawnMs -= dtMs;
    if (c.hurtMs > 0) c.hurtMs -= dtMs;
    if (c.slowMs > 0) {
      c.slowMs -= dtMs;
      if (c.slowMs <= 0) c.slowPct = 0;
    }

    if (c.dying) {
      c.deathMs += dtMs;
      if (c.deathMs < TD_DEATH_ANIM_MS) survivors.push(c);
      continue;
    }

    if (c.behavior === "regen" || c.regenBoss) {
      c.hp = Math.min(c.maxHp, c.hp + c.maxHp * TD_CREEP_REGEN_PCT_PER_S * dtSeconds);
    }

    const speedMult = c.slowMs > 0 ? 1 - c.slowPct : 1;
    c.t += (c.speedTilesPerS * speedMult * dtSeconds) / world.geo.totalTiles;
    const p = positionAt(world.geo, c.t);
    if (!p) {
      world.lives -= c.behavior === "boss" ? TD_BOSS_LEAK_LIVES : 1;
      continue;
    }
    c.pos = p;
    c.animPhase += dtSeconds * c.speedTilesPerS * 2;
    survivors.push(c);
  }
  world.creeps = survivors;

  if (world.lives <= 0) {
    events.defeat = true;
    return events;
  }

  // ── Towers: target, fire ────────────────────────────────────────────────────
  const beaconBuffs = computeBeaconBuffs(world);
  for (const tower of world.towers) {
    const def = getTowerType(tower.typeId);
    tower.recoil = Math.max(0, tower.recoil - dtSeconds * 4);
    if (def.special === "aura") continue;

    tower.cooldownMs -= dtMs;
    const target = pickTarget(world, tower, def);
    tower.hasTarget = target !== null;
    if (target) tower.aimAngle = Math.atan2(target.pos.y - (tower.gy + 0.5), target.pos.x - (tower.gx + 0.5));

    if (target && tower.cooldownMs <= 0) {
      const buff = beaconBuffs.get(tower.id) ?? { dmgMult: 1, rateMult: 1 };
      const dmg = towerDamage(def, tower.level) * buff.dmgMult;
      tower.cooldownMs = towerCooldownMs(def, tower.level) * buff.rateMult;
      tower.recoil = 1;
      fireTower(world, tower, def, target, dmg, events);
    }
  }

  // ── Projectiles ──────────────────────────────────────────────────────────────
  const survivorsProj: Projectile[] = [];
  for (const proj of world.projectiles) {
    let target: Creep | undefined;
    if (proj.targetId !== null) {
      target = world.creeps.find((c) => c.id === proj.targetId && !c.dying);
      if (target) proj.impactPoint = target.pos;
    }

    const dx = proj.impactPoint.x - proj.pos.x;
    const dy = proj.impactPoint.y - proj.pos.y;
    const dist = Math.hypot(dx, dy);
    const step = proj.speedTiles * dtSeconds;

    if (dist <= step + 0.05) {
      if (proj.kind === "cannon") {
        world.shakeMs = TD_SHAKE_MS;
        pushParticles(world, proj.impactPoint, "#fb923c", 8);
        const splashR = proj.splashRadiusTiles ?? 1;
        for (const c of world.creeps) {
          if (c.dying) continue;
          const d = Math.hypot(c.pos.x - proj.impactPoint.x, c.pos.y - proj.impactPoint.y);
          if (d > splashR) continue;
          const falloff = d <= 0.01 ? 1 : Math.max(TD_CANNON_SPLASH_FALLOFF, 1 - (d / splashR) * (1 - TD_CANNON_SPLASH_FALLOFF));
          damageCreep(world, c, proj.damage * falloff, false, events);
        }
      } else if (target) {
        damageCreep(world, target, proj.damage, false, events);
        if (proj.kind === "frost" && proj.slowPct) applySlow(target, proj.slowPct);
        pushParticles(world, target.pos, proj.kind === "frost" ? "#7dd3fc" : "#fbbf24", 3);
      }
      continue; // consumed
    }

    if (proj.targetId !== null && !target) continue; // homing target died mid-flight — despawn
    proj.pos = { x: proj.pos.x + (dx / dist) * step, y: proj.pos.y + (dy / dist) * step };
    survivorsProj.push(proj);
  }
  world.projectiles = survivorsProj;

  // ── Transient VFX decay ─────────────────────────────────────────────────────
  world.tracers = world.tracers.filter((t) => (t.ageMs += dtMs) < TD_TRACER_MS);
  world.chainArcs = world.chainArcs.filter((a) => (a.ageMs += dtMs) < TD_CHAIN_ARC_MS);
  world.floaters = world.floaters.filter((f) => (f.ageMs += dtMs) < TD_FLOATER_MS);
  world.particles = world.particles.filter((p) => {
    p.ageMs += dtMs;
    p.pos.x += p.vel.x * dtSeconds;
    p.pos.y += p.vel.y * dtSeconds;
    return p.ageMs < p.lifeMs;
  });

  // ── Wave / stage completion ─────────────────────────────────────────────────
  if (world.phase === "wave" && world.pendingSpawns.length === 0 && world.creeps.filter((c) => !c.dying).length === 0) {
    if (isBossWave(world.waveInStage)) {
      if (world.stage >= TD_STAGE_COUNT) {
        events.victory = true;
      } else {
        events.stageCleared = true;
      }
    } else {
      world.waveInStage += 1;
      world.phase = "build";
      world.buildTimerMs = TD_BUILD_TIME_MS;
      world.buildTimerTotalMs = TD_BUILD_TIME_MS;
      world.pendingSpawns = buildSpawnQueue(world.stage, world.waveInStage);
      world.spawnElapsedMs = 0;
      events.waveCleared = true;
    }
  }

  return events;
}

function spawnCreep(world: World, creepId: string): void {
  const def = getCreepType(creepId);
  const hp = creepHp(def, world.stage, world.waveInStage);
  const startPos = positionAt(world.geo, 0) ?? world.geo.path[0];
  world.creeps.push({
    id: world.nextId++,
    typeId: def.id,
    behavior: def.behavior,
    palette: def.palette,
    spriteId: def.spriteId,
    bossOverlay: def.bossOverlay,
    regenBoss: !!def.regenBoss,
    t: 0,
    pos: startPos,
    hp,
    maxHp: hp,
    armor: def.armor,
    speedTilesPerS: creepSpeedTilesPerS(def),
    radiusTiles: 0.34 * def.radiusMult,
    slowMs: 0,
    slowPct: 0,
    hurtMs: 0,
    spawnMs: TD_SPAWN_ANIM_MS,
    dying: false,
    deathMs: 0,
    animPhase: Math.random() * 10,
    weaveSeed: Math.random() * Math.PI * 2,
  });
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

export type DrawOverlay = {
  selectedTowerId: number | null;
  placingTypeId: string | null;
  ghostTile: { gx: number; gy: number } | null;
};

export function drawWorld(ctx: CanvasRenderingContext2D, world: World, tilePx: number, cssW: number, cssH: number, reducedMotion: boolean, overlay: DrawOverlay): void {
  const stageDef = getStageDef(world.stage);
  const theme = stageDef.theme;

  const shakeX = world.shakeMs > 0 && !reducedMotion ? (Math.random() - 0.5) * 6 : 0;
  const shakeY = world.shakeMs > 0 && !reducedMotion ? (Math.random() - 0.5) * 6 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  const bg = ctx.createLinearGradient(0, 0, 0, cssH);
  bg.addColorStop(0, theme.bgTop);
  bg.addColorStop(1, theme.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(-10, -10, cssW + 20, cssH + 20);

  const terrainPattern = ctx.createPattern(getTerrainTile(theme.terrainId, tilePx), "repeat") ?? theme.bgBottom;
  ctx.fillStyle = terrainPattern;
  ctx.fillRect(0, 0, TD_GRID_COLS * tilePx, TD_GRID_ROWS * tilePx);

  // ── Lane ──────────────────────────────────────────────────────────────────
  const pathPattern = ctx.createPattern(getPathTile(theme.pathTop, theme.pathBottom, tilePx), "repeat") ?? theme.pathBottom;
  ctx.fillStyle = pathPattern;
  for (const key of world.blocked) {
    const gx = key % TD_GRID_COLS;
    const gy = Math.floor(key / TD_GRID_COLS);
    ctx.fillRect(gx * tilePx, gy * tilePx, tilePx, tilePx);
  }
  // Smoothing pass so corners read as a road, not a staircase of squares.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(world.geo.path[0].x * tilePx, world.geo.path[0].y * tilePx);
  for (const p of world.geo.path) ctx.lineTo(p.x * tilePx, p.y * tilePx);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = theme.pathEdge;
  ctx.lineWidth = tilePx + 3;
  ctx.globalCompositeOperation = "destination-over";
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = theme.pathTop;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = tilePx;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  const toPx = (p: Vec2) => ({ x: p.x * tilePx, y: p.y * tilePx });

  // Portal + base crystal
  const startS = toPx(world.geo.path[0]);
  const endS = toPx(world.geo.path[world.geo.path.length - 1]);
  const portalPulse = reducedMotion ? 1 : 1 + Math.sin(world.timeMs / 300) * 0.15;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(startS.x, startS.y, tilePx * 0.5 * portalPulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const lifePct = Math.max(0, Math.min(1, world.lives / 15));
  ctx.save();
  ctx.translate(endS.x, endS.y);
  ctx.rotate((1 - lifePct) * 0.25);
  const crystalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, tilePx * 0.5);
  crystalGrad.addColorStop(0, "#f0fdfa");
  crystalGrad.addColorStop(0.6, theme.accent);
  crystalGrad.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = crystalGrad;
  ctx.globalAlpha = 0.4 + lifePct * 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -tilePx * 0.45);
  ctx.lineTo(tilePx * 0.28, 0);
  ctx.lineTo(0, tilePx * 0.45);
  ctx.lineTo(-tilePx * 0.28, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;

  // ── Range rings (only for towers currently marked engaged/selected happens in React overlay
  // via CSS; the always-on subtle range indicator here is intentionally omitted for clarity) ──

  // ── Towers ────────────────────────────────────────────────────────────────
  for (const tower of world.towers) {
    const def = getTowerType(tower.typeId);
    const drawFn = TOWER_SPRITES[def.spriteId];
    if (!drawFn) continue;
    const cx = tower.gx * tilePx + tilePx / 2;
    const cy = tower.gy * tilePx + tilePx / 2;
    ctx.save();
    ctx.translate(cx, cy);
    drawFn({ ctx, r: tilePx * 0.4, level: tower.level, aimAngle: tower.aimAngle, recoil: tower.recoil, engaged: tower.hasTarget, palette: def.palette, timeMs: world.timeMs });
    ctx.restore();
  }

  // ── Chain arcs (Tesla) ───────────────────────────────────────────────────────
  for (const arc of world.chainArcs) {
    const alpha = 1 - arc.ageMs / TD_CHAIN_ARC_MS;
    ctx.strokeStyle = `rgba(196,181,253,${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < arc.points.length - 1; i++) {
      const a = toPx(arc.points[i]);
      const b = toPx(arc.points[i + 1]);
      const midX = (a.x + b.x) / 2 + (Math.random() - 0.5) * tilePx * 0.3;
      const midY = (a.y + b.y) / 2 + (Math.random() - 0.5) * tilePx * 0.3;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(midX, midY);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Tracers (Sniper) ─────────────────────────────────────────────────────────
  for (const tr of world.tracers) {
    const alpha = 1 - tr.ageMs / TD_TRACER_MS;
    const a = toPx(tr.from);
    const b = toPx(tr.to);
    ctx.strokeStyle = `rgba(240,253,244,${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = "#4ade80";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Creeps ───────────────────────────────────────────────────────────────────
  for (const c of world.creeps) {
    const drawFn = CREEP_SPRITES[c.spriteId];
    if (!drawFn) continue;
    const isFlying = c.behavior === "flying";
    const weave = isFlying && !reducedMotion ? Math.sin(world.timeMs / 260 + c.weaveSeed) * 0.6 : 0;
    const lift = isFlying ? tilePx * 0.5 : 0;
    const heading = headingAt(world.geo, c.t);
    const perpX = -heading.y;
    const perpY = heading.x;

    const groundX = c.pos.x + perpX * weave;
    const groundY = c.pos.y + perpY * weave;
    const sx = groundX * tilePx;
    const sy = groundY * tilePx - lift;

    if (isFlying) {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(groundX * tilePx, groundY * tilePx, tilePx * 0.22, tilePx * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const spawnT = c.spawnMs > 0 ? 1 - c.spawnMs / TD_SPAWN_ANIM_MS : 1;
    const scale = c.dying ? 1 : 0.4 + 0.6 * Math.min(1, spawnT * 1.3);
    const r = c.radiusTiles * tilePx; // radiusTiles is already a tile-space radius (0.34 * radiusMult)

    ctx.save();
    ctx.translate(sx, sy);
    if (c.dying) {
      const p = Math.max(0, 1 - c.deathMs / TD_DEATH_ANIM_MS);
      ctx.globalAlpha = p;
      ctx.rotate((1 - p) * 1.1);
      ctx.scale(1, Math.max(0.15, p));
    } else {
      ctx.scale(scale, scale);
    }
    drawFn({ ctx, r, phase: c.animPhase, timeMs: world.timeMs, palette: c.palette, hurt: Math.max(0, c.hurtMs / TD_HIT_FLASH_MS), facing: heading.x >= 0 ? 1 : -1 });
    if (c.bossOverlay && !c.dying) BOSS_OVERLAYS[c.bossOverlay](ctx, r, world.timeMs, stageDef.theme.accent);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (!c.dying && c.hp < c.maxHp) {
      const pct = Math.max(0, c.hp / c.maxHp);
      const barW = r * 1.6;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(sx - barW / 2, sy - r * 1.5, barW, 4);
      ctx.fillStyle = pct > 0.4 ? "#4ade80" : "#f87171";
      ctx.fillRect(sx - barW / 2, sy - r * 1.5, barW * pct, 4);
    }
  }

  // ── Projectiles ──────────────────────────────────────────────────────────────
  for (const proj of world.projectiles) {
    const s = toPx(proj.pos);
    let color = "#fbbf24";
    let glow = "#fbbf24";
    if (proj.kind === "frost") {
      color = "#bae6fd";
      glow = "#38bdf8";
    } else if (proj.kind === "cannon") {
      color = "#1f2937";
      glow = "#000";
      // ground shadow that stays on the lane while the shell arcs — sells the mortar lob
      const dx = proj.impactPoint.x - proj.pos.x;
      const dy = proj.impactPoint.y - proj.pos.y;
      const totalDist = Math.hypot(dx, dy) + 0.001;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, tilePx * 0.16, tilePx * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      const lift = Math.sin(Math.min(1, totalDist) * Math.PI) * tilePx * 0.5;
      ctx.fillStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y - lift, tilePx * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      continue;
    }
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(s.x, s.y, tilePx * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── Particles ────────────────────────────────────────────────────────────────
  for (const p of world.particles) {
    const alpha = Math.max(0, 1 - p.ageMs / p.lifeMs);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.pos.x * tilePx, p.pos.y * tilePx, p.size * tilePx, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ── Floaters ─────────────────────────────────────────────────────────────────
  ctx.font = `bold ${Math.round(tilePx * 0.32)}px sans-serif`;
  ctx.textAlign = "center";
  for (const f of world.floaters) {
    const t = f.ageMs / TD_FLOATER_MS;
    const alpha = 1 - t;
    const rise = t * tilePx * 1.1;
    ctx.fillStyle = f.color;
    ctx.globalAlpha = alpha;
    ctx.fillText(f.text, f.pos.x * tilePx, f.pos.y * tilePx - rise);
  }
  ctx.globalAlpha = 1;

  // ── Selected-tower range ring ───────────────────────────────────────────────
  if (overlay.selectedTowerId !== null) {
    const tower = world.towers.find((t) => t.id === overlay.selectedTowerId);
    if (tower) {
      const def = getTowerType(tower.typeId);
      const range = towerRangeTiles(def, tower.level) * tilePx;
      const cx = tower.gx * tilePx + tilePx / 2;
      const cy = tower.gy * tilePx + tilePx / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── Ghost placement preview ─────────────────────────────────────────────────
  if (overlay.placingTypeId && overlay.ghostTile) {
    const def = getTowerType(overlay.placingTypeId);
    const { gx, gy } = overlay.ghostTile;
    const valid = canPlaceTower(world, gx, gy) && world.gold >= def.cost;
    const cx = gx * tilePx + tilePx / 2;
    const cy = gy * tilePx + tilePx / 2;
    const range = towerRangeTiles(def, 1) * tilePx;
    ctx.strokeStyle = valid ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.save();
    ctx.translate(cx, cy);
    const drawFn = TOWER_SPRITES[def.spriteId];
    if (drawFn) drawFn({ ctx, r: tilePx * 0.4, level: 1, aimAngle: 0, recoil: 0, engaged: false, palette: def.palette, timeMs: world.timeMs });
    ctx.restore();
    ctx.fillStyle = valid ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.18)";
    ctx.fillRect(gx * tilePx, gy * tilePx, tilePx, tilePx);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
