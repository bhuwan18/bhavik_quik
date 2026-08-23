// Plain TypeScript canvas painters, no React. Kept out of lib/ deliberately — vitest's
// coverage.include is lib/**/*.ts, and untestable CanvasRenderingContext2D code there would
// permanently distort the coverage report (same reasoning as monster-hunter-engine.ts's
// procedural wall/floor textures). Every function here receives caller-computed screen
// pixels; nothing here reads game state directly.

import type { TdPalette, BossOverlay } from "@/lib/td-data";

// ─── Creeps ─────────────────────────────────────────────────────────────────────

export type CreepDrawArgs = {
  ctx: CanvasRenderingContext2D;
  r: number; // body radius, in screen px
  phase: number; // per-creep walk clock (radians-ish), advances by speed*dt — creeps desync naturally
  timeMs: number; // global clock, for ambient wobble shared across all creeps
  palette: TdPalette;
  hurt: number; // 1 → 0 over TD_HIT_FLASH_MS — drives the white hit-flash + recoil
  facing: 1 | -1;
};
export type CreepDrawFn = (a: CreepDrawArgs) => void;

function bodyGradient(ctx: CanvasRenderingContext2D, r: number, palette: TdPalette): CanvasGradient {
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, palette.core);
  g.addColorStop(0.55, palette.mid);
  g.addColorStop(1, palette.edge);
  return g;
}

function groundShadow(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.85, r * 0.75, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function hitFlash(ctx: CanvasRenderingContext2D, r: number, hurt: number): void {
  if (hurt <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(255,255,255,${hurt * 0.5})`;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function withCreepFrame(a: CreepDrawArgs, draw: () => void): void {
  const { ctx, r, hurt, facing } = a;
  ctx.save();
  ctx.scale(facing, 1);
  ctx.translate(hurt > 0 ? -3 * hurt : 0, 0);
  groundShadow(ctx, r);
  ctx.shadowColor = a.palette.glow;
  ctx.shadowBlur = 8;
  draw();
  ctx.shadowBlur = 0;
  hitFlash(ctx, r, hurt);
  ctx.restore();
}

const drawSlime: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, phase } = a;
    const squash = Math.sin(phase) * 0.12;
    ctx.save();
    ctx.scale(1 - squash * 0.5, 1 + squash);
    ctx.fillStyle = bodyGradient(ctx, r, a.palette);
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.quadraticCurveTo(-r, -r * 0.9, 0, -r * 0.95);
    ctx.quadraticCurveTo(r, -r * 0.9, r, r * 0.6);
    ctx.quadraticCurveTo(0, r * 0.85, -r, r * 0.6);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.28, -r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.22, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // detaching drip
    const dripPhase = (a.timeMs / 2000) % 1;
    ctx.fillStyle = a.palette.mid;
    ctx.globalAlpha = 1 - dripPhase;
    ctx.beginPath();
    ctx.arc(0, r * 0.7 + dripPhase * r * 0.8, r * 0.08 * (1 - dripPhase * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
};

const drawGnawer: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, phase } = a;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    for (const s of [-1, 1]) {
      const swing = Math.sin(phase * 4 + (s > 0 ? Math.PI : 0)) * r * 0.15;
      ctx.fillRect(s * r * 0.35 + swing, r * 0.3, r * 0.1, r * 0.35);
    }
    // tail
    ctx.strokeStyle = a.palette.edge;
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, 0);
    ctx.quadraticCurveTo(-r * 1.5, Math.sin(phase * 2) * r * 0.4, -r * 1.9, Math.sin(phase * 2 + 1) * r * 0.2);
    ctx.stroke();
    // body
    ctx.fillStyle = bodyGradient(ctx, r, a.palette);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // snout + ears
    ctx.beginPath();
    ctx.moveTo(r * 0.8, -r * 0.1);
    ctx.lineTo(r * 1.35, 0);
    ctx.lineTo(r * 0.8, r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.5);
    ctx.lineTo(-r * 0.1, -r * 1.0);
    ctx.lineTo(r * 0.15, -r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(r * 0.35, -r * 0.15, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f9a8d4";
    ctx.beginPath();
    ctx.arc(r * 1.3, 0, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawTusker: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, phase } = a;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    for (let i = 0; i < 4; i++) {
      const s = i < 2 ? -1 : 1;
      const swing = Math.sin(phase * 1.6 + i) * r * 0.1;
      ctx.fillRect(s * r * 0.5 + swing - r * 0.08, r * 0.35, r * 0.16, r * 0.4);
    }
    ctx.fillStyle = bodyGradient(ctx, r, a.palette);
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, r * 0.5);
    ctx.lineTo(-r * 0.65, -r * 0.55);
    ctx.lineTo(r * 0.3, -r * 0.75);
    ctx.lineTo(r * 1.0, -r * 0.1);
    ctx.lineTo(r * 0.85, r * 0.55);
    ctx.closePath();
    ctx.fill();
    // bristles
    ctx.strokeStyle = a.palette.edge;
    ctx.lineWidth = r * 0.05;
    for (let i = 0; i < 5; i++) {
      const bx = -r * 0.5 + i * r * 0.35;
      ctx.beginPath();
      ctx.moveTo(bx, -r * 0.6);
      ctx.lineTo(bx, -r * 0.85);
      ctx.stroke();
    }
    // tusks
    ctx.fillStyle = "#fff7ed";
    ctx.beginPath();
    ctx.moveTo(r * 0.85, r * 0.1);
    ctx.quadraticCurveTo(r * 1.25, -r * 0.05, r * 1.15, -r * 0.35);
    ctx.quadraticCurveTo(r * 1.05, -r * 0.1, r * 0.9, r * 0.2);
    ctx.fill();
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.35, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawCavebat: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, timeMs } = a;
    const flap = Math.sin(timeMs / 55);
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(s, 1);
      ctx.fillStyle = a.palette.edge;
      ctx.beginPath();
      ctx.moveTo(r * 0.1, 0);
      ctx.quadraticCurveTo(r * 1.6, -r * 0.7 * flap - r * 0.3, r * 1.9, r * 0.2);
      ctx.quadraticCurveTo(r * 1.0, r * 0.15, r * 0.1, r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = bodyGradient(ctx, r * 0.7, a.palette);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.fillStyle = a.palette.mid;
      ctx.beginPath();
      ctx.moveTo(s * r * 0.3, -r * 0.5);
      ctx.lineTo(s * r * 0.45, -r * 1.0);
      ctx.lineTo(s * r * 0.15, -r * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowColor = "#f0abfc";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#f0abfc";
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.05, r * 0.09, 0, Math.PI * 2);
    ctx.arc(r * 0.2, -r * 0.05, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawSpinner: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, phase } = a;
    ctx.strokeStyle = a.palette.edge;
    ctx.lineWidth = r * 0.09;
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const g = i % 2 === 0 ? 1 : -1;
        const wig = Math.sin(phase * 5 + i * 1.3 + (g > 0 ? 0 : Math.PI)) * r * 0.3;
        const baseA = (i - 1.5) * 0.4;
        ctx.beginPath();
        ctx.moveTo(side * r * 0.3, 0);
        ctx.quadraticCurveTo(side * r * (0.9 + Math.cos(baseA) * 0.3), wig, side * r * 1.3, r * 0.15 * g);
        ctx.stroke();
      }
    }
    ctx.fillStyle = bodyGradient(ctx, r * 0.6, a.palette);
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, 0, r * 0.55, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * 0.5, 0, r * 0.75, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dc2626";
    for (const [dx, dy] of [[0.15, -0.15], [0.35, -0.15], [0.15, 0.05], [0.35, 0.05]]) {
      ctx.beginPath();
      ctx.arc(r * dx + r * 0.4, r * dy, r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

const drawGolem: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, phase } = a;
    ctx.fillStyle = bodyGradient(ctx, r, a.palette);
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, r * 0.8);
    ctx.lineTo(-r * 0.85, -r * 0.2);
    ctx.lineTo(-r * 0.4, -r * 0.9);
    ctx.lineTo(r * 0.4, -r * 0.9);
    ctx.lineTo(r * 0.85, -r * 0.2);
    ctx.lineTo(r * 0.7, r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.6);
    ctx.lineTo(r * 0.1, r * 0.1);
    ctx.lineTo(-r * 0.1, r * 0.6);
    ctx.stroke();
    for (const s of [-1, 1]) {
      const swing = Math.sin(phase * 1.5) * s * r * 0.15;
      ctx.fillStyle = a.palette.mid;
      ctx.fillRect(s * r * 0.95, -r * 0.1 + swing, r * 0.28, r * 0.6);
    }
    ctx.fillStyle = "#22d3ee";
    ctx.shadowColor = "#22d3ee";
    ctx.shadowBlur = 8;
    ctx.fillRect(-r * 0.3, -r * 0.5, r * 0.22, r * 0.09);
    ctx.fillRect(r * 0.08, -r * 0.5, r * 0.22, r * 0.09);
  });
};

const drawMagmaimp: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, phase } = a;
    ctx.strokeStyle = a.palette.edge;
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, r * 0.2);
    ctx.quadraticCurveTo(-r * 1.1, Math.sin(phase * 3) * r * 0.5, -r * 1.4, Math.sin(phase * 3) * r * 0.2 - r * 0.3);
    ctx.stroke();
    ctx.fillStyle = bodyGradient(ctx, r * 0.85, a.palette);
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.7);
    ctx.quadraticCurveTo(-r * 0.7, -r * 0.2, 0, -r * 0.75);
    ctx.quadraticCurveTo(r * 0.7, -r * 0.2, r * 0.5, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = a.palette.edge;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.2, -r * 0.65);
      ctx.quadraticCurveTo(s * r * 0.5, -r * 1.05, s * r * 0.3, -r * 1.15);
      ctx.quadraticCurveTo(s * r * 0.25, -r * 0.85, s * r * 0.05, -r * 0.7);
      ctx.fill();
    }
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(-r * 0.18, -r * 0.35, r * 0.07, 0, Math.PI * 2);
    ctx.arc(r * 0.18, -r * 0.35, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawAshwraith: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, timeMs } = a;
    ctx.fillStyle = a.palette.mid;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.6);
    ctx.lineTo(r * 0.55, -r * 0.6);
    const bottomY = r * 0.85;
    const points = 5;
    for (let i = 0; i <= points; i++) {
      const px = r * 0.55 - (i / points) * r * 1.1;
      const wobble = Math.sin(timeMs / 260 + i * 1.4) * r * 0.12;
      ctx.lineTo(px, bottomY + wobble);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.1, r * 0.32, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.15, r * 0.045, 0, Math.PI * 2);
    ctx.arc(r * 0.12, -r * 0.15, r * 0.045, 0, Math.PI * 2);
    ctx.fill();
    // regen mote
    const moteT = (timeMs / 900) % 1;
    ctx.fillStyle = `rgba(74,222,128,${0.6 * (1 - moteT)})`;
    ctx.beginPath();
    ctx.arc(r * 0.3, r * 0.3 - moteT * r * 0.9, r * 0.06, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawEmberdrake: CreepDrawFn = (a) => {
  withCreepFrame(a, () => {
    const { ctx, r, phase, timeMs } = a;
    ctx.strokeStyle = a.palette.edge;
    ctx.lineWidth = r * 0.42;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 1.3, Math.sin(phase * 2) * r * 0.15);
    for (let i = 1; i <= 3; i++) {
      ctx.lineTo(-r * 1.3 + i * r * 0.5, Math.sin(phase * 2 + i * 0.8) * r * 0.15);
    }
    ctx.stroke();
    const flap = Math.sin(timeMs / 90);
    for (const s of [-1, 1]) {
      ctx.fillStyle = a.palette.mid;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.9, -r * 0.9 * flap - r * 0.2, r * 1.5, r * 0.1);
      ctx.quadraticCurveTo(r * 0.6, r * 0.1, 0, r * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.scale(1, 1);
    }
    ctx.fillStyle = bodyGradient(ctx, r * 0.55, a.palette);
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.1, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.9, -r * 0.35);
    ctx.lineTo(r * 1.15, -r * 0.6);
    ctx.lineTo(r * 0.85, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    const glow = 0.5 + Math.sin(timeMs / 700) * 0.5;
    ctx.fillStyle = `rgba(251,191,36,${0.5 + glow * 0.5})`;
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(r * 0.75, 0, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  });
};

export const CREEP_SPRITES: Record<string, CreepDrawFn> = {
  slime: drawSlime,
  gnawer: drawGnawer,
  tusker: drawTusker,
  cavebat: drawCavebat,
  spinner: drawSpinner,
  golem: drawGolem,
  magmaimp: drawMagmaimp,
  ashwraith: drawAshwraith,
  emberdrake: drawEmberdrake,
};

export type BossOverlayFn = (ctx: CanvasRenderingContext2D, r: number, timeMs: number, accent: string) => void;

export const BOSS_OVERLAYS: Record<BossOverlay, BossOverlayFn> = {
  crown: (ctx, r, timeMs, accent) => {
    const bob = Math.sin(timeMs / 400) * r * 0.03;
    ctx.fillStyle = "#fde047";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -r * 1.05 + bob);
    ctx.lineTo(-r * 0.2, -r * 1.35 + bob);
    ctx.lineTo(0, -r * 1.1 + bob);
    ctx.lineTo(r * 0.2, -r * 1.35 + bob);
    ctx.lineTo(r * 0.35, -r * 1.05 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  },
  shards: (ctx, r, timeMs, accent) => {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + timeMs / 1800;
      const rr = r * 1.25;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rr * 0.85, Math.sin(a) * rr * 0.85 - r * 0.2);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr - r * 0.2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  },
  horns: (ctx, r, timeMs, accent) => {
    void timeMs;
    ctx.fillStyle = "#1c1917";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.3, -r * 0.85);
      ctx.quadraticCurveTo(s * r * 0.7, -r * 1.3, s * r * 0.55, -r * 1.5);
      ctx.quadraticCurveTo(s * r * 0.45, -r * 1.15, s * r * 0.18, -r * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  },
};

// ─── Towers ─────────────────────────────────────────────────────────────────────

export type TowerDrawArgs = {
  ctx: CanvasRenderingContext2D;
  r: number; // base radius, screen px
  level: number;
  aimAngle: number;
  recoil: number; // 0..1, decays after firing
  engaged: boolean;
  palette: TdPalette;
  timeMs: number;
};
export type TowerDrawFn = (a: TowerDrawArgs) => void;

function towerBase(ctx: CanvasRenderingContext2D, r: number, palette: TdPalette): void {
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.1, r * 0.85, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  g.addColorStop(0, palette.core);
  g.addColorStop(0.55, palette.mid);
  g.addColorStop(1, palette.edge);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
}

function levelPips(ctx: CanvasRenderingContext2D, r: number, level: number, color: string): void {
  const n = Math.min(5, level);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-r * 0.5 + i * r * 0.28, r * 0.95, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
}

const drawArrowTower: TowerDrawFn = (a) => {
  const { ctx, r, aimAngle, recoil, palette } = a;
  towerBase(ctx, r, palette);
  ctx.save();
  ctx.rotate(aimAngle);
  ctx.translate(-recoil * r * 0.15, 0);
  ctx.fillStyle = "#3f2d1a";
  ctx.fillRect(0, -r * 0.09, r * 1.05, r * 0.18);
  ctx.fillStyle = palette.mid;
  ctx.beginPath();
  ctx.moveTo(r * 1.05, 0);
  ctx.lineTo(r * 0.8, -r * 0.22);
  ctx.lineTo(r * 0.8, r * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  levelPips(ctx, r, a.level, palette.mid);
};

const drawFrostTower: TowerDrawFn = (a) => {
  const { ctx, r, palette, timeMs } = a;
  towerBase(ctx, r, palette);
  ctx.save();
  ctx.rotate(timeMs / 2200);
  ctx.strokeStyle = palette.core;
  ctx.lineWidth = r * 0.09;
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 8;
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang) * r * 0.7, Math.sin(ang) * r * 0.7);
    ctx.stroke();
  }
  ctx.restore();
  levelPips(ctx, r, a.level, palette.mid);
};

const drawCannonTower: TowerDrawFn = (a) => {
  const { ctx, r, aimAngle, recoil, palette } = a;
  towerBase(ctx, r, palette);
  ctx.save();
  ctx.rotate(aimAngle);
  ctx.translate(-recoil * r * 0.2, 0);
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(0, -r * 0.22, r * 0.95, r * 0.44);
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(r * 0.95, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  levelPips(ctx, r, a.level, palette.mid);
};

const drawBeaconTower: TowerDrawFn = (a) => {
  const { ctx, r, palette, timeMs } = a;
  towerBase(ctx, r, palette);
  ctx.save();
  ctx.rotate(timeMs / 1200);
  ctx.strokeStyle = `rgba(202,138,4,0.5)`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-r * 0.05, -r * 1.0, r * 0.1, r * 0.75);
  const flagWave = Math.sin(timeMs / 300) * 0.25;
  ctx.fillStyle = palette.mid;
  ctx.beginPath();
  ctx.moveTo(r * 0.05, -r * 1.0);
  ctx.quadraticCurveTo(r * 0.5, -r * 0.9 + flagWave * r, r * 0.55, -r * 0.65);
  ctx.lineTo(r * 0.05, -r * 0.65);
  ctx.closePath();
  ctx.fill();
  levelPips(ctx, r, a.level, palette.mid);
};

const drawSniperTower: TowerDrawFn = (a) => {
  const { ctx, r, aimAngle, recoil, palette } = a;
  towerBase(ctx, r, palette);
  ctx.save();
  ctx.rotate(aimAngle);
  ctx.translate(-recoil * r * 0.1, 0);
  ctx.strokeStyle = "#052e16";
  ctx.lineWidth = r * 0.11;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 1.25, 0);
  ctx.stroke();
  ctx.fillStyle = palette.mid;
  ctx.fillRect(-r * 0.1, -r * 0.16, r * 0.35, r * 0.32);
  ctx.restore();
  levelPips(ctx, r, a.level, palette.mid);
};

const drawTeslaTower: TowerDrawFn = (a) => {
  const { ctx, r, palette, timeMs, engaged } = a;
  towerBase(ctx, r, palette);
  ctx.strokeStyle = "#4c1d95";
  ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.15);
  ctx.lineTo(0, -r * 0.85);
  ctx.stroke();
  const flicker = engaged ? 1 : 0.4 + Math.sin(timeMs / 180) * 0.2;
  ctx.fillStyle = `rgba(237,233,254,${flicker})`;
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(0, -r * 0.9, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  levelPips(ctx, r, a.level, palette.mid);
};

export const TOWER_SPRITES: Record<string, TowerDrawFn> = {
  arrow: drawArrowTower,
  frost: drawFrostTower,
  cannon: drawCannonTower,
  beacon: drawBeaconTower,
  sniper: drawSniperTower,
  tesla: drawTeslaTower,
};

// ─── Terrain ────────────────────────────────────────────────────────────────────
// Cached per (terrainId, tilePx) — tilePx is derived per-viewport, unlike Monster Hunter's
// fixed MH_TILE_PX, so the cache key must include it.

export type TerrainId = "grass" | "cavern" | "basalt";

function paintGrassTile(tctx: CanvasRenderingContext2D, size: number): void {
  const g = tctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#356b2c");
  g.addColorStop(1, "#1f4419");
  tctx.fillStyle = g;
  tctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = size * (0.08 + Math.random() * 0.08);
    tctx.strokeStyle = Math.random() > 0.5 ? "rgba(150,210,100,0.4)" : "rgba(18,55,14,0.4)";
    tctx.lineWidth = 1;
    tctx.beginPath();
    tctx.moveTo(x, y);
    tctx.lineTo(x, y - len);
    tctx.stroke();
  }
}

function paintCavernTile(tctx: CanvasRenderingContext2D, size: number): void {
  const g = tctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#2a2440");
  g.addColorStop(1, "#171226");
  tctx.fillStyle = g;
  tctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = size * (0.03 + Math.random() * 0.04);
    tctx.fillStyle = "rgba(196,181,253,0.25)";
    tctx.beginPath();
    tctx.moveTo(x, y - r);
    tctx.lineTo(x + r * 0.6, y);
    tctx.lineTo(x, y + r);
    tctx.lineTo(x - r * 0.6, y);
    tctx.closePath();
    tctx.fill();
  }
}

function paintBasaltTile(tctx: CanvasRenderingContext2D, size: number): void {
  const g = tctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#241009");
  g.addColorStop(1, "#120704");
  tctx.fillStyle = g;
  tctx.fillRect(0, 0, size, size);
  tctx.strokeStyle = "rgba(251,146,60,0.35)";
  tctx.lineWidth = 1;
  for (let i = 0; i < 2; i++) {
    const x0 = Math.random() * size;
    const y0 = Math.random() * size;
    tctx.beginPath();
    tctx.moveTo(x0, y0);
    tctx.lineTo(x0 + (Math.random() - 0.5) * size * 0.6, y0 + (Math.random() - 0.5) * size * 0.6);
    tctx.stroke();
  }
}

const TERRAIN_PAINTERS: Record<TerrainId, (ctx: CanvasRenderingContext2D, size: number) => void> = {
  grass: paintGrassTile,
  cavern: paintCavernTile,
  basalt: paintBasaltTile,
};

const terrainCache = new Map<string, HTMLCanvasElement>();

export function getTerrainTile(terrainId: TerrainId, tilePx: number): HTMLCanvasElement {
  const key = `${terrainId}:${Math.round(tilePx)}`;
  let canvas = terrainCache.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = tilePx;
    canvas.height = tilePx;
    TERRAIN_PAINTERS[terrainId](canvas.getContext("2d")!, tilePx);
    terrainCache.set(key, canvas);
  }
  return canvas;
}

const pathCache = new Map<string, HTMLCanvasElement>();

export function getPathTile(top: string, bottom: string, tilePx: number): HTMLCanvasElement {
  const key = `${top}|${bottom}:${Math.round(tilePx)}`;
  let canvas = pathCache.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = tilePx;
    canvas.height = tilePx;
    const tctx = canvas.getContext("2d")!;
    const g = tctx.createLinearGradient(0, 0, 0, tilePx);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    tctx.fillStyle = g;
    tctx.fillRect(0, 0, tilePx, tilePx);
    tctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < 4; i++) {
      tctx.fillRect(Math.random() * tilePx, Math.random() * tilePx, tilePx * 0.15, tilePx * 0.06);
    }
    pathCache.set(key, canvas);
  }
  return canvas;
}
