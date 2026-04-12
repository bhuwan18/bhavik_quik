"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string | null;
  readMoreUrl?: string | null;
  imageUrl?: string | null;
};

const COINS_BY_DIFFICULTY: Record<number, number> = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 20 };

type MysticalGrant = {
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  description: string;
};

type Quiz = {
  id: string;
  title: string;
  difficulty: number;
  questions: Question[];
};

/** Simple seeded shuffle — stable per session, random across sessions */
function shuffleOrder(length: number, seed: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  let s = (seed * 9301 + 49297) % 233280;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null); // visual index
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [result, setResult] = useState<{ score: number; total: number; coinsEarned: number; mysticalQuizletsGranted?: MysticalGrant[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mysticalQueue, setMysticalQueue] = useState<MysticalGrant[]>([]);
  const [showingMystical, setShowingMystical] = useState(false);

  // Generate shuffled display orders for every question once at mount
  const shuffledOrders = useMemo(() => {
    const seed = Date.now();
    return quiz.questions.map((q, qi) => shuffleOrder(q.options.length, seed + qi * 137));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const question = quiz.questions[current];
  const order = shuffledOrders[current]; // order[visualIdx] = originalIdx
  const total = quiz.questions.length;
  const progress = (current / total) * 100;
  const coinsPerCorrect = COINS_BY_DIFFICULTY[quiz.difficulty] ?? 5;

  // Which visual index shows the correct answer?
  const correctVisualIdx = order.indexOf(question.correctIndex);

  const handleSelect = (visualIdx: number) => {
    if (selected !== null) return;
    setSelected(visualIdx);
  };

  const handleNext = async () => {
    if (selected === null) return;
    const originalIdx = order[selected]; // map visual index → original DB index
    const newAnswers = [...answers, { questionId: question.id, selectedIndex: originalIdx }];
    setAnswers(newAnswers);

    if (current + 1 < total) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      setSubmitting(true);
      try {
        const res = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, answers: newAnswers }),
        });
        const data = await res.json();
        if (data.mysticalQuizletsGranted?.length > 0) {
          setMysticalQueue(data.mysticalQuizletsGranted);
          setShowingMystical(true);
        }
        setResult(data);
      } catch {
        setResult({ score: 0, total, coinsEarned: 0 });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (showingMystical && mysticalQueue.length > 0) {
    const mq = mysticalQueue[0];
    const isLast = mysticalQueue.length === 1;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="absolute text-xl animate-bounce"
              style={{
                left: `${5 + (i * 17) % 90}%`,
                top: `${10 + (i * 13) % 75}%`,
                animationDelay: `${(i * 0.15) % 1.5}s`,
                animationDuration: `${1.2 + (i % 4) * 0.3}s`,
                opacity: 0.7,
              }}
            >
              {["✨", "⭐", "💫", "🌟", "✦"][i % 5]}
            </span>
          ))}
        </div>

        <div className="relative max-w-sm w-full text-center">
          {/* Header */}
          <div className="mb-6">
            <p className="text-teal-400 font-bold text-sm uppercase tracking-widest mb-2">Mystical Quizlet Unlocked</p>
            <h2 className="text-3xl font-bold text-white">✨ Achievement!</h2>
          </div>

          {/* Quizlet card */}
          <div
            className="mx-auto w-48 h-64 rounded-3xl border-2 border-teal-400 shadow-2xl mystical-card flex flex-col items-center justify-center gap-3 p-5 mb-6"
            style={{ background: `linear-gradient(135deg, ${mq.colorFrom}, ${mq.colorTo})` }}
          >
            <span className="text-5xl">{mq.icon}</span>
            <p className="text-white font-bold text-lg leading-tight">{mq.name}</p>
            <span className="text-teal-200 text-xs font-semibold uppercase tracking-wider">Mystical</span>
            <p className="text-white/70 text-xs text-center leading-snug">{mq.description}</p>
          </div>

          <p className="text-gray-300 text-sm mb-6">
            This achievement quizlet is now in your collection.
          </p>

          <button
            onClick={() => {
              if (isLast) {
                setMysticalQueue([]);
                setShowingMystical(false);
              } else {
                setMysticalQueue((q) => q.slice(1));
              }
            }}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition-colors text-base"
          >
            {isLast ? "Continue →" : `Next (${mysticalQueue.length - 1} more)`}
          </button>
          <button
            onClick={() => router.push("/quizlets")}
            className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-colors"
          >
            View Collection
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const isPerfect = result.score === result.total;
    const emoji = isPerfect ? "🏆" : pct >= 80 ? "🎉" : pct >= 60 ? "👍" : pct >= 40 ? "😐" : "😬";
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto">
        <div className="text-6xl md:text-7xl mb-4">{emoji}</div>
        {isPerfect && (
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-1.5 rounded-full text-sm font-bold mb-3">
            ✓ Perfect Score — Quiz Completed!
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-400 mb-6 md:text-lg">
          You scored <span className="text-white font-bold">{result.score}/{result.total}</span> ({pct}%)
        </p>
        <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-5 py-2.5 rounded-xl mb-4 text-lg font-bold">
          🪙 +{result.coinsEarned} coins earned
        </div>

        {result.coinsEarned === 0 && result.score > 0 && (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-left">
            <p className="text-orange-300 font-semibold text-sm mb-1">🚫 You hit your daily coin limit</p>
            <p className="text-gray-400 text-xs mb-3">You answered correctly but earned no coins — your daily cap is full. Reset it or upgrade for a higher limit.</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => router.push("/shop?tab=reset")}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                🔄 Reset limit — ₹100
              </button>
              <button
                onClick={() => router.push("/shop")}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                ⭐ Upgrade for higher cap
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push("/discover")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            More Quizzes
          </button>
          <button
            onClick={() => router.push("/marketplace")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium"
          >
            Open a Pack 🎴
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Question {current + 1} of {total}</span>
          <span className="flex items-center gap-2">
            <span className="text-yellow-400 font-medium">🪙 {coinsPerCorrect}/correct</span>
            <span>{Math.round(progress)}%</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Quiz progress"
          className="w-full bg-white/10 rounded-full h-2 overflow-hidden"
        >
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${progress / 100})`, transformOrigin: "left", willChange: "transform" }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-7 mb-6 select-none">
        {question.imageUrl && (
          <div className="mb-5 flex justify-center">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg inline-flex items-center justify-center">
              <Image
                src={question.imageUrl}
                alt={question.text}
                width={300}
                height={200}
                className="object-contain max-h-48 md:max-h-60"
                sizes="(max-width: 768px) 280px, 300px"
              />
            </div>
          </div>
        )}
        <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed">{question.text}</p>
      </div>

      {/* Options — rendered in shuffled visual order */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 select-none">
        {order.map((originalIdx, visualIdx) => {
          const option = question.options[originalIdx];
          let style = "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-indigo-500/50";
          if (selected !== null) {
            if (visualIdx === correctVisualIdx) {
              style = "bg-green-500/20 border-green-500 text-green-300";
            } else if (visualIdx === selected && visualIdx !== correctVisualIdx) {
              style = "bg-red-500/20 border-red-500 text-red-300";
            } else {
              style = "bg-white/3 border-white/5 text-gray-500 opacity-60";
            }
          }
          return (
            <button
              key={visualIdx}
              onClick={() => handleSelect(visualIdx)}
              disabled={selected !== null}
              className={`w-full text-left px-5 py-4 border rounded-xl transition-all duration-200 font-medium ${style}`}
            >
              <span className="text-gray-500 mr-3">{String.fromCharCode(65 + visualIdx)}.</span>
              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation panel — shown after answering */}
      {selected !== null && (question.explanation || question.readMoreUrl) && (
        <div className="mb-6 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-indigo-400 text-sm font-semibold">💡 Explanation</span>
          </div>
          {question.explanation && (
            <p className="text-gray-300 text-sm leading-relaxed">{question.explanation}</p>
          )}
          {question.readMoreUrl && (
            <a
              href={question.readMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Read more →
            </a>
          )}
        </div>
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={selected === null || submitting}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {submitting ? "Submitting..." : current + 1 < total ? "Next Question →" : "Finish Quiz"}
      </button>
    </div>
  );
}
