"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameLoop } from "./use-game-loop";
import { useQuizRun, type RunQuestion } from "./use-quiz-run";
import CategoryPicker from "./CategoryPicker";
import { useBoss } from "@/components/boss/BossProvider";
import { createWorld, stepWorld, drawWorld, type World, type InputState } from "./monster-hunter-engine";
import { aggregatePerks, aggregateAbilities, getAbilityBadges, rollPerkChoices, BASE_RUN_STATS, BASE_ABILITY_STATE, type RunStats, type AbilityState } from "@/lib/perk-roll";
import type { PerkDef } from "@/lib/perks-data";
import { pickNextQuestion } from "@/lib/question-picker";
import { RARITY_COLORS } from "@/lib/utils";
import { GAME_DAMAGE_PER_CORRECT, MH_HUD_SYNC_MS, MH_STICK_RADIUS_PX, MH_MAX_DPR, MH_PERK_CHOICE_COUNT } from "@/lib/game-config";

type Phase = "intro" | "playing" | "question" | "perk" | "done";
type Outcome = "victory" | "defeat" | null;

type Hud = {
  hp: number;
  maxHp: number;
  level: number;
  stage: number;
  xp: number;
  xpToNext: number;
  kills: number;
  gems: number;
  exitAngle: number | null; // world-space heading from player to the exit — compass
};

export default function MonsterHunterGame({ onBack }: { onBack: () => void }) {
  const boss = useBoss();
  const run = useQuizRun();

  const [phase, setPhase] = useState<Phase>("intro");
  const [category, setCategory] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [hud, setHud] = useState<Hud>({ hp: 0, maxHp: 0, level: 1, stage: 1, xp: 0, xpToNext: 1, kills: 0, gems: 0, exitAngle: null });
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [perkChoices, setPerkChoices] = useState<PerkDef[]>([]);
  const [ownedPerks, setOwnedPerks] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<RunQuestion | null>(null);
  const askedIdsRef = useRef<Set<string>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [finalCoins, setFinalCoins] = useState<number | null>(null);
  const [stageBanner, setStageBanner] = useState<number | null>(null);
  const stageBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const statsRef = useRef<RunStats>(BASE_RUN_STATS);
  const abilitiesRef = useRef<AbilityState>(BASE_ABILITY_STATE);
  const inputRef = useRef<InputState>({ moveX: 0, moveY: 0, aimAngle: null });
  const heldKeysRef = useRef<Set<string>>(new Set());
  const mouseAngleRef = useRef<number | null>(null);
  const moveTouchRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const aimTouchRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [moveStickUI, setMoveStickUI] = useState<{ cx: number; cy: number; dx: number; dy: number } | null>(null);
  const [aimStickUI, setAimStickUI] = useState<{ cx: number; cy: number; dx: number; dy: number } | null>(null);
  const submittedRef = useRef(false);
  const haltedRef = useRef(false);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    return () => {
      if (stageBannerTimeoutRef.current) clearTimeout(stageBannerTimeoutRef.current);
    };
  }, []);

  // ── Desktop input: keyboard ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      heldKeysRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => heldKeysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      heldKeysRef.current.clear();
    };
  }, [phase]);

  // ── Desktop input: mouse aim ───────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || phase !== "playing") return;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseAngleRef.current = Math.atan2(e.clientY - cy, e.clientX - cx);
    };
    canvas.addEventListener("mousemove", onMove);
    return () => canvas.removeEventListener("mousemove", onMove);
  }, [phase]);

  // ── Touch input: dual virtual joysticks (left = move, right = aim) ────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || phase !== "playing") return;

    const onTouchStart = (e: TouchEvent) => {
      const rect = el.getBoundingClientRect();
      for (const t of Array.from(e.changedTouches)) {
        const localX = t.clientX - rect.left;
        const localY = t.clientY - rect.top;
        const isLeft = localX < rect.width / 2;
        if (isLeft && !moveTouchRef.current) {
          moveTouchRef.current = { id: t.identifier, ox: t.clientX, oy: t.clientY };
          setMoveStickUI({ cx: localX, cy: localY, dx: 0, dy: 0 });
        } else if (!isLeft && !aimTouchRef.current) {
          aimTouchRef.current = { id: t.identifier, ox: t.clientX, oy: t.clientY };
          setAimStickUI({ cx: localX, cy: localY, dx: 0, dy: 0 });
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        if (moveTouchRef.current && t.identifier === moveTouchRef.current.id) {
          const dx = t.clientX - moveTouchRef.current.ox;
          const dy = t.clientY - moveTouchRef.current.oy;
          const dist = Math.min(MH_STICK_RADIUS_PX, Math.hypot(dx, dy));
          const angle = Math.atan2(dy, dx);
          const nx = dist > 4 ? (Math.cos(angle) * dist) / MH_STICK_RADIUS_PX : 0;
          const ny = dist > 4 ? (Math.sin(angle) * dist) / MH_STICK_RADIUS_PX : 0;
          inputRef.current.moveX = nx;
          inputRef.current.moveY = ny;
          setMoveStickUI((prev) => (prev ? { ...prev, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist } : prev));
        } else if (aimTouchRef.current && t.identifier === aimTouchRef.current.id) {
          const dx = t.clientX - aimTouchRef.current.ox;
          const dy = t.clientY - aimTouchRef.current.oy;
          const dist = Math.min(MH_STICK_RADIUS_PX, Math.hypot(dx, dy));
          const angle = Math.atan2(dy, dx);
          if (dist > 4) mouseAngleRef.current = angle;
          setAimStickUI((prev) => (prev ? { ...prev, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist } : prev));
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (moveTouchRef.current && t.identifier === moveTouchRef.current.id) {
          moveTouchRef.current = null;
          inputRef.current.moveX = 0;
          inputRef.current.moveY = 0;
          setMoveStickUI(null);
        }
        if (aimTouchRef.current && t.identifier === aimTouchRef.current.id) {
          aimTouchRef.current = null;
          setAimStickUI(null);
        }
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      moveTouchRef.current = null;
      aimTouchRef.current = null;
      setMoveStickUI(null);
      setAimStickUI(null);
    };
  }, [phase]);

  // ── Canvas sizing (container resize + DPR) ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || phase !== "playing") return;
    const resize = () => {
      const dpr = Math.min(MH_MAX_DPR, window.devicePixelRatio || 1);
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [phase]);

  // ── HUD sync (throttled — the only bridge from the 60Hz world into React state) ──
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      const w = worldRef.current;
      if (!w) return;
      setHud({
        hp: Math.max(0, Math.round(w.player.hp)),
        maxHp: statsRef.current.maxHp,
        level: w.level,
        stage: w.stage,
        xp: Math.round(w.xp),
        xpToNext: w.xpToNext,
        kills: w.kills,
        gems: w.gemsCollected,
        exitAngle: Math.atan2(w.exitPos.y - w.player.pos.y, w.exitPos.x - w.player.pos.x),
      });
    }, MH_HUD_SYNC_MS);
    return () => clearInterval(interval);
  }, [phase]);

  const applyPerk = useCallback((id: string) => {
    setOwnedPerks((prev) => {
      const next = [...prev, id];
      const prevMaxHp = statsRef.current.maxHp;
      const newStats = aggregatePerks(next);
      statsRef.current = newStats;
      abilitiesRef.current = aggregateAbilities(next);
      if (worldRef.current) {
        const hpDelta = Math.max(0, newStats.maxHp - prevMaxHp);
        worldRef.current.player.hp = Math.min(newStats.maxHp, worldRef.current.player.hp + hpDelta);
      }
      return next;
    });
  }, []);

  const endRun = useCallback(
    async (result: Outcome) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setOutcome(result);
      setRunning(false);
      setPhase("done");
      const submitResult = await run.submit();
      setFinalCoins(submitResult?.coinsEarned ?? 0);
    },
    [run]
  );

  const step = useCallback(
    (dt: number) => {
      const w = worldRef.current;
      if (!w || haltedRef.current) return;

      if (!moveTouchRef.current) {
        const keys = heldKeysRef.current;
        let mx = 0;
        let my = 0;
        if (keys.has("w") || keys.has("arrowup")) my -= 1;
        if (keys.has("s") || keys.has("arrowdown")) my += 1;
        if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
        if (keys.has("d") || keys.has("arrowright")) mx += 1;
        inputRef.current.moveX = mx;
        inputRef.current.moveY = my;
      }
      inputRef.current.aimAngle = mouseAngleRef.current;

      const events = stepWorld(w, dt, inputRef.current, statsRef.current, abilitiesRef.current);

      if (events.died) {
        haltedRef.current = true;
        endRun("defeat");
        return;
      }

      if (events.wonMaze) {
        haltedRef.current = true;
        endRun("victory");
        return;
      }

      if (events.stagedUp) {
        setStageBanner(w.stage);
        if (stageBannerTimeoutRef.current) clearTimeout(stageBannerTimeoutRef.current);
        stageBannerTimeoutRef.current = setTimeout(() => setStageBanner(null), 2600);
      }

      if (events.leveledUp) {
        haltedRef.current = true;
        const next = pickNextQuestion(run.questions, askedIdsRef.current, w.level);
        if (next) {
          setCurrentQuestion(next);
          setPhase("question");
        } else {
          // Defensive only — useQuizRun.load() already rejects quizzes with zero
          // questions, so pickNextQuestion should never return null here in practice.
          const grant = rollPerkChoices(ownedPerks, 1)[0];
          if (grant) applyPerk(grant.id);
          haltedRef.current = false;
        }
      }
    },
    [run.questions, ownedPerks, applyPerk, endRun]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const w = worldRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !container || !w || !ctx) return;
    drawWorld(ctx, w, container.clientWidth, container.clientHeight, abilitiesRef.current);
  }, []);

  useGameLoop(step, draw, running && phase === "playing");

  const startRun = async () => {
    const questions = await run.load(category);
    if (!questions) return;
    submittedRef.current = false;
    haltedRef.current = false;
    setOwnedPerks([]);
    askedIdsRef.current = new Set();
    setCurrentQuestion(null);
    setFinalCoins(null);
    setOutcome(null);
    if (stageBannerTimeoutRef.current) clearTimeout(stageBannerTimeoutRef.current);
    setStageBanner(null);
    statsRef.current = BASE_RUN_STATS;
    abilitiesRef.current = BASE_ABILITY_STATE;
    worldRef.current = createWorld(BASE_RUN_STATS);
    setPhase("playing");
    setRunning(true);
  };

  const answerQuestion = (idx: number) => {
    const q = currentQuestion;
    if (!q) return;
    run.recordAnswer(q.id, idx);
    askedIdsRef.current.add(q.id);
    const correct = idx === q.correctIndex;

    if (correct) {
      boss.registerHit(GAME_DAMAGE_PER_CORRECT);
      setPerkChoices(rollPerkChoices(ownedPerks, MH_PERK_CHOICE_COUNT));
      setCurrentQuestion(null);
      setPhase("perk");
    } else {
      // Wrong answer doesn't end the level-up gate — keep offering fresh questions
      // (never repeating one already asked this run, while it can be avoided) until
      // the player actually earns the perk.
      boss.registerMiss();
      const next = pickNextQuestion(run.questions, askedIdsRef.current, worldRef.current?.level ?? 1);
      setCurrentQuestion(next);
    }
  };

  const pickPerk = (perk: PerkDef) => {
    applyPerk(perk.id);
    setPerkChoices([]);
    haltedRef.current = false;
    setPhase("playing");
    setRunning(true);
  };

  // ── Intro ───────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const instructions = [
      { icon: "🕹️", text: "Desktop: WASD/arrows to move, mouse to aim — lasers auto-fire" },
      { icon: "📱", text: "Mobile: left thumb moves, right thumb aims" },
      { icon: "🧭", text: "Follow the compass to the exit on the far side of the maze — that's the win" },
      { icon: "💎", text: "Kill monsters for gems, level up for a quiz question — answer until you get one right for a perk" },
      { icon: "📈", text: "Every 10 levels starts a new stage — tougher, faster monsters, and new threats join the hunt" },
      { icon: "🛰️", text: "Some perks unlock whole new abilities — an auto-firing turret, a shield, an AoE pulse — with their own upgrade perks" },
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
              background: "radial-gradient(circle at 35% 30%, #34d399, #059669 55%, #064e3b 100%)",
              boxShadow: "0 0 40px 8px rgba(16,185,129,0.35), inset 0 2px 4px rgba(255,255,255,0.25)",
            }}
          >
            🐛
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
            Monster <span className="text-emerald-400">Hunter</span>
          </h1>
          <p className="text-gray-400 mb-6">
            Fight your way through a dark maze to the exit on the far side. Monsters chase you —
            you can&apos;t see past a wall. Collect gems to level up and earn rarity-tiered perks along the way.
          </p>
          <div className="rounded-2xl p-5 mb-6 text-left space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {instructions.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-base">
                  {item.icon}
                </span>
                <span className="text-sm text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>
          {reducedMotion && (
            <p className="text-xs text-gray-500 mb-4">Reduced motion is on — screen shake and particle effects are disabled.</p>
          )}
          <CategoryPicker selected={category} onSelect={setCategory} />
          {run.loadError && (
            <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{run.loadError}</p>
          )}
          <button
            onClick={startRun}
            disabled={run.loading}
            className="w-full py-4 text-white font-bold text-lg rounded-2xl transition-all duration-200 disabled:opacity-50 hover:scale-[1.015] active:scale-[0.98] shadow-xl"
            style={{
              background: "linear-gradient(135deg, #34d399, #059669)",
              boxShadow: "0 8px 24px -6px rgba(16,185,129,0.5)",
            }}
          >
            {run.loading ? "Loading..." : "Start Hunting! 🐛"}
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
          {victory ? "🏆" : "💀"}
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
          {victory ? "You Escaped the Maze!" : "Run Over!"}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            Lv.<span className="text-white font-bold">{hud.level}</span>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-sm text-gray-300">
            Stage <span className="text-purple-300 font-bold">{hud.stage}</span>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            💀 <span className="text-white font-bold">{hud.kills}</span> kills
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
            💎 <span className="text-white font-bold">{hud.gems}</span> gems
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
            style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}
          >
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  // ── Playing / Question / Perk ────────────────────────────────────────────────
  const xpPct = hud.xpToNext > 0 ? Math.min(100, (hud.xp / hud.xpToNext) * 100) : 0;
  const hpPct = hud.maxHp > 0 ? Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100)) : 0;
  const abilityBadges = getAbilityBadges(ownedPerks);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 top-0 bottom-16 md:bottom-0 z-20 bg-black"
      style={{ touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Stage-up callout — the explicit "things just got harder" signal, since the HUD's
          Stage badge alone updates too quietly to register as progression in the moment. */}
      {stageBanner !== null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div
            className="px-5 py-2.5 rounded-2xl backdrop-blur-md flex items-center gap-2 text-sm font-bold text-white whitespace-nowrap"
            style={{
              background: "rgba(88,28,135,0.88)",
              border: "1px solid rgba(216,180,254,0.55)",
              boxShadow: "0 8px 28px -6px rgba(147,51,234,0.7)",
            }}
          >
            <span className="text-lg">⚔️</span> Stage {stageBanner} — stronger monsters incoming
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
        <div
          className="rounded-2xl px-3.5 py-3 space-y-2 min-w-[160px] backdrop-blur-md"
          style={{ background: "rgba(8,9,28,0.72)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)" }}
        >
          <div className="flex items-center justify-between text-xs text-white font-bold">
            <span className="flex items-center gap-1">❤️ {hud.hp}/{hud.maxHp}</span>
            <span className="flex items-center gap-1.5">
              <span className="text-cyan-300">Lv.{hud.level}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300">
                Stage {hud.stage}
              </span>
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full relative overflow-hidden transition-all duration-300"
              style={{ width: `${hpPct}%`, background: "linear-gradient(90deg, #dc2626, #f87171)" }}
            >
              <span className="boss-hp-shimmer absolute inset-y-0 left-0 w-1/3" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full relative overflow-hidden transition-all duration-300"
              style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, #0891b2, #22d3ee)" }}
            >
              <span className="boss-hp-shimmer absolute inset-y-0 left-0 w-1/3" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
            <span>💀 {hud.kills}</span>
            <span>💎 {hud.gems}</span>
          </div>
          {hud.exitAngle !== null && (
            <div className="flex items-center gap-2 pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-transform duration-300" style={{ transform: `rotate(${hud.exitAngle}rad)` }}>
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    borderLeft: "9px solid #4ade80",
                    filter: "drop-shadow(0 0 3px rgba(74,222,128,0.8))",
                  }}
                />
              </div>
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wide">Exit this way</span>
            </div>
          )}
          {abilityBadges.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1.5 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {abilityBadges.map((badge) => (
                <div
                  key={badge.id}
                  title={`${badge.name} — Tier ${badge.tier}`}
                  className="relative flex items-center justify-center w-7 h-7 rounded-full text-sm"
                  style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.45)", boxShadow: "0 0 8px rgba(168,85,247,0.35)" }}
                >
                  {badge.icon}
                  {badge.tier > 1 && (
                    <span
                      className="absolute -bottom-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: "#a855f7", border: "1px solid rgba(0,0,0,0.4)" }}
                    >
                      {badge.tier}
                    </span>
                  )}
                </div>
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

      {/* Idle joystick affordance — shown on any touch-capable device (not gated by viewport
          width, so iPad-sized touchscreens still see it) whenever that stick isn't in use. */}
      {isTouchDevice && !moveStickUI && (
        <div
          className="absolute bottom-8 left-8 w-28 h-28 rounded-full flex items-center justify-center pointer-events-none"
          style={{ border: "2px solid rgba(255,255,255,0.15)", background: "radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%)" }}
        >
          <div className="w-11 h-11 rounded-full" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)" }} />
          <span className="absolute -bottom-5 text-[10px] text-white/40 font-semibold tracking-wide">MOVE</span>
        </div>
      )}
      {isTouchDevice && !aimStickUI && (
        <div
          className="absolute bottom-8 right-8 w-28 h-28 rounded-full flex items-center justify-center pointer-events-none"
          style={{ border: "2px solid rgba(255,255,255,0.15)", background: "radial-gradient(circle, rgba(255,255,255,0.05), transparent 70%)" }}
        >
          <div className="w-11 h-11 rounded-full" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)" }} />
          <span className="absolute -bottom-5 text-[10px] text-white/40 font-semibold tracking-wide">AIM</span>
        </div>
      )}

      {/* Live joystick — base appears at the finger's touchdown point, knob tracks the drag. */}
      {moveStickUI && (
        <div
          className="absolute rounded-full pointer-events-none w-28 h-28"
          style={{
            left: moveStickUI.cx,
            top: moveStickUI.cy,
            transform: "translate(-50%, -50%)",
            border: "2px solid rgba(52,211,153,0.4)",
            background: "radial-gradient(circle, rgba(52,211,153,0.08), transparent 70%)",
          }}
        >
          <div
            className="absolute w-12 h-12 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${moveStickUI.dx}px), calc(-50% + ${moveStickUI.dy}px))`,
              background: "radial-gradient(circle at 35% 30%, #6ee7b7, #059669)",
              boxShadow: "0 0 14px 2px rgba(16,185,129,0.5)",
            }}
          />
        </div>
      )}
      {aimStickUI && (
        <div
          className="absolute rounded-full pointer-events-none w-28 h-28"
          style={{
            left: aimStickUI.cx,
            top: aimStickUI.cy,
            transform: "translate(-50%, -50%)",
            border: "2px solid rgba(96,165,250,0.4)",
            background: "radial-gradient(circle, rgba(96,165,250,0.08), transparent 70%)",
          }}
        >
          <div
            className="absolute w-12 h-12 rounded-full"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${aimStickUI.dx}px), calc(-50% + ${aimStickUI.dy}px))`,
              background: "radial-gradient(circle at 35% 30%, #bfdbfe, #2563eb)",
              boxShadow: "0 0 14px 2px rgba(59,130,246,0.5)",
            }}
          />
        </div>
      )}

      {phase === "question" && currentQuestion && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div key={currentQuestion.id} className="max-w-md w-full max-h-full overflow-y-auto">
            <div className="text-center mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.35)", color: "#22d3ee" }}
              >
                ⬆️ Level Up! Answer to unlock a perk
              </span>
            </div>
            <div className="rounded-2xl p-6 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {currentQuestion.imageUrl && (
                <div className="mb-5 flex justify-center">
                  <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center justify-center w-[240px] h-[160px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentQuestion.imageUrl} alt={currentQuestion.text} className="object-contain w-full h-full" />
                  </div>
                </div>
              )}
              <p className="text-lg font-semibold text-white">{currentQuestion.text}</p>
            </div>
            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => answerQuestion(idx)}
                  className="w-full text-left px-4 py-3 border rounded-xl transition-all text-sm font-medium bg-white/5 border-white/10 text-gray-300 hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:text-white"
                >
                  <span className="text-gray-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "perk" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="max-w-md w-full text-center">
            <p className="text-cyan-300 text-sm font-bold uppercase tracking-wide mb-4">✨ Choose a perk</p>
            <div className="space-y-3">
              {perkChoices.map((perk) => {
                const colors = RARITY_COLORS[perk.rarity] ?? RARITY_COLORS.common;
                const flair = perk.rarity === "legendary" ? "legendary-card" : perk.rarity === "impossible" ? "rainbow-card" : "";
                return (
                  <button
                    key={perk.id}
                    onClick={() => pickPerk(perk)}
                    className={`w-full text-left px-4 py-3.5 border-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.99] ${colors.border} ${colors.glow} ${flair}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                      >
                        {perk.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-bold ${colors.text}`}>{perk.name}</p>
                          <span className={`text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full border ${colors.border} ${colors.text}`}>
                            {colors.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{perk.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
