"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { BOSS_POLL_INTERVAL_MS, BOSS_HIT_ANIM_MS, BOSS_TAUNT_ANIM_MS } from "@/lib/game-config";

export type BossPublic = {
  slug: string;
  name: string;
  icon: string;
  description: string;
  taunt: string;
  colorFrom: string;
  colorTo: string;
  currentHp: number;
  maxHp: number;
  expiresAt: string;
  status: string;
} | null;

export type BossContributor = { userId: string; name: string; image: string | null; damage: number };

export type AttemptBossResult = {
  damageDealt: number;
  currentHp: number;
  maxHp: number;
  defeated: boolean;
  gemsEarned: number;
} | null;

export type BossKillInfo = {
  bossName: string;
  bossIcon: string;
  gemsEarned: number;
  youLandedFinalBlow: boolean;
} | null;

type BossPhase = "idle" | "hit" | "taunt" | "dead";

type BossContextValue = {
  boss: BossPublic;
  displayHp: number;
  phase: BossPhase;
  yourGems: number;
  yourDamage: number;
  topContributors: BossContributor[];
  registerHit: (amount: number) => void;
  registerMiss: () => void;
  reconcileAttempt: (result: AttemptBossResult) => void;
  lastKill: BossKillInfo;
  clearLastKill: () => void;
  refresh: () => void;
};

const BossContext = createContext<BossContextValue | null>(null);

export function useBoss() {
  const ctx = useContext(BossContext);
  if (!ctx) throw new Error("useBoss must be used within BossProvider");
  return ctx;
}

export function BossProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [boss, setBoss] = useState<BossPublic>(null);
  const [serverHp, setServerHp] = useState(0);
  const [pendingDamage, setPendingDamage] = useState(0);
  const [phase, setPhase] = useState<BossPhase>("idle");
  const [yourGems, setYourGems] = useState(0);
  const [yourDamage, setYourDamage] = useState(0);
  const [topContributors, setTopContributors] = useState<BossContributor[]>([]);
  const [lastKill, setLastKill] = useState<BossKillInfo>(null);

  const bossRef = useRef<BossPublic>(null);
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/boss");
      if (!res.ok) return;
      const data = await res.json();
      if (data.boss) {
        setBoss(data.boss);
        bossRef.current = data.boss;
        setServerHp(data.boss.currentHp);
        setPendingDamage(0);
        setYourGems(data.yourGems ?? 0);
        setYourDamage(data.yourContribution?.damage ?? 0);
        setTopContributors(data.topContributors ?? []);
      } else {
        setBoss(null);
        bossRef.current = null;
      }
    } catch {
      // network hiccup — overlay just stays on its last known state
    }
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    // refresh() is an async fetch; its setState calls run after the network response,
    // not synchronously in this effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(() => {
      if (!document.hidden) refresh();
    }, BOSS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session, refresh]);

  const setTransientPhase = useCallback((next: BossPhase, ms: number) => {
    setPhase(next);
    if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    phaseTimeoutRef.current = setTimeout(() => setPhase("idle"), ms);
  }, []);

  const registerHit = useCallback(
    (amount: number) => {
      if (!bossRef.current || amount <= 0) return;
      setPendingDamage((p) => p + amount);
      setYourDamage((d) => d + amount);
      setTransientPhase("hit", BOSS_HIT_ANIM_MS);
    },
    [setTransientPhase]
  );

  const registerMiss = useCallback(() => {
    if (!bossRef.current) return;
    setTransientPhase("taunt", BOSS_TAUNT_ANIM_MS);
  }, [setTransientPhase]);

  const reconcileAttempt = useCallback(
    (result: AttemptBossResult) => {
      const previousBoss = bossRef.current;

      if (!result) {
        // No damage dealt this attempt (feature off, or 0 correct answers) — still
        // refresh in case another player's damage moved HP while we were playing.
        refresh();
        return;
      }

      if (result.defeated) {
        setLastKill({
          bossName: previousBoss?.name ?? "The boss",
          bossIcon: previousBoss?.icon ?? "⚔️",
          gemsEarned: result.gemsEarned,
          youLandedFinalBlow: true,
        });
        if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
        setPhase("dead");
        setServerHp(0);
        setPendingDamage(0);
        // Hold the dead boss's identity on screen briefly so the death animation
        // and confetti have something to play over, before it flips to whatever's next.
        setTimeout(() => refresh(), 2000);
        return;
      }

      setServerHp(result.currentHp);
      setPendingDamage(0);

      // Re-sync full boss identity. If it changed underneath us without us landing
      // the kill, the community finished off the previous boss while we were playing.
      refresh().then(() => {
        if (previousBoss && bossRef.current && bossRef.current.slug !== previousBoss.slug) {
          setLastKill({
            bossName: previousBoss.name,
            bossIcon: previousBoss.icon,
            gemsEarned: 0,
            youLandedFinalBlow: false,
          });
        }
      });
    },
    [refresh]
  );

  const clearLastKill = useCallback(() => setLastKill(null), []);

  const displayHp = boss ? Math.max(0, serverHp - pendingDamage) : 0;

  const value: BossContextValue = {
    boss,
    displayHp,
    phase,
    yourGems,
    yourDamage,
    topContributors,
    registerHit,
    registerMiss,
    reconcileAttempt,
    lastKill,
    clearLastKill,
    refresh,
  };

  return <BossContext.Provider value={value}>{children}</BossContext.Provider>;
}
