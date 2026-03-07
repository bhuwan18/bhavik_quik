"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/utils";

type Question = { text: string; options: string[]; correctIndex: number };

export default function QuizMakerPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("technology");
  const [difficulty, setDifficulty] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { text: "", options: ["", "", "", ""], correctIndex: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof Question, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) } : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("Quiz title is required.");
    if (questions.some((q) => !q.text.trim() || q.options.some((o) => !o.trim()))) {
      return setError("All questions and options must be filled.");
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, difficulty, questions }),
      });
      if (res.ok) {
        const quiz = await res.json();
        router.push(`/quiz/${quiz.id}`);
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to create quiz");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">✏️ Create a Quiz</h1>
        <p className="text-gray-400 mt-1">Share your knowledge with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz metadata */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Quiz Details</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quiz Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Harry Potter Ultimate Quiz"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this quiz about?"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 bg-[#0d0d1a]"
              >
                {CATEGORIES.map(({ slug, label, icon }) => (
                  <option key={slug} value={slug}>{icon} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 bg-[#0d0d1a]"
              >
                <option value={1}>1 — Beginner</option>
                <option value={2}>2 — Easy</option>
                <option value={3}>3 — Medium</option>
                <option value={4}>4 — Hard</option>
                <option value={5}>5 — Expert</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Question {qIdx + 1}</h3>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                placeholder="Enter your question..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-4"
              />
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, "correctIndex", oIdx)}
                      className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-colors ${
                        q.correctIndex === oIdx
                          ? "bg-green-500 border-green-500"
                          : "border-gray-600 hover:border-green-500"
                      }`}
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Click the circle to mark the correct answer</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 rounded-xl transition-all text-sm"
        >
          + Add Question
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {submitting ? "Publishing..." : "Publish Quiz 🚀"}
        </button>
      </form>
    </div>
  );
}
