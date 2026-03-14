"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SPEEDBLITZ_DURATION_S, SPEEDBLITZ_QUESTION_COUNT, SPEEDBLITZ_TIMER_WARNING_S, GAME_COINS_PER_CORRECT } from "@/lib/game-config";

type Question = { id: string; text: string; options: string[]; correctIndex: number };

export default function SpeedBlitzGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPEEDBLITZ_DURATION_S);
  const [loading, setLoading] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quizzes?official=true");
      const quizzes = await res.json();
      const allQ: Question[] = [];
      for (const quiz of quizzes.slice(0, Math.ceil(SPEEDBLITZ_QUESTION_COUNT / 5))) {
        const qRes = await fetch(`/api/quizzes/${quiz.id}`);
        const full = await qRes.json();
        allQ.push(...full.questions);
      }
      // Shuffle and take 20
      const shuffled = allQ.sort(() => Math.random() - 0.5).slice(0, SPEEDBLITZ_QUESTION_COUNT);
      setQuestions(shuffled);
    } finally {
      setLoading(false);
    }
  };

  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const end = useCallback((finalScore: number) => {
    setPhase("done");
    setCoinsEarned(finalScore * GAME_COINS_PER_CORRECT);
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) { end(scoreRef.current); return; }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, end]);

  const handleAnswer = (idx: number) => {
    const q = questions[current];
    const correct = idx === q.correctIndex;
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    if (current + 1 >= questions.length) {
      end(newScore);
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (phase === "intro") {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm block text-left">← Back</button>
        <div className="text-6xl mb-4">⚡</div>
        <h1 className="text-3xl font-bold text-white mb-3">Speed Blitz</h1>
        <p className="text-gray-400 mb-6">20 questions. 30 seconds. No time to think!</p>
        <button
          onClick={async () => { await loadQuestions(); setPhase("playing"); setTimeLeft(SPEEDBLITZ_DURATION_S); }}
          disabled={loading}
          className="w-full py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg rounded-xl disabled:opacity-50"
        >
          {loading ? "Loading..." : "Start Blitz! ⚡"}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((score / Math.max(current, 1)) * 100);
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">⚡</div>
        <h2 className="text-2xl font-bold text-white mb-2">Blitz Complete!</h2>
        <p className="text-gray-400 mb-4">{score}/{current} correct ({pct}%)</p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold mb-8">
          🪙 +{coinsEarned} coins
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setPhase("intro"); setCurrent(0); setScore(0); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Play Again</button>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">Game Modes</button>
        </div>
      </div>
    );
  }

  if (!questions[current]) return null;
  const q = questions[current];

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">{current + 1}/{SPEEDBLITZ_QUESTION_COUNT} • Score: {score}</span>
        <div className={`text-xl font-bold px-4 py-1.5 rounded-xl border ${timeLeft <= SPEEDBLITZ_TIMER_WARNING_S ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse" : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-6">
        <div className="bg-yellow-500 h-1.5 rounded-full transition-all" style={{ width: `${(timeLeft / SPEEDBLITZ_DURATION_S) * 100}%` }} />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <p className="text-lg font-semibold text-white">{q.text}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, idx) => (
          <button key={idx} onClick={() => handleAnswer(idx)}
            className="bg-white/5 border border-white/10 hover:bg-yellow-500/20 hover:border-yellow-500/50 text-gray-300 hover:text-white px-4 py-3 rounded-xl transition-all text-sm font-medium">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
