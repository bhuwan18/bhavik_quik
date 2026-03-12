"use client";
import { useState, useEffect } from "react";

const FACTS = [
  "💡 Each correct answer earns you coins — harder quizzes pay more!",
  "🎴 There are 55 unique Quizlet characters to collect across 8 rarity tiers.",
  "⚡ The Impossible Quizlet has a 0.001% chance from the Rainbow Pack.",
  "🏆 Collect all 55 Quizlets to unlock the BittsQuiz Master Certificate!",
  "🪙 Pro members earn 1.5× coins — Max members earn 2× coins!",
  "🌍 There are quizzes in 11 categories including World Languages!",
  "🎮 Try Survival Mode — answer correctly or it's game over!",
  "🔥 Daily streaks reset at midnight UTC — keep playing every day!",
  "🦖 DinoRex is elimination style — one wrong answer and you're out!",
  "⭐ The leaderboard updates in real-time — can you reach #1?",
];

export default function Loading() {
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFactIdx((i) => (i + 1) % FACTS.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
      </div>

      {/* Fact */}
      <div className="max-w-md text-center">
        <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-3">Did you know?</p>
        <p
          className="text-gray-300 text-base leading-relaxed transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {FACTS[factIdx]}
        </p>
      </div>
    </div>
  );
}
