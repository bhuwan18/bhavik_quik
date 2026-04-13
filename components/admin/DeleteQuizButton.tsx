"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteQuizButton({ quizId, quizTitle }: { quizId: string; quizTitle: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete quiz");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-gray-400 hidden sm:block">Delete &quot;{quizTitle.slice(0, 30)}{quizTitle.length > 30 ? "…" : ""}&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/40 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-xl text-xs font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="shrink-0 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors"
    >
      🗑️ Delete
    </button>
  );
}
