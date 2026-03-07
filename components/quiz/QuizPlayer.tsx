"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
};

const COINS_BY_DIFFICULTY: Record<number, number> = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 20 };

type Quiz = {
  id: string;
  title: string;
  difficulty: number;
  questions: Question[];
};

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [result, setResult] = useState<{ score: number; total: number; coinsEarned: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const question = quiz.questions[current];
  const total = quiz.questions.length;
  const progress = ((current) / total) * 100;
  const coinsPerCorrect = COINS_BY_DIFFICULTY[quiz.difficulty] ?? 5;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = async () => {
    if (selected === null) return;
    const newAnswers = [...answers, { questionId: question.id, selectedIndex: selected }];
    setAnswers(newAnswers);

    if (current + 1 < total) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      // Submit
      setSubmitting(true);
      try {
        const res = await fetch("/api/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, answers: newAnswers }),
        });
        const data = await res.json();
        setResult(data);
      } catch {
        setResult({ score: 0, total, coinsEarned: 0 });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const emoji = pct >= 80 ? "🎉" : pct >= 60 ? "👍" : pct >= 40 ? "😐" : "😬";
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-gray-400 mb-6">
          You scored <span className="text-white font-bold">{result.score}/{result.total}</span> ({pct}%)
        </p>
        <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl mb-8 text-lg font-bold">
          🪙 +{result.coinsEarned} coins earned
        </div>
        <div className="flex gap-3 justify-center">
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
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
        <p className="text-xl font-semibold text-white leading-relaxed">{question.text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option, idx) => {
          let style = "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-indigo-500/50";
          if (selected !== null) {
            if (idx === question.correctIndex) {
              style = "bg-green-500/20 border-green-500 text-green-300";
            } else if (idx === selected && idx !== question.correctIndex) {
              style = "bg-red-500/20 border-red-500 text-red-300";
            } else {
              style = "bg-white/3 border-white/5 text-gray-500 opacity-60";
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`w-full text-left px-5 py-4 border rounded-xl transition-all duration-200 font-medium ${style}`}
            >
              <span className="text-gray-500 mr-3">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>

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
