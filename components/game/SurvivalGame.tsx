"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { SURVIVAL_TIMER_S, SURVIVAL_TIMER_WARNING_S, SURVIVAL_ANSWER_REVEAL_MS, GAME_COINS_PER_CORRECT } from "@/lib/game-config";

type Question = { id: string; text: string; options: string[]; correctIndex: number };

export default function SurvivalGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState<string>("");
  const [current, setCurrent] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SURVIVAL_TIMER_S);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [survived, setSurvived] = useState(false);

  // Refs to avoid stale closures in timer effect
  const answersRef = useRef(answers);
  const streakRef = useRef(streak);
  const questionsRef = useRef(questions);
  const currentRef = useRef(current);
  const quizIdRef = useRef(quizId);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { quizIdRef.current = quizId; }, [quizId]);

  const loadQuestions = async (): Promise<boolean> => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/quizzes?official=true");
      const data = await res.json();
      const quizzes = data?.quizzes ?? data;
      if (!Array.isArray(quizzes) || quizzes.length === 0) {
        setLoadError("No quizzes found in the database.");
        return false;
      }
      const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const qRes = await fetch(`/api/quizzes/${quiz.id}`);
      const full = await qRes.json();
      const qs = full?.questions ?? [];
      if (!qs.length) {
        setLoadError("The selected quiz has no questions. Please try again.");
        return false;
      }
      setQuizId(quiz.id);
      setQuestions(qs);
      return true;
    } catch (e) {
      setLoadError(`Failed to load questions: ${e instanceof Error ? e.message : "unknown error"}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const endGame = useCallback(
    async (finalAnswers: typeof answers, finalStreak: number, qId: string) => {
      setPhase("done");
      const estimatedCoins = finalStreak * GAME_COINS_PER_CORRECT;
      setCoinsEarned(estimatedCoins);
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
    },
    []
  );

  // Countdown per question — only depends on phase, timeLeft, selected; uses refs for stable values
  useEffect(() => {
    if (phase !== "playing" || selected !== null) return;
    if (timeLeft <= 0) {
      const currentQ = questionsRef.current[currentRef.current];
      const newAnswers = [...answersRef.current, { questionId: currentQ.id, selectedIndex: -1 }];
      endGame(newAnswers, streakRef.current, quizIdRef.current);
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, selected, endGame]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[current];
    const correct = idx === q.correctIndex;
    const newAnswers = [...answers, { questionId: q.id, selectedIndex: idx }];
    setAnswers(newAnswers);

    if (!correct) {
      setSurvived(false);
      setTimeout(() => endGame(newAnswers, streak, quizId), SURVIVAL_ANSWER_REVEAL_MS);
      return;
    }

    const newStreak = streak + 1;
    setStreak(newStreak);
    setSurvived(true);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setTimeLeft(SURVIVAL_TIMER_S);
        setSurvived(false);
      } else {
        // Completed all questions
        endGame(newAnswers, newStreak, quizId);
      }
    }, SURVIVAL_ANSWER_REVEAL_MS);
  };

  if (phase === "intro") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto">
        <button onClick={onBack} className="text-gray-400 hover:text-white mb-6 text-sm">
          ← Back
        </button>
        <div className="text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h1 className="text-3xl font-bold text-white mb-3">Survival Mode</h1>
          <p className="text-gray-400 mb-6">
            One wrong answer and it&apos;s game over. How long can you survive?
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-2 text-sm text-gray-400">
            <p>❤️ One wrong answer = game over</p>
            <p>⏱️ 10 seconds per question</p>
            <p>🔥 Build your streak — earn coins for every correct answer</p>
            <p>🌍 Random category each game</p>
          </div>
          {loadError && (
            <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{loadError}</p>
          )}
          <button
            onClick={async () => {
              const ok = await loadQuestions();
              if (!ok) return;
              setPhase("playing");
              setCurrent(0);
              setStreak(0);
              setAnswers([]);
              setSelected(null);
              setTimeLeft(SURVIVAL_TIMER_S);
            }}
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Loading questions..." : "Start Survival! ❤️"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto text-center">
        <div className="text-6xl mb-4">{streak === 0 ? "💔" : streak >= 5 ? "🔥" : "❤️"}</div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {streak === 0 ? "Game Over!" : streak >= 10 ? "Incredible!" : "Well Played!"}
        </h2>
        <p className="text-gray-400 mb-2">
          You survived <span className="text-white font-bold">{streak}</span> question{streak !== 1 ? "s" : ""}
        </p>
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-6 py-4 rounded-xl inline-flex items-center gap-2 text-xl font-bold mb-8">
          🪙 +{coinsEarned} coins
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setPhase("intro");
              setCurrent(0);
              setStreak(0);
              setAnswers([]);
              setSelected(null);
              setTimeLeft(SURVIVAL_TIMER_S);
              setQuestions([]);
            }}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
          >
            Play Again
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl">
            Game Modes
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 md:p-8 text-center text-gray-400">
        No questions found.{" "}
        <button onClick={onBack} className="text-red-400 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const q = questions[current];
  const timerPct = (timeLeft / SURVIVAL_TIMER_S) * 100;

  return (
    <div className="p-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-2xl">❤️</span>
          <span className="text-white font-bold text-lg">Streak: {streak}</span>
        </div>
        <div
          className={`text-2xl font-bold px-4 py-2 rounded-xl border ${
            timeLeft <= SURVIVAL_TIMER_WARNING_S
              ? "text-red-400 border-red-500/50 bg-red-500/10 animate-pulse"
              : "text-orange-400 border-orange-500/30 bg-orange-500/10"
          }`}
        >
          {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-4">
        <div
          className={`h-1.5 rounded-full transition-all ${timeLeft <= SURVIVAL_TIMER_WARNING_S ? "bg-red-500" : "bg-orange-500"}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Survived flash */}
      {survived && selected !== null && (
        <div className="mb-3 text-center text-green-400 font-bold text-lg animate-pulse">
          SURVIVED! ✓
        </div>
      )}

      <p className="text-xs text-gray-500 mb-2">
        Question {current + 1}/{questions.length}
      </p>

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
