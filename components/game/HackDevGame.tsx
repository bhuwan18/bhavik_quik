"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HACKDEV_DURATION_S, HACKDEV_CATEGORY, HACKDEV_TIMER_WARNING_S, HACKDEV_ANSWER_REVEAL_MS, GAME_COINS_PER_CORRECT } from "@/lib/game-config";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
};

export default function HackDevGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(HACKDEV_DURATION_S);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);

  // Refs to avoid stale closures in timer effect
  const answersRef = useRef(answers);
  const scoreRef = useRef(score);
  const questionsRef = useRef(questions);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quizzes?category=${HACKDEV_CATEGORY}&official=true`);
      const quizzes = await res.json();
      if (quizzes.length === 0) return;
      // Pick a random official tech quiz
      const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const qRes = await fetch(`/api/quizzes/${quiz.id}`);
      const full = await qRes.json();
      setQuestions(full.questions);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const submitAndEnd = useCallback(async (finalAnswers: typeof answers, finalScore: number) => {
    setPhase("done");
    setCoinsEarned(finalScore * GAME_COINS_PER_CORRECT);
    if (questionsRef.current.length > 0) {
      try {
        const quizRes = await fetch(`/api/quizzes?category=${HACKDEV_CATEGORY}&official=true`);
        const quizzes = await quizRes.json();
        if (quizzes.length > 0) {
          await fetch("/api/attempt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quizId: quizzes[0].id, answers: finalAnswers }),
          });
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      submitAndEnd(answersRef.current, scoreRef.current);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, submitAndEnd]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[current];
    const correct = idx === q.correctIndex;
    const newScore = correct ? score + 1 : score;
    const newAnswers = [...answers, { questionId: q.id, selectedIndex: idx }];
    if (correct) setScore(newScore);
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setSelected(null);
      } else {
        submitAndEnd(newAnswers, newScore);
      }
    }, HACKDEV_ANSWER_REVEAL_MS);
  };

  if (phase === "intro") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm">← Back</button>
        <div className="text-center">
          <div className="text-6xl mb-4">💻</div>
          <h1 className="text-3xl font-bold text-white mb-3">HackDev</h1>
          <p className="text-gray-400 mb-6">
            Answer as many tech questions as you can in <span className="text-cyan-400 font-bold">60 seconds</span>.
            Each correct answer earns 5 coins!
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-2 text-sm text-gray-400">
            <p>✅ Only technology category questions</p>
            <p>⏱️ 60 second time limit</p>
            <p>🪙 5 coins per correct answer</p>
            <p>⚡ Answers reveal instantly — keep going!</p>
          </div>
          <button
            onClick={async () => {
              await loadQuestions();
              setPhase("playing");
              setTimeLeft(HACKDEV_DURATION_S);
            }}
            disabled={loading}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Loading questions..." : "Start HackDev! 🚀"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-3xl font-bold text-white mb-2">Time&apos;s Up!</h2>
        <p className="text-gray-400 mb-4">You answered <span className="text-white font-bold">{score}/{answers.length}</span> correctly</p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-4 rounded-xl inline-flex items-center gap-2 text-xl font-bold mb-8">
          🪙 +{coinsEarned} coins
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setPhase("intro"); setCurrent(0); setScore(0); setAnswers([]); setSelected(null); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">
            Play Again
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="p-4 md:p-8 text-center text-gray-400">No tech questions found. <button onClick={onBack} className="text-indigo-400 hover:underline">Go back</button></div>;
  }

  const q = questions[current];

  return (
    <div className="p-8 max-w-xl mx-auto">
      {/* Timer */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-400 text-sm">Question {current + 1}/{questions.length}</span>
        <div className={`text-2xl font-bold px-4 py-2 rounded-xl border ${timeLeft <= HACKDEV_TIMER_WARNING_S ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse" : "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"}`}>
          ⏱️ {timeLeft}s
        </div>
      </div>
      <div className="mb-4 text-center">
        <span className="text-yellow-400 font-bold">Score: {score}</span>
        <span className="text-gray-500 mx-2">•</span>
        <span className="text-gray-400">{score * GAME_COINS_PER_CORRECT} coins</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
        <p className="text-lg font-semibold text-white">{q.text}</p>
      </div>
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let style = "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10";
          if (selected !== null) {
            if (idx === q.correctIndex) style = "bg-green-500/20 border-green-500 text-green-300";
            else if (idx === selected) style = "bg-red-500/20 border-red-500 text-red-300";
            else style = "bg-white/3 border-white/5 text-gray-600";
          }
          return (
            <button key={idx} onClick={() => handleAnswer(idx)} disabled={selected !== null}
              className={`w-full text-left px-4 py-3 border rounded-xl transition-all text-sm font-medium ${style}`}>
              <span className="text-gray-500 mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
