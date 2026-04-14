"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { getISTDateString } from "@/lib/time";
import { PRO_AMOUNT_INR, MAX_AMOUNT_INR } from "@/lib/game-config";

const SPLASH_KEY = "bq_splash_date";
const DURATION_S = 10;

export type SplashPromo = {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  colorFrom: string;
  colorTo: string;
};

export type SplashFestival = {
  name: string;
  icon: string;
  packColor?: { from: string; to: string };
};


export default function SplashScreenClient({
  promos,
  festival,
}: {
  promos: SplashPromo[];
  festival: SplashFestival | null;
}) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const today = getISTDateString(new Date());
    return localStorage.getItem(SPLASH_KEY) !== today;
  });
  const [secondsLeft, setSecondsLeft] = useState(DURATION_S);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function dismiss() {
    clearTimeout(timerRef.current!);
    clearInterval(intervalRef.current!);
    const today = getISTDateString(new Date());
    localStorage.setItem(SPLASH_KEY, today);
    setVisible(false);
  }

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
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-5 md:p-10"
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
            className="absolute top-5 right-5 text-sm md:text-base px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/70 hover:text-white"
          >
            Skip
          </button>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md md:max-w-xl flex flex-col gap-5 md:gap-7 overflow-y-auto max-h-[calc(100dvh-3rem)]"
          >
            {/* Branding */}
            <div className="text-center pt-2">
              <div className="text-7xl md:text-8xl mb-3 md:mb-4 select-none">⚡</div>
              <h1
                className="text-5xl md:text-6xl font-bold text-white"
                style={{ fontFamily: "var(--font-grotesk)" }}
              >
                BittsQuiz {new Date().getFullYear()}
              </h1>
              <p className="mt-2 text-sm md:text-base text-white/50 tracking-widest uppercase">
                Quiz · Collect · Compete
              </p>
            </div>

            {/* Offer cards */}
            <div className="flex flex-col gap-3 md:gap-3.5">
              {/* Active promotions from admin */}
              {promos.map((promo) => (
                <Link key={promo.id} href={promo.link} onClick={dismiss}>
                  <div
                    className={`relative overflow-hidden rounded-2xl p-4 md:p-5 bg-gradient-to-br ${promo.colorFrom} ${promo.colorTo} cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all`}
                  >
                    <span className="absolute top-3 right-3 text-xs md:text-sm font-bold bg-white/25 text-white px-2.5 py-0.5 rounded-full">
                      {promo.badge}
                    </span>
                    <div className="flex items-start gap-3 md:gap-4">
                      <span className="text-3xl md:text-4xl">{promo.icon}</span>
                      <div>
                        <p className="font-semibold text-white text-base md:text-lg leading-tight">
                          {promo.title}
                        </p>
                        <p className="text-white/80 text-sm md:text-base mt-1 leading-snug">
                          {promo.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Festival pack */}
              {festival && (
                <Link href="/marketplace" onClick={dismiss}>
                  <div
                    className="relative overflow-hidden rounded-2xl p-4 md:p-5 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{
                      background: festival.packColor
                        ? `linear-gradient(135deg, ${festival.packColor.from}, ${festival.packColor.to})`
                        : "linear-gradient(135deg, #7c3aed, #db2777)",
                    }}
                  >
                    <span className="absolute top-3 right-3 text-xs md:text-sm font-bold bg-white/25 text-white px-2.5 py-0.5 rounded-full">
                      TODAY ONLY
                    </span>
                    <div className="flex items-start gap-3 md:gap-4">
                      <span className="text-3xl md:text-4xl">{festival.icon}</span>
                      <div>
                        <p className="font-semibold text-white text-base md:text-lg leading-tight">
                          {festival.name}
                        </p>
                        <p className="text-white/80 text-sm md:text-base mt-1 leading-snug">
                          Festival pack available in Marketplace today
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Pro / Max pitch — always shown */}
              <Link href="/shop" onClick={dismiss}>
                <div className="rounded-2xl p-4 md:p-5 bg-gradient-to-br from-violet-600/30 to-amber-500/20 border border-white/10 cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all">
                  <div className="flex items-start gap-3 md:gap-4">
                    <span className="text-3xl md:text-4xl">👑</span>
                    <div>
                      <p className="font-semibold text-white text-base md:text-lg leading-tight">
                        Earn up to 2× coins with Max
                      </p>
                      <p className="text-white/60 text-sm md:text-base mt-1">
                        Pro ₹{PRO_AMOUNT_INR}/mo · Max ₹{MAX_AMOUNT_INR}/mo
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Countdown progress bar */}
            <div className="pb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm md:text-base text-white/30">
                  Opening in {secondsLeft}s…
                </span>
                <button
                  onClick={dismiss}
                  className="text-sm md:text-base text-white/40 hover:text-white/70 transition-colors"
                >
                  Enter now
                </button>
              </div>
              <div className="h-1 md:h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
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

