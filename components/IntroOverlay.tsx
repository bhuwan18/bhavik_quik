"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STEPS = [
  {
    icon: "🎉",
    title: "Welcome to BittsQuiz!",
    body: "The quiz game where your knowledge turns into treasure. Answer questions, earn coins, and build your collection!",
    gradient: "from-violet-600 to-purple-700",
  },
  {
    icon: "⚡",
    title: "Answer Quizzes, Earn Coins",
    body: "Every correct answer earns you 5 coins 🪙. Play across 10 categories — Football, Harry Potter, Tech, Science, and more!",
    gradient: "from-indigo-600 to-blue-700",
  },
  {
    icon: "🎴",
    title: "Collect Quizlets",
    body: "Spend coins to open packs and collect 55 unique Quizlet characters — from Common to the ultra-rare Impossible rarity!",
    gradient: "from-pink-600 to-rose-700",
  },
  {
    icon: "🏆",
    title: "Compete & Explore",
    body: "Climb the leaderboard, try Game Modes like Speed Blitz & DinoRex, and unlock the Master Certificate when you collect them all!",
    gradient: "from-orange-500 to-amber-600",
  },
  {
    icon: "🚀",
    title: "Ready? Let's Go!",
    body: "Pick a quiz category and start earning. Your first coins are just one quiz away!",
    gradient: "from-green-600 to-emerald-700",
    isLast: true,
  },
];

const STORAGE_KEY = "bq_intro_seen_v1";

export default function IntroOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const goTo = (next: number) => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      setStep(next);
      setFading(false);
    }, 150);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid rgba(139,92,246,0.35)" }}
      >
        {/* Skip */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 text-xs text-gray-500 hover:text-gray-300 transition-colors bg-black/20 px-3 py-1.5 rounded-full"
        >
          Skip
        </button>

        {/* Gradient header */}
        <div
          className={`bg-gradient-to-br ${current.gradient} px-8 pt-10 pb-8 flex flex-col items-center transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}
        >
          <span className="text-6xl mb-4 drop-shadow-lg">{current.icon}</span>
          <h2 className="text-2xl font-bold text-white text-center leading-tight">{current.title}</h2>
        </div>

        {/* Body */}
        <div className={`px-6 pt-5 pb-6 transition-opacity duration-150 ${fading ? "opacity-0" : "opacity-100"}`}>
          <p className="text-gray-300 text-center text-sm leading-relaxed mb-5">{current.body}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === step ? "w-6 bg-purple-400" : "w-2 bg-white/20 hover:bg-white/30"
                }`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => goTo(step - 1)}
                className="flex-1 py-3 rounded-xl bg-white/8 text-gray-300 font-medium hover:bg-white/15 transition-colors text-sm"
              >
                ← Back
              </button>
            )}
            {current.isLast ? (
              <Link
                href="/discover"
                onClick={dismiss}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-center hover:opacity-90 transition-opacity text-sm shadow-lg shadow-purple-500/30"
              >
                Let&apos;s Play! ⚡
              </Link>
            ) : (
              <button
                onClick={() => goTo(step + 1)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:opacity-90 transition-opacity text-sm shadow-lg shadow-purple-500/30"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
