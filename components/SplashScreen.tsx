"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { getISTDateString } from "@/lib/time";
import { getTodaysFestival } from "@/lib/festivals";
import { PACKS_DATA } from "@/lib/packs-data";
import { getActivePromotions, type Promotion } from "@/lib/promotions";
import { PRO_AMOUNT_INR, MAX_AMOUNT_INR } from "@/lib/game-config";

const SPLASH_KEY = "bq_splash_date";
const DURATION_S = 5;

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DURATION_S);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Computed once on mount — safe for SSR because visible starts false
  const [offers] = useState(() => {
    const promos = getActivePromotions();
    const festival = getTodaysFestival();
    const festivalPack = festival
      ? PACKS_DATA.find((p) => p.slug === festival.packSlug) ?? null
      : null;
    return { promos, festival, festivalPack };
  });

  useEffect(() => {
    const today = getISTDateString(new Date());
    const last = localStorage.getItem(SPLASH_KEY);
    if (last === today) return; // already shown today
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      dismiss();
    }, DURATION_S * 1000);

    return () => {
      clearTimeout(timerRef.current!);
      clearInterval(intervalRef.current!);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    clearTimeout(timerRef.current!);
    clearInterval(intervalRef.current!);
    const today = getISTDateString(new Date());
    localStorage.setItem(SPLASH_KEY, today);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "var(--background)" }}
        >
          {/* Radial glow behind card */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(139,92,246,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Skip button */}
          <button
            onClick={dismiss}
            className="absolute top-5 right-5 text-sm px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
          >
            Skip
          </button>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm flex flex-col gap-4"
          >
            {/* Branding */}
            <div className="text-center">
              <div className="text-6xl mb-3 select-none">⚡</div>
              <h1
                className="text-4xl font-bold text-white"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                BittsQuiz {new Date().getFullYear()}
              </h1>
              <p className="mt-1 text-sm text-white/50 tracking-widest uppercase">
                Quiz · Collect · Compete
              </p>
            </div>

            {/* Offer cards */}
            <div className="flex flex-col gap-2.5 mt-1">
              {/* Active promotions */}
              {offers.promos.map((promo: Promotion) => (
                <Link key={promo.id} href={promo.link} onClick={dismiss}>
                  <div
                    className={`relative overflow-hidden rounded-xl p-3.5 bg-gradient-to-br ${promo.colorFrom} ${promo.colorTo} cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    <span className="absolute top-2.5 right-2.5 text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                      {promo.badge}
                    </span>
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl">{promo.icon}</span>
                      <div>
                        <p className="font-semibold text-white text-sm leading-tight">
                          {promo.title}
                        </p>
                        <p className="text-white/80 text-xs mt-0.5 leading-snug">
                          {promo.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Festival pack */}
              {offers.festival && (
                <Link href="/marketplace" onClick={dismiss}>
                  <div
                    className="relative overflow-hidden rounded-xl p-3.5 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      background: offers.festivalPack
                        ? `linear-gradient(135deg, ${offers.festivalPack.colorFrom}, ${offers.festivalPack.colorTo})`
                        : "linear-gradient(135deg, #7c3aed, #db2777)",
                    }}
                  >
                    <span className="absolute top-2.5 right-2.5 text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                      TODAY ONLY
                    </span>
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl">{offers.festival.icon}</span>
                      <div>
                        <p className="font-semibold text-white text-sm leading-tight">
                          {offers.festival.name}
                        </p>
                        <p className="text-white/80 text-xs mt-0.5 leading-snug">
                          Festival pack available in Marketplace today
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Pro / Max pitch — always shown */}
              <Link href="/shop" onClick={dismiss}>
                <div className="rounded-xl p-3.5 bg-gradient-to-br from-violet-600/30 to-amber-500/20 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl">👑</span>
                    <div>
                      <p className="font-semibold text-white text-sm leading-tight">
                        Earn up to 2× coins with Max
                      </p>
                      <p className="text-white/60 text-xs mt-0.5">
                        Pro ₹{PRO_AMOUNT_INR}/mo · Max ₹{MAX_AMOUNT_INR}/mo
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Countdown progress bar */}
            <div className="mt-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-white/30">
                  Opening in {secondsLeft}s…
                </span>
                <button
                  onClick={dismiss}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Enter now
                </button>
              </div>
              <div className="h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-violet-400/60 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: DURATION_S, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
