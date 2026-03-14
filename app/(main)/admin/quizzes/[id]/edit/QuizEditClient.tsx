"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "football", "cricket", "harry-potter", "technology", "avengers",
  "artists", "musicians", "math", "science", "physics",
];

type Question = {
  id?: string;
  text: string;
  options: string[];
  correctIndex: number;
  order: number;
  explanation: string;
  readMoreUrl: string;
  imageUrl: string;
};

type Quiz = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: number;
  isOfficial: boolean;
  questions: Question[];
};

export default function QuizEditClient({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [title, setTitle]       = useState(quiz.title);
  const [description, setDesc]  = useState(quiz.description ?? "");
  const [category, setCategory] = useState(quiz.category);
  const [difficulty, setDiff]   = useState(quiz.difficulty);
  const [questions, setQuestions] = useState<Question[]>(
    quiz.questions.map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options as string[] : [], imageUrl: (q as Question).imageUrl ?? "" }))
  );
  const [saving, setSaving]  = useState(false);
  const [toast, setToast]    = useState<{ text: string; ok: boolean } | null>(null);

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...patch } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[oIdx] = value;
        return { ...q, options: opts };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: "", options: ["", "", "", ""], correctIndex: 0, order: prev.length, explanation: "", readMoreUrl: "", imageUrl: "" },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i })));
  };

  const handleSave = async () => {
    if (!title.trim()) { showToast("Title is required", false); return; }
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) { showToast(`Question ${i + 1} text is empty`, false); return; }
      if (q.options.some((o) => !o.trim())) { showToast(`Question ${i + 1} has empty options`, false); return; }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, difficulty, questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      showToast("Quiz saved!", true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${
          toast.ok
            ? "bg-green-500/20 border border-green-500/40 text-green-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"
        }`}>
          {toast.ok ? "✓" : "✗"} {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push("/admin/quizzes")}
          className="text-gray-400 hover:text-white transition-colors text-sm">
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Edit Quiz</h1>
          <p className="text-gray-500 text-xs">{quiz.id}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Metadata */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Quiz Details</h2>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDesc(e.target.value.slice(0, 1000))}
            rows={2}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="text-xs text-gray-400 mb-1 block">Difficulty (1–5)</label>
            <input
              type="number"
              min={1} max={5}
              value={difficulty}
              onChange={(e) => setDiff(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Questions ({questions.length})
        </h2>
        <button
          onClick={addQuestion}
          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition-colors"
        >
          + Add Question
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xs font-bold text-purple-400 mt-2.5 shrink-0">Q{qIdx + 1}</span>
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                rows={2}
                placeholder="Question text..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
              <button
                onClick={() => removeQuestion(qIdx)}
                className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 mt-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 ml-7">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuestion(qIdx, { correctIndex: oIdx })}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                      q.correctIndex === oIdx
                        ? "bg-green-500 border-green-500"
                        : "border-white/20 hover:border-green-500/50"
                    }`}
                    title="Mark as correct"
                  />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    placeholder={`Option ${oIdx + 1}`}
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                  {q.correctIndex === oIdx && (
                    <span className="text-xs text-green-400 shrink-0">✓ Correct</span>
                  )}
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="ml-7 mt-3 space-y-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Explanation (shown after answering)</label>
                <textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                  rows={2}
                  placeholder="Brief explanation of the correct answer..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Read more URL (optional)</label>
                <input
                  value={q.readMoreUrl}
                  onChange={(e) => updateQuestion(qIdx, { readMoreUrl: e.target.value })}
                  placeholder="https://en.wikipedia.org/wiki/..."
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Image URL (optional)</label>
                <input
                  value={q.imageUrl}
                  onChange={(e) => updateQuestion(qIdx, { imageUrl: e.target.value })}
                  placeholder="https://... or /public-path.png"
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl transition-colors"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
