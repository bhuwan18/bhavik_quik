"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { useBoss } from "./BossProvider";
import BossCreature from "./BossCreature";
import BossConfetti from "./BossConfetti";
import BossDetailSheet from "./BossDetailSheet";
import { getBossVariant } from "@/lib/bosses-data";

// Boss battles are visible wherever damage happens: regular quizzes and every
// game mode except DinoRex (which has its own PvP HUD).
const VISIBLE_ROUTES = [/^\/quiz\/[^/]+$/, /^\/game$/];

const LOW_HP_THRESHOLD_PCT = 25;

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function BossOverlay() {
  const pathname = usePathname();
  const { boss, displayHp, phase, lastKill } = useBoss();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [damagePop, setDamagePop] = useState<{ id: number; amount: number } | null>(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [spawning, setSpawning] = useState(false);
  const [poking, setPoking] = useState(false);
  const prevHpRef = useRef(displayHp);
  const prevSlugRef = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();

  const visible = VISIBLE_ROUTES.some((re) => re.test(pathname));

  // Floating damage number whenever a hit lands.
  useEffect(() => {
    if (phase === "hit" && displayHp < prevHpRef.current) {
      const amount = prevHpRef.current - displayHp;
      setDamagePop({ id: Date.now(), amount });
      const t = setTimeout(() => setDamagePop(null), 900);
      return () => clearTimeout(t);
    }
  }, [phase, displayHp]);

  useEffect(() => {
    prevHpRef.current = displayHp;
  }, [displayHp]);

  // Confetti only for a kill landed by this player, in a live overlay moment —
  // not for the "community defeated it elsewhere" case, which surfaces on the results screen instead.
  useEffect(() => {
    if (lastKill?.youLandedFinalBlow) {
      // Reacting to a context value changing, not deriving state at render time.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfettiActive(true);
    }
  }, [lastKill]);

  const variant = useMemo(() => (boss ? getBossVariant(boss.slug) : "round"), [boss]);

  // Pop-in whenever a new boss shows up: first load, or the active boss changed underneath us.
  // boss.slug is compared against the previous render (not just truthiness) since refresh()
  // polling replaces the whole `boss` object every 30s even when it's the same boss.
  useEffect(() => {
    if (!boss) return;
    const changed = prevSlugRef.current !== boss.slug;
    prevSlugRef.current = boss.slug;
    if (!changed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- entrance animation reacting to a context value changing
    setSpawning(true);
    const t = setTimeout(() => setSpawning(false), 700);
    return () => clearTimeout(t);
  }, [boss]);

  if (!visible || !boss) return null;

  const pct = Math.max(0, Math.min(100, (displayHp / boss.maxHp) * 100));
  const isDead = phase === "dead";
  const isLowHp = !isDead && pct <= LOW_HP_THRESHOLD_PCT;

  const handleTap = () => {
    setPoking(true);
    setTimeout(() => setPoking(false), 260);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="fixed right-2 top-20 md:right-6 md:top-24 z-30 select-none flex flex-col items-center">
        <button
          onClick={handleTap}
          aria-label={`Boss: ${boss.name}, ${Math.round(pct)}% HP remaining. Tap for details.`}
          className="relative flex flex-col items-center focus:outline-none"
        >
          {phase === "taunt" && !isDead && (
            <div
              className="absolute -top-8 right-2 max-w-[150px] px-3 py-1.5 rounded-xl rounded-br-sm text-xs font-semibold text-white shadow-lg z-10"
              style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {boss.taunt}
            </div>
          )}

          {damagePop && (
            <span
              key={damagePop.id}
              className="damage-float absolute top-6 right-4 text-xl font-extrabold text-red-400 pointer-events-none z-10"
              style={{ textShadow: "0 0 10px rgba(239,68,68,0.9)" }}
            >
              -{damagePop.amount}
            </span>
          )}

          {/* Floating transparent character — no badge/circle behind it */}
          <div
            className={[!reduceMotion && spawning ? "creature-spawn-anim" : "", !reduceMotion && poking ? "creature-poke-anim" : ""].join(" ")}
            style={{
              filter: isDead
                ? "grayscale(1) drop-shadow(0 8px 10px rgba(0,0,0,0.4))"
                : `drop-shadow(0 0 14px ${hexToRgba(boss.colorFrom, 0.55)}) drop-shadow(0 8px 10px rgba(0,0,0,0.35))`,
              transition: "filter 0.5s ease",
            }}
          >
            <BossCreature colorFrom={boss.colorFrom} colorTo={boss.colorTo} variant={variant} phase={phase} lowHp={isLowHp} size={132} />
          </div>

          <span className="text-xs font-bold text-white mt-1 drop-shadow-md max-w-[110px] truncate">{boss.name}</span>

          <div
            className={["w-24 h-2.5 rounded-full bg-white/15 overflow-hidden relative mt-1", !reduceMotion && isLowHp ? "boss-lowhp-pulse" : ""].join(" ")}
          >
            <div
              className="h-full rounded-full relative overflow-hidden transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: isLowHp
                  ? "linear-gradient(90deg, #dc2626, #f87171)"
                  : "linear-gradient(90deg, #ef4444, #f97316)",
              }}
            >
              {!reduceMotion && (
                <span
                  className="boss-hp-shimmer absolute inset-y-0 left-0 w-1/3"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
                />
              )}
            </div>
          </div>
          <span className="text-[10px] text-gray-300 font-semibold tabular-nums">
            {Math.max(0, displayHp)} / {boss.maxHp}
          </span>
        </button>
      </div>

      {/* Note: lastKill itself is NOT cleared here — the results screen reads it to render
          a persistent "Boss Defeated" panel, and is responsible for clearing it when the
          player leaves that screen. This burst is just the transient overlay flourish. */}
      <BossConfetti active={confettiActive} onDone={() => setConfettiActive(false)} />

      <BossDetailSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
