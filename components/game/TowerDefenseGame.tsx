"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameLoop } from "./use-game-loop";
import { useQuizRun, type RunQuestion } from "./use-quiz-run";
import CategoryPicker from "./CategoryPicker";
import { useBoss } from "@/components/boss/BossProvider";
import { pickNextQuestion } from "@/lib/question-picker";
import {
  createStageWorld,
  stepWorld,
  drawWorld,
  tryPlaceTower,
  tryUpgradeTower,
  sellTower,
  sendWaveEarly,
  type World,
} from "./tower-defense-engine";
import { waveComposition, towerTotalInvested, towerUpgradeCost, towerSellValue, towerDamage, towerCooldownMs, towerRangeTiles } from "@/lib/tower-defense";
import { TOWER_TYPES, getTowerType, getCreepType, getStageDef } from "@/lib/td-data";
import { RARITY_COLORS } from "@/lib/utils";
import {
  TD_STAGE_COUNT,
  TD_WAVES_PER_STAGE,
  TD_STARTING_LIVES,
  TD_STARTING_GOLD,
  TD_GOLD_PER_CORRECT,
  TD_STAGE_CLEAR_BONUS,
  TD_STAGE_CLEAR_LIVES,
  TD_STAGE_INTRO_MS,
  TD_ANSWER_REVEAL_MS,
  TD_TOWER_MAX_LEVEL,
  TD_GRID_COLS,
  TD_GRID_ROWS,
  TD_MIN_TILE_PX,
  TD_MAX_TILE_PX,
  TD_MAX_DPR,
  TD_HUD_SYNC_MS,
  GAME_DAMAGE_PER_CORRECT,
} from "@/lib/game-config";

type Phase = "intro" | "stage-intro" | "playing" | "stage-clear" | "done";
type Outcome = "victory" | "defeat" | null;

type Hud = {
  gold: number;
  lives: number;
  stage: number;
  waveInStage: number;
  worldPhase: "build" | "wave";
  buildTimerMs: number;
  buildTimerTotalMs: number;
};

type SelectedSnapshot = { id: number; typeId: string; level: number } | null;
type StageClearInfo = { refund: number; bonus: number; livesRestored: number; totalGold: number };
type GhostTile = { gx: number; gy: number } | null;

export default function TowerDefenseGame({ onBack }: { onBack: () => void }) {
  const boss = useBoss();
  const run = useQuizRun();

  const [phase, setPhase] = useState<Phase>("intro");
  const [category, setCategory] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [finalCoins, setFinalCoins] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hud, setHud] = useState<Hud>({ gold: 0, lives: 0, stage: 1, waveInStage: 1, worldPhase: "build", buildTimerMs: 0, buildTimerTotalMs: 1 });
  const [currentQuestion, setCurrentQuestion] = useState<RunQuestion | null>(null);
  const [revealIdx, setRevealIdx] = useState<number | null>(null);
  const [placingTypeId, setPlacingTypeId] = useState<string | null>(null);
  const [ghostTile, setGhostTile] = useState<GhostTile>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SelectedSnapshot>(null);
  const [stageClearInfo, setStageClearInfo] = useState<StageClearInfo | null>(null);
  const [totalKills, setTotalKills] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const tilePxRef = useRef(32);
  const submittedRef = useRef(false);
  const askedIdsRef = useRef<Set<string>>(new Set());
  const killsRef = useRef(0);
  const pendingStageRef = useRef<{ stage: number; gold: number; lives: number } | null>(null);
  const stageIntroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return () => {
      if (stageIntroTimeoutRef.current) clearTimeout(stageIntroTimeoutRef.current);
      if (answerRevealTimeoutRef.current) clearTimeout(answerRevealTimeoutRef.current);
    };
  }, []);

  // ── Canvas sizing: tilePx derived from viewport, DPR-correct backing store ────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || phase === "intro" || phase === "done") return;
    const resize = () => {
      const availW = container.clientWidth;
      const availH = container.clientHeight;
      const tilePx = Math.max(TD_MIN_TILE_PX, Math.min(TD_MAX_TILE_PX, Math.min(availW / TD_GRID_COLS, availH / TD_GRID_ROWS)));
      tilePxRef.current = tilePx;
      const cssW = TD_GRID_COLS * tilePx;
      const cssH = TD_GRID_ROWS * tilePx;
      const dpr = Math.min(TD_MAX_DPR, window.devicePixelRatio || 1);
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [phase]);

  // ── HUD + selected-tower snapshot sync (throttled — the only 60Hz→React bridge) ──
  useEffect(() => {
    if (phase !== "playing" && phase !== "stage-intro") return;
    const interval = setInterval(() => {
      const w = worldRef.current;
      if (!w) return;
      setHud({ gold: w.gold, lives: w.lives, stage: w.stage, waveInStage: w.waveInStage, worldPhase: w.phase, buildTimerMs: w.buildTimerMs, buildTimerTotalMs: w.buildTimerTotalMs });
      setTotalKills(killsRef.current);
      setSelectedSnapshot((prev) => {
        if (prev === null) return prev;
        const tower = w.towers.find((t) => t.id === prev.id);
        return tower ? { id: tower.id, typeId: tower.typeId, level: tower.level } : null;
      });
    }, TD_HUD_SYNC_MS);
    return () => clearInterval(interval);
  }, [phase]);

  const endRun = useCallback(
    async (result: "victory" | "defeat") => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setOutcome(result);
      setPhase("done");
      const submitResult = await run.submit();
      setFinalCoins(submitResult?.coinsEarned ?? 0);
    },
    [run]
  );

  const step = useCallback(
    (dt: number) => {
      const w = worldRef.current;
      if (!w || phase !== "playing") return;
      const events = stepWorld(w, dt);
      if (events.creepsKilled > 0) killsRef.current += events.creepsKilled;

      if (events.defeat) {
        endRun("defeat");
        return;
      }
      if (events.victory) {
        endRun("victory");
        return;
      }
      if (events.stageCleared) {
        const refund = w.towers.reduce((sum, t) => sum + towerTotalInvested(getTowerType(t.typeId), t.level), 0);
        const livesRestored = Math.min(TD_STAGE_CLEAR_LIVES, TD_STARTING_LIVES - w.lives);
        const newGold = w.gold + refund + TD_STAGE_CLEAR_BONUS;
        const newLives = Math.min(TD_STARTING_LIVES, w.lives + TD_STAGE_CLEAR_LIVES);
        pendingStageRef.current = { stage: w.stage + 1, gold: newGold, lives: newLives };
        setStageClearInfo({ refund, bonus: TD_STAGE_CLEAR_BONUS, livesRestored, totalGold: newGold });
        setSelectedTowerId(null);
        setPlacingTypeId(null);
        setPhase("stage-clear");
      }
    },
    [phase, endRun]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const w = worldRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !w || !ctx) return;
    drawWorld(ctx, w, tilePxRef.current, canvas.clientWidth, canvas.clientHeight, reducedMotion, { selectedTowerId, placingTypeId, ghostTile });
  }, [reducedMotion, selectedTowerId, placingTypeId, ghostTile]);

  useGameLoop(step, draw, phase === "playing" || phase === "stage-intro" || phase === "stage-clear");

  const beginStageIntro = useCallback(() => {
    if (stageIntroTimeoutRef.current) clearTimeout(stageIntroTimeoutRef.current);
    setPhase("stage-intro");
    stageIntroTimeoutRef.current = setTimeout(() => setPhase("playing"), TD_STAGE_INTRO_MS);
  }, []);

  const startRun = async () => {
    const questions = await run.load(category);
    if (!questions) return;
    submittedRef.current = false;
    killsRef.current = 0;
    askedIdsRef.current = new Set();
    setOutcome(null);
    setFinalCoins(null);
    setSelectedTowerId(null);
    setPlacingTypeId(null);
    setGhostTile(null);
    setStageClearInfo(null);
    setRevealIdx(null);
    setTotalKills(0);
    worldRef.current = createStageWorld(1, TD_STARTING_GOLD, TD_STARTING_LIVES);
    setCurrentQuestion(pickNextQuestion(questions, askedIdsRef.current, 1));
    beginStageIntro();
  };

  const goToNextStage = () => {
    const pending = pendingStageRef.current;
    if (!pending) return;
    worldRef.current = createStageWorld(pending.stage, pending.gold, pending.lives);
    setStageClearInfo(null);
    beginStageIntro();
  };

  const skipStageIntro = () => {
    if (stageIntroTimeoutRef.current) clearTimeout(stageIntroTimeoutRef.current);
    setPhase("playing");
  };

  const handleSendWave = () => {
    const w = worldRef.current;
    if (!w) return;
    sendWaveEarly(w);
  };

  const clientToTile = (clientX: number, clientY: number): { gx: number; gy: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((clientX - rect.left) / tilePxRef.current);
    const gy = Math.floor((clientY - rect.top) / tilePxRef.current);
    return { gx, gy };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = worldRef.current;
    const tile = clientToTile(e.clientX, e.clientY);
    if (!w || !tile) return;
    if (placingTypeId) {
      if (tryPlaceTower(w, placingTypeId, tile.gx, tile.gy)) {
        setPlacingTypeId(null);
        setGhostTile(null);
      }
      return;
    }
    const tower = w.towers.find((t) => t.gx === tile.gx && t.gy === tile.gy);
    setSelectedTowerId(tower ? tower.id : null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!placingTypeId) return;
    setGhostTile(clientToTile(e.clientX, e.clientY));
  };

  const selectShopTower = (typeId: string) => {
    setSelectedTowerId(null);
    setPlacingTypeId((prev) => (prev === typeId ? null : typeId));
  };

  const upgradeSelected = () => {
    if (selectedTowerId === null || !worldRef.current) return;
    tryUpgradeTower(worldRef.current, selectedTowerId);
  };

  const sellSelected = () => {
    if (selectedTowerId === null || !worldRef.current) return;
    sellTower(worldRef.current, selectedTowerId);
    setSelectedTowerId(null);
  };

  const answerQuestion = (idx: number) => {
    const q = currentQuestion;
    if (!q || revealIdx !== null) return;
    run.recordAnswer(q.id, idx);
    askedIdsRef.current.add(q.id);
    const correct = idx === q.correctIndex;
    setRevealIdx(idx);
    if (correct) {
      if (worldRef.current) worldRef.current.gold += TD_GOLD_PER_CORRECT;
      boss.registerHit(GAME_DAMAGE_PER_CORRECT);
    } else {
      boss.registerMiss();
    }
    if (answerRevealTimeoutRef.current) clearTimeout(answerRevealTimeoutRef.current);
    answerRevealTimeoutRef.current = setTimeout(() => {
      setRevealIdx(null);
      setCurrentQuestion(pickNextQuestion(run.questions, askedIdsRef.current, worldRef.current?.stage ?? 1));
    }, TD_ANSWER_REVEAL_MS);
  };

  const wavePreview = useMemo(() => {
    return waveComposition(hud.stage, hud.waveInStage)
      .flatMap((g) => Array(Math.min(g.count, 5)).fill(getCreepType(g.creepId).icon))
      .slice(0, 8);
  }, [hud.stage, hud.waveInStage]);

  const stageTheme = getStageDef(hud.stage).theme;
  const stageName = getStageDef(hud.stage).name;

  // ── Intro ───────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const instructions = [
      { icon: "🏹", text: "6 tower types, each with a real role — pick from the shop and place them" },
      { icon: "🌊", text: `${TD_STAGE_COUNT} themed stages, ${TD_WAVES_PER_STAGE} waves each — the last wave of every stage is a boss` },
      { icon: "⏱️", text: "Answer questions for gold between waves — a build breather lets you plan, or send the wave early for a gold bonus" },
      { icon: "💀", text: "Kills drop gold too — every enemy you stop pays for itself" },
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
          <p className="text-gray-400 mb-6">Answer questions to earn gold, build a real arsenal of towers, and hold three worlds of waves.</p>
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
          {reducedMotion && <p className="text-xs text-gray-500 mb-4">Reduced motion is on — screen shake and particle effects are disabled.</p>}
          <CategoryPicker selected={category} onSelect={setCategory} />
          {run.loadError && <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{run.loadError}</p>}
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

  // ── Done ────────────────────────────────────────────────────────────────────
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
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{victory ? "All Stages Cleared!" : "Base Overrun!"}</h2>
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            Stage <span className="text-white font-bold">{hud.stage}</span>/{TD_STAGE_COUNT}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-sm text-gray-300">
            Wave <span className="text-blue-300 font-bold">{hud.waveInStage}</span>/{TD_WAVES_PER_STAGE}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            💀 <span className="text-white font-bold">{totalKills}</span> kills
          </span>
        </div>
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

  // ── Stage-intro / playing / stage-clear ────────────────────────────────────
  const livesPct = Math.max(0, Math.min(100, (hud.lives / TD_STARTING_LIVES) * 100));
  const buildPct = hud.buildTimerTotalMs > 0 ? Math.max(0, Math.min(100, (hud.buildTimerMs / hud.buildTimerTotalMs) * 100)) : 0;
  const selectedDef = selectedSnapshot ? getTowerType(selectedSnapshot.typeId) : null;

  return (
    <div className="fixed left-0 right-0 top-0 bottom-16 md:bottom-0 z-20 bg-black flex flex-col" style={{ touchAction: "manipulation" }}>
      {/* HUD */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between pointer-events-none">
        <div
          className="rounded-2xl px-3.5 py-3 space-y-2 min-w-[190px] backdrop-blur-md pointer-events-auto"
          style={{ background: "rgba(8,9,28,0.72)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)" }}
        >
          <div className="flex items-center justify-between text-xs text-white font-bold">
            <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: `${stageTheme.accent}25`, border: `1px solid ${stageTheme.accent}55`, color: stageTheme.accent }}>
              {stageName}
            </span>
            <span className="text-blue-300">
              🌊 {hud.waveInStage}/{TD_WAVES_PER_STAGE}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full relative overflow-hidden transition-all duration-300" style={{ width: `${livesPct}%`, background: "linear-gradient(90deg, #dc2626, #f87171)" }}>
              <span className="boss-hp-shimmer absolute inset-y-0 left-0 w-1/3" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-300 font-semibold">
            <span>❤️ {hud.lives}</span>
            <span className="text-yellow-400">🪙 {hud.gold}</span>
          </div>
          {wavePreview.length > 0 && (
            <div className="flex items-center gap-1 pt-1.5 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-[9px] text-gray-500 uppercase tracking-wide mr-0.5">Next:</span>
              {wavePreview.map((icon, i) => (
                <span key={i} className="text-xs">
                  {icon}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => endRun("defeat")}
          className="pointer-events-auto text-gray-300 hover:text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl backdrop-blur-md transition-colors"
          style={{ background: "rgba(8,9,28,0.72)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Give Up
        </button>
      </div>

      {/* Canvas board, centered in the remaining space */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center min-h-0 relative">
        <canvas ref={canvasRef} className="block cursor-pointer" onClick={handleCanvasClick} onMouseMove={handleCanvasMouseMove} />
        {(phase === "stage-intro" || phase === "stage-clear") && <div className="absolute inset-0 bg-black/55 pointer-events-none" />}

        {/* Send Wave — bottom-right of the board, deliberately clear of the boss overlay's
            fixed top-right slot (z-30, always present per BossOverlay's own layering rules). */}
        {phase === "playing" && hud.worldPhase === "build" && (
          <button
            onClick={handleSendWave}
            className="absolute z-10 bottom-3 right-3 flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm text-white backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            style={{
              background: "rgba(37,99,235,0.85)",
              border: "1px solid rgba(147,197,253,0.5)",
              boxShadow: "0 8px 20px -6px rgba(37,99,235,0.6)",
            }}
          >
            ⏩ Send Wave <span className="opacity-80">({Math.ceil(hud.buildTimerMs / 1000)}s)</span>
          </button>
        )}
      </div>

      {/* Stage-intro banner */}
      {phase === "stage-intro" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 cursor-pointer" onClick={skipStageIntro}>
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: stageTheme.accent }}>
              Stage {hud.stage} of {TD_STAGE_COUNT}
            </p>
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{stageName}</h2>
            <p className="text-gray-400 text-sm">{getStageDef(hud.stage).subtitle}</p>
            <p className="text-gray-600 text-xs mt-4">Tap to continue</p>
          </div>
        </div>
      )}

      {/* Stage-clear modal */}
      {phase === "stage-clear" && stageClearInfo && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full text-center rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-2xl font-black text-white mb-4">Stage {hud.stage} Cleared!</h2>
            <div className="space-y-2 text-sm text-left mb-6">
              <div className="flex justify-between text-gray-300">
                <span>🏰 Towers refunded</span>
                <span className="text-white font-bold">+{stageClearInfo.refund}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>🎁 Stage bonus</span>
                <span className="text-white font-bold">+{stageClearInfo.bonus}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>❤️ Lives restored</span>
                <span className="text-white font-bold">+{stageClearInfo.livesRestored}</span>
              </div>
              <div className="flex justify-between pt-2 text-yellow-400 font-bold" style={{ borderTop: "1px solid var(--border)" }}>
                <span>💰 Total gold</span>
                <span>{stageClearInfo.totalGold}</span>
              </div>
            </div>
            <button
              onClick={goToNextStage}
              className="w-full py-3 text-white font-bold rounded-xl transition-transform hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #60a5fa, #2563eb)" }}
            >
              Next Stage →
            </button>
          </div>
        </div>
      )}

      {/* Bottom dock: tower inspector (if selected) or shop, then the question sheet */}
      {phase === "playing" && (
        <div className="relative z-10 flex-shrink-0" style={{ background: "rgba(8,9,28,0.85)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {selectedDef && selectedSnapshot ? (
            <div className="px-3 py-2.5 flex items-center gap-3 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-2xl flex-shrink-0">{selectedDef.icon}</span>
              <div className="min-w-0 flex-shrink-0">
                <p className="text-white text-sm font-bold">{selectedDef.name}</p>
                <p className="text-[10px] text-gray-400">
                  Lv.{selectedSnapshot.level} · {towerDamage(selectedDef, selectedSnapshot.level)} dmg · {(1000 / towerCooldownMs(selectedDef, selectedSnapshot.level)).toFixed(1)}/s ·{" "}
                  {towerRangeTiles(selectedDef, selectedSnapshot.level).toFixed(1)} rng
                </p>
              </div>
              <div className="flex-1" />
              {selectedSnapshot.level < TD_TOWER_MAX_LEVEL ? (
                <button
                  onClick={upgradeSelected}
                  disabled={hud.gold < towerUpgradeCost(selectedDef, selectedSnapshot.level)}
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-transform hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}
                >
                  ⬆️ {towerUpgradeCost(selectedDef, selectedSnapshot.level)}
                </button>
              ) : (
                <span className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30">MAX</span>
              )}
              <button onClick={sellSelected} className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20">
                💰 {towerSellValue(selectedDef, selectedSnapshot.level)}
              </button>
              <button onClick={() => setSelectedTowerId(null)} className="flex-shrink-0 text-gray-500 hover:text-white text-xs px-2">
                ✕
              </button>
            </div>
          ) : (
            <div className="px-3 py-2.5 flex items-center gap-2 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {TOWER_TYPES.map((t) => {
                const colors = RARITY_COLORS[t.tier] ?? RARITY_COLORS.common;
                const affordable = hud.gold >= t.cost;
                const active = placingTypeId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => selectShopTower(t.id)}
                    title={t.tagline}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-2 rounded-xl border-2 transition-all ${colors.border} ${active ? "bg-white/15 scale-105" : "bg-white/5"}`}
                    style={{ opacity: affordable ? 1 : 0.4 }}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <span className={`text-[10px] font-bold ${affordable ? "text-yellow-400" : "text-red-400"}`}>🪙{t.cost}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion && (
            <div className="px-3 py-3">
              <p className="text-white text-sm font-semibold mb-2 line-clamp-2">{currentQuestion.text}</p>
              {currentQuestion.imageUrl && (
                <div className="mb-2 flex justify-center">
                  <div className="bg-white rounded-lg p-2 flex items-center justify-center w-[160px] h-[90px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentQuestion.imageUrl} alt={currentQuestion.text} className="object-contain w-full h-full" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                {currentQuestion.options.map((opt, idx) => {
                  let cls = "bg-white/5 border-white/10 text-gray-300 hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-white";
                  if (revealIdx !== null) {
                    if (idx === currentQuestion.correctIndex) cls = "bg-green-500/20 border-green-500 text-green-300";
                    else if (idx === revealIdx) cls = "bg-red-500/20 border-red-500 text-red-300";
                    else cls = "bg-white/3 border-white/5 text-gray-600";
                  }
                  return (
                    <button
                      key={idx}
                      disabled={revealIdx !== null}
                      onClick={() => answerQuestion(idx)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
