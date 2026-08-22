"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useGameLoop } from "./use-game-loop";
import { useQuizRun, type RunQuestion } from "./use-quiz-run";
import CategoryPicker from "./CategoryPicker";
import { useBoss } from "@/components/boss/BossProvider";
import { pickNextQuestion } from "@/lib/question-picker";
import {
  TD_PATH,
  enemyHpForWave,
  enemyCountForWave,
  towerCost,
  towerUpgradeCost,
  towerDamage,
  towerRange,
  positionAtPathProgress,
} from "@/lib/tower-defense";
import { TD_STARTING_LIVES, TD_TOTAL_WAVES, TD_GOLD_PER_CORRECT, TD_ENEMY_SPEED, GAME_DAMAGE_PER_CORRECT } from "@/lib/game-config";

type Phase = "intro" | "playing" | "done";

const GRID_COLS = 18;
const GRID_ROWS = 10;
const TILE_PX = 32;
const CANVAS_W = GRID_COLS * TILE_PX;
const CANVAS_H = GRID_ROWS * TILE_PX;
const TOWER_FIRE_COOLDOWN_MS = 500;

type TdEnemy = { id: number; t: number; hp: number; maxHp: number };
type TdTower = { id: number; gx: number; gy: number; level: number; cooldownMs: number };
type TdWorld = {
  enemies: TdEnemy[];
  towers: TdTower[];
  wave: number;
  lives: number;
  spawnedThisWave: number;
  enemiesThisWave: number;
  spawnTimerMs: number;
  nextId: number;
  outcome: "playing" | "victory" | "defeat";
};

function pathLengthInTiles(): number {
  let len = 0;
  for (let i = 1; i < TD_PATH.length; i++) {
    len += Math.hypot(TD_PATH[i].x - TD_PATH[i - 1].x, TD_PATH[i].y - TD_PATH[i - 1].y);
  }
  return len;
}

function blockedTileKeys(): Set<string> {
  const blocked = new Set<string>();
  for (let i = 0; i <= 400; i++) {
    const pos = positionAtPathProgress(i / 400);
    if (!pos) continue;
    blocked.add(`${Math.round(pos.x)},${Math.round(pos.y)}`);
  }
  return blocked;
}

export default function TowerDefenseGame({ onBack }: { onBack: () => void }) {
  const boss = useBoss();
  const run = useQuizRun();

  const [phase, setPhase] = useState<Phase>("intro");
  const [category, setCategory] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [gold, setGold] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(TD_STARTING_LIVES);
  const [outcome, setOutcome] = useState<"playing" | "victory" | "defeat">("playing");
  const [currentQuestion, setCurrentQuestion] = useState<RunQuestion | null>(null);
  const [finalCoins, setFinalCoins] = useState<number | null>(null);
  const [selectedTower, setSelectedTower] = useState<{ gx: number; gy: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<TdWorld | null>(null);
  const goldRef = useRef(0);
  const submittedRef = useRef(false);
  const askedIdsRef = useRef<Set<string>>(new Set());

  const blocked = useMemo(() => blockedTileKeys(), []);
  const pathLenTiles = useMemo(() => pathLengthInTiles(), []);
  const progressPerSecond = TD_ENEMY_SPEED / Math.max(1, pathLenTiles * TILE_PX);

  const syncGold = useCallback((delta: number) => {
    goldRef.current = Math.max(0, goldRef.current + delta);
    setGold(goldRef.current);
  }, []);

  const endRun = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setRunning(false);
    setPhase("done");
    const result = await run.submit();
    setFinalCoins(result?.coinsEarned ?? 0);
  }, [run]);

  const step = useCallback(
    (dt: number) => {
      const w = worldRef.current;
      if (!w || w.outcome !== "playing") return;
      const dtMs = dt * 1000;

      // Spawn
      if (w.spawnedThisWave < w.enemiesThisWave) {
        w.spawnTimerMs -= dtMs;
        if (w.spawnTimerMs <= 0) {
          w.enemies.push({ id: w.nextId++, t: 0, hp: enemyHpForWave(w.wave), maxHp: enemyHpForWave(w.wave) });
          w.spawnedThisWave += 1;
          w.spawnTimerMs = 650;
        }
      }

      // Move enemies, handle leaks
      const survivors: TdEnemy[] = [];
      for (const e of w.enemies) {
        e.t += progressPerSecond * dt;
        if (e.t >= 1) {
          w.lives -= 1;
          setLives(w.lives);
          if (w.lives <= 0) {
            w.outcome = "defeat";
          }
        } else if (e.hp > 0) {
          survivors.push(e);
        }
      }
      w.enemies = survivors;

      // Towers fire at nearest enemy in range
      for (const tower of w.towers) {
        tower.cooldownMs -= dtMs;
        if (tower.cooldownMs > 0) continue;
        const towerPx = { x: tower.gx * TILE_PX + TILE_PX / 2, y: tower.gy * TILE_PX + TILE_PX / 2 };
        const range = towerRange(tower.level, TILE_PX);
        let nearest: TdEnemy | null = null;
        let nearestDist = Infinity;
        for (const e of w.enemies) {
          const pos = positionAtPathProgress(e.t);
          if (!pos) continue;
          const px = pos.x * TILE_PX + TILE_PX / 2;
          const py = pos.y * TILE_PX + TILE_PX / 2;
          const dist = Math.hypot(px - towerPx.x, py - towerPx.y);
          if (dist <= range && dist < nearestDist) {
            nearest = e;
            nearestDist = dist;
          }
        }
        if (nearest) {
          nearest.hp -= towerDamage(tower.level);
          tower.cooldownMs = TOWER_FIRE_COOLDOWN_MS;
        }
      }

      // Wave complete → advance or win
      if (w.outcome === "playing" && w.spawnedThisWave >= w.enemiesThisWave && w.enemies.length === 0) {
        if (w.wave >= TD_TOTAL_WAVES) {
          w.outcome = "victory";
        } else {
          w.wave += 1;
          setWave(w.wave);
          w.spawnedThisWave = 0;
          w.enemiesThisWave = enemyCountForWave(w.wave);
          w.spawnTimerMs = 0;
        }
      }

      if (w.outcome !== "playing") {
        setOutcome(w.outcome);
        endRun();
      }
    },
    [progressPerSecond, endRun]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const w = worldRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !w || !ctx) return;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, "#141a3d");
    bgGrad.addColorStop(1, "#0a0e26");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Path: glowing lane with a lighter core
    ctx.shadowColor = "rgba(96,165,250,0.35)";
    ctx.shadowBlur = 6;
    for (const key of blocked) {
      const [gx, gy] = key.split(",").map(Number);
      const grad = ctx.createLinearGradient(gx * TILE_PX, gy * TILE_PX, gx * TILE_PX, gy * TILE_PX + TILE_PX);
      grad.addColorStop(0, "#2d2560");
      grad.addColorStop(1, "#1a1440");
      ctx.fillStyle = grad;
      ctx.fillRect(gx * TILE_PX, gy * TILE_PX, TILE_PX, TILE_PX);
    }
    ctx.shadowBlur = 0;

    // Towers: gradient turret with a range ring on the currently selected tile
    for (const tower of w.towers) {
      const cx = tower.gx * TILE_PX + TILE_PX / 2;
      const cy = tower.gy * TILE_PX + TILE_PX / 2;
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 10;
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, TILE_PX * 0.38);
      grad.addColorStop(0, "#dbeafe");
      grad.addColorStop(0.5, "#60a5fa");
      grad.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, TILE_PX * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(tower.level), cx, cy + 4);
    }

    // Enemies: gradient body + glowing HP bar
    for (const e of w.enemies) {
      const pos = positionAtPathProgress(e.t);
      if (!pos) continue;
      const px = pos.x * TILE_PX + TILE_PX / 2;
      const py = pos.y * TILE_PX + TILE_PX / 2;
      ctx.shadowColor = "rgba(248,113,113,0.6)";
      ctx.shadowBlur = 8;
      const grad = ctx.createRadialGradient(px - 4, py - 4, 2, px, py, TILE_PX * 0.28);
      grad.addColorStop(0, "#fecaca");
      grad.addColorStop(0.45, "#f87171");
      grad.addColorStop(1, "#7f1d1d");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, TILE_PX * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const hpPct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(px - 12, py - TILE_PX * 0.42, 24, 4);
      ctx.fillStyle = hpPct > 0.4 ? "#4ade80" : "#f87171";
      ctx.fillRect(px - 12, py - TILE_PX * 0.42, 24 * hpPct, 4);
    }
  }, [blocked]);

  useGameLoop(step, draw, running && phase === "playing");

  const startRun = async () => {
    const questions = await run.load(category);
    if (!questions) return;
    submittedRef.current = false;
    goldRef.current = 0;
    setGold(0);
    setWave(1);
    setLives(TD_STARTING_LIVES);
    setOutcome("playing");
    askedIdsRef.current = new Set();
    setCurrentQuestion(pickNextQuestion(questions, askedIdsRef.current, 1));
    setFinalCoins(null);
    setSelectedTower(null);
    worldRef.current = {
      enemies: [],
      towers: [],
      wave: 1,
      lives: TD_STARTING_LIVES,
      spawnedThisWave: 0,
      enemiesThisWave: enemyCountForWave(1),
      spawnTimerMs: 0,
      nextId: 1,
      outcome: "playing",
    };
    setPhase("playing");
    setRunning(true);
  };

  const handleCanvasTap = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const w = worldRef.current;
    if (!canvas || !w) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const gx = Math.floor(x / TILE_PX);
    const gy = Math.floor(y / TILE_PX);
    if (gx < 0 || gy < 0 || gx >= GRID_COLS || gy >= GRID_ROWS) return;
    if (blocked.has(`${gx},${gy}`)) return;

    const existing = w.towers.find((t) => t.gx === gx && t.gy === gy);
    if (existing) {
      const cost = towerUpgradeCost(existing.level);
      if (goldRef.current >= cost) {
        syncGold(-cost);
        existing.level += 1;
      }
      setSelectedTower({ gx, gy });
      return;
    }

    const cost = towerCost();
    if (goldRef.current >= cost) {
      syncGold(-cost);
      w.towers.push({ id: w.nextId++, gx, gy, level: 1, cooldownMs: 0 });
    }
    setSelectedTower({ gx, gy });
  };

  const answerQuestion = (idx: number) => {
    const q = currentQuestion;
    if (!q) return;
    run.recordAnswer(q.id, idx);
    askedIdsRef.current.add(q.id);
    const correct = idx === q.correctIndex;
    if (correct) {
      syncGold(TD_GOLD_PER_CORRECT);
      boss.registerHit(GAME_DAMAGE_PER_CORRECT);
    } else {
      boss.registerMiss();
    }
    // Always a fresh question, right or wrong — TD has no single reward moment to gate,
    // every question is an equally good next chance at gold, so there's nothing to retry.
    setCurrentQuestion(pickNextQuestion(run.questions, askedIdsRef.current, worldRef.current?.wave ?? 1));
  };

  if (phase === "intro") {
    const instructions = [
      { icon: "🪙", text: "Correct answer = gold. Wrong = no gold, no penalty" },
      { icon: "🏰", text: "Tap an empty tile to build, tap a tower to upgrade it" },
      { icon: "🌊", text: `Survive ${TD_TOTAL_WAVES} waves with ${TD_STARTING_LIVES} lives` },
    ];
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm block text-left">
          ← Back
        </button>
        <div className="text-center">
          <div
            className="float-anim inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 text-5xl"
            style={{
              background: "radial-gradient(circle at 35% 30%, #93c5fd, #2563eb 55%, #1e3a8a 100%)",
              boxShadow: "0 0 40px 8px rgba(37,99,235,0.35), inset 0 2px 4px rgba(255,255,255,0.25)",
            }}
          >
            🏰
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
            Tower <span className="text-blue-400">Defense</span>
          </h1>
          <p className="text-gray-400 mb-6">Answer questions to earn gold, spend it on towers to stop the waves.</p>
          <div className="rounded-2xl p-5 mb-6 text-left space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {instructions.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-base">
                  {item.icon}
                </span>
                <span className="text-sm text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>
          <CategoryPicker selected={category} onSelect={setCategory} />
          {run.loadError && (
            <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{run.loadError}</p>
          )}
          <button
            onClick={startRun}
            disabled={run.loading}
            className="w-full py-4 text-white font-bold text-lg rounded-2xl transition-all duration-200 disabled:opacity-50 hover:scale-[1.015] active:scale-[0.98] shadow-xl"
            style={{ background: "linear-gradient(135deg, #60a5fa, #2563eb)", boxShadow: "0 8px 24px -6px rgba(37,99,235,0.5)" }}
          >
            {run.loading ? "Loading..." : "Start Defense! 🏰"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const victory = outcome === "victory";
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 text-5xl"
          style={{
            background: victory
              ? "radial-gradient(circle at 35% 30%, #fde68a, #d97706 55%, #78350f 100%)"
              : "radial-gradient(circle at 35% 30%, #64748b, #334155 55%, #0f172a 100%)",
            boxShadow: victory ? "0 0 40px 8px rgba(217,119,6,0.4)" : "0 0 30px 6px rgba(51,65,85,0.4)",
          }}
        >
          {victory ? "🏆" : "💥"}
        </div>
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{victory ? "Victory!" : "Base Overrun!"}</h2>
        <p className="text-gray-400 mb-6">Reached wave <span className="text-white font-bold">{wave}</span> of {TD_TOTAL_WAVES}</p>
        <div
          className="px-6 py-4 rounded-2xl inline-flex items-center gap-2 text-xl font-bold mb-8"
          style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.35)", color: "#facc15" }}
        >
          {finalCoins === null ? "Calculating…" : `🪙 +${finalCoins} coins`}
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setPhase("intro")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
            Play Again
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 text-white font-semibold rounded-xl transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #60a5fa, #2563eb)" }}
          >
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  const q = currentQuestion;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div
        className="flex items-center justify-between mb-3 px-3.5 py-2.5 rounded-2xl text-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <span className="text-gray-400 font-semibold">🌊 {wave}/{TD_TOTAL_WAVES}</span>
        <span className="text-red-400 font-bold">❤️ {lives}</span>
        <span className="text-yellow-400 font-bold">🪙 {gold}</span>
        <button onClick={endRun} className="text-gray-500 hover:text-white text-xs font-semibold">Give Up</button>
      </div>

      <div className="rounded-2xl overflow-hidden mb-2 shadow-2xl" style={{ border: "1px solid var(--border)" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-auto block cursor-pointer"
          onClick={(e) => handleCanvasTap(e.clientX, e.clientY)}
        />
      </div>
      <p className="text-[11px] text-gray-500 mb-4 text-center">
        Tap an open tile to build (🪙{towerCost()}), tap a tower to upgrade{selectedTower ? "" : ""}.
      </p>

      {q && (
        <div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
            {q.imageUrl && (
              <div className="mb-3 flex justify-center">
                <div className="bg-white rounded-xl p-3 shadow-lg flex items-center justify-center w-[200px] h-[120px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={q.imageUrl} alt={q.text} className="object-contain w-full h-full" />
                </div>
              </div>
            )}
            <p className="text-base font-semibold text-white">{q.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => answerQuestion(idx)}
                className="bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 text-gray-300 hover:text-white px-4 py-3 rounded-xl transition-all text-sm font-medium"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
