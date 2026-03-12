"use client";
import { useState, useEffect, useCallback } from "react";

type Question = { id: string; text: string; options: string[]; correctIndex: number };

export default function DailyChallengeGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState<string>("");
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [todayDate, setTodayDate] = useState("");

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quizzes?official=true");
      const quizzes = await res.json();
      if (quizzes.length === 0) return;

      // Sort by id for determinism, pick by day of year
      const sorted = [...quizzes].sort((a: any, b: any) => a.id.localeCompare(b.id));
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      const quiz = sorted[dayOfYear % sorted.length];

      const qRes = await fetch(`/api/quizzes/${quiz.id}`);
      const full = await qRes.json();
      // Take first 5 questions
      setQuizId(quiz.id);
      setQuestions(full.questions.slice(0, 5));
      setTodayDate(now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const endGame = useCallback(async (finalAnswers: typeof answers, finalScore: number, qId: string) => {
    setPhase("done");
    setCoinsEarned(finalScore * 5);
    if (qId && finalAnswers.length > 0) {
      try {
        const res = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: qId, answers: finalAnswers }),
        });
        const data = await res.json();
        if (data.coinsEarned !== undefined) setCoinsEarned(data.coinsEarned);
      } catch {
        // ignore
      }
    }
  }, []);

  // 30-second timer per question
  useEffect(() => {
    if (phase !== "playing" || selected !== null) return;
    if (timeLeft <= 0) {
      const currentQ = questions[current];
      const newAnswers = [...answers, { questionId: currentQ.id, selectedIndex: -1 }];
      setAnswers(newAnswers);
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setTimeLeft(30);
      } else {
        endGame(newAnswers, score, quizId);
      }
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, selected, current, questions, answers, score, quizId, endGame]);

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
        setTimeLeft(30);
      } else {
        endGame(newAnswers, newScore, quizId);
      }
    }, 800);
  };

  if (phase === "intro") {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm">
          ← Back
        </button>
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-3xl font-bold text-white mb-3">Daily Challenge</h1>
          <p className="text-gray-400 mb-2">
            5 questions, same for everyone today. Come back tomorrow for a new challenge!
          </p>
          {todayDate && (
            <p className="text-teal-400 text-sm font-semibold mb-6">{todayDate}</p>
          )}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-2 text-sm text-gray-400">
            <p>📅 Same 5 questions for everyone today</p>
            <p>⏱️ 30 seconds per question</p>
            <p>🪙 Earn coins for every correct answer</p>
            <p>🔄 New challenge every day</p>
          </div>
          <button
            onClick={async () => {
              await loadQuestions();
              setPhase("playing");
              setCurrent(0);
              setScore(0);
              setAnswers([]);
              setSelected(null);
              setTimeLeft(30);
            }}
            disabled={loading}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Loading today's challenge..." : "Start Daily Challenge! 📅"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">{pct === 100 ? "🏆" : pct >= 60 ? "⭐" : "📅"}</div>
        <h2 className="text-3xl font-bold text-white mb-2">Challenge Complete!</h2>
        <p className="text-gray-400 mb-1">
          You scored <span className="text-white font-bold">{score}/{questions.length}</span>
        </p>
        <p className="text-gray-500 text-sm mb-4">{todayDate}</p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-4 rounded-xl inline-flex items-center gap-2 text-xl font-bold mb-8">
          🪙 +{coinsEarned} coins
        </div>
        <div className="flex gap-3 justify-center">
          <p className="text-gray-500 text-sm self-center">Come back tomorrow for a new challenge!</p>
          <button onClick={onBack} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl">
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No questions found.{" "}
        <button onClick={onBack} className="text-teal-400 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const q = questions[current];
  const timerPct = (timeLeft / 30) * 100;

  return (
    <div className="p-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-teal-400 text-xs font-semibold uppercase tracking-widest">Today&apos;s Challenge</p>
          <p className="text-gray-400 text-sm">
            Question {current + 1} of {questions.length}
          </p>
        </div>
        <div
          className={`text-2xl font-bold px-4 py-2 rounded-xl border ${
            timeLeft <= 5
              ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse"
              : "text-teal-400 border-teal-500/30 bg-teal-500/10"
          }`}
        >
          {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
        <div
          className={`h-1.5 rounded-full transition-all ${timeLeft <= 5 ? "bg-red-500" : "bg-teal-500"}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      <div className="mb-3 text-right">
        <span className="text-yellow-400 font-bold">Score: {score}</span>
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
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 border rounded-xl transition-all text-sm font-medium ${style}`}
            >
              <span className="text-gray-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
