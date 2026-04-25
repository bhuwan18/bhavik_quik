"use client";

import { useEffect, useState, useCallback } from "react";
import { RARITY_COLORS } from "@/lib/utils";

type SubmissionRow = {
  id: string;
  name: string;
  icon: string;
  colorFrom: string;
  colorTo: string;
  rarity: string;
  description: string;
  pack: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

type StatusFilter = "pending" | "approved" | "rejected" | "all";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
    approved: "bg-green-500/20 border-green-500/40 text-green-300",
    rejected: "bg-red-500/20 border-red-500/40 text-red-300",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase ${styles[status] ?? "bg-white/10 text-gray-400"}`}>
      {status}
    </span>
  );
}

function QuizletPreview({ submission }: { submission: SubmissionRow }) {
  const rarityStyle = RARITY_COLORS[submission.rarity] ?? RARITY_COLORS.common;
  return (
    <div
      className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl border-2 shrink-0 ${rarityStyle.border} ${rarityStyle.glow}`}
      style={{ background: `linear-gradient(135deg, ${submission.colorFrom}, ${submission.colorTo})` }}
    >
      {submission.icon}
    </div>
  );
}

const PACK_LABELS: Record<string, string> = {
  "tech-pack": "Tech",
  "sports-pack": "Sports",
  "magic-pack": "Magic",
  "hero-pack": "Hero",
  "music-pack": "Music",
  "science-pack": "Science",
  "math-pack": "Math",
  "english-pack": "English",
};

export default function AdminQuizletSubmissionsClient() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const limit = 20;

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/admin/quizlet-submissions?${params}`);
      if (!res.ok) { showToast("Failed to load submissions", false); return; }
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const doAction = async (id: string, action: "approve" | "reject", adminNote?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/quizlet-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      showToast(action === "approve" ? "Quizlet approved and added to the game!" : "Submission rejected", true);
      fetchSubmissions();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    await doAction(rejectModal.id, "reject", rejectNote.trim() || undefined);
    setRejectModal(null);
    setRejectNote("");
  };

  const totalPages = Math.ceil(total / limit);

  const TABS: { label: string; value: StatusFilter }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">🔨 Quizlet Submissions</h1>
        <p className="text-gray-400 text-sm">Review and approve quizlets submitted by Blacksmith users.</p>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${
          toast.ok
            ? "bg-green-500/20 border border-green-500/40 text-green-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"
        }`}>
          {toast.ok ? "✓" : "✗"} {toast.text}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-md" style={{ background: "var(--surface)" }}>
            <h3 className="text-lg font-bold text-white mb-3">Reject Submission</h3>
            <p className="text-sm text-gray-400 mb-4">Optionally add a note explaining the rejection (stored for records).</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value.slice(0, 300))}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500 mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleRejectSubmit}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectNote(""); }}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === tab.value
                ? "bg-amber-600 text-black"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{total} result{total !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No submissions found.</div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => {
            const rarityStyle = RARITY_COLORS[s.rarity] ?? RARITY_COLORS.common;
            return (
              <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <QuizletPreview submission={s} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-bold text-base">{s.icon} {s.name}</span>
                      <StatusBadge status={s.status} />
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${rarityStyle.border} ${rarityStyle.text} bg-white/5`}>
                        {(RARITY_COLORS[s.rarity]?.label ?? s.rarity).toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        📦 {PACK_LABELS[s.pack] ?? s.pack}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{s.description}</p>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-6 h-6 rounded-md border border-white/20"
                        style={{ background: s.colorFrom }}
                        title={s.colorFrom}
                      />
                      <span className="text-xs text-gray-500">→</span>
                      <div
                        className="w-6 h-6 rounded-md border border-white/20"
                        style={{ background: s.colorTo }}
                        title={s.colorTo}
                      />
                      <span className="text-xs text-gray-500 ml-1">{s.colorFrom} → {s.colorTo}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>By: <span className="text-gray-300">{s.user.name ?? "—"}</span> ({s.user.email})</span>
                      <span>{new Date(s.createdAt).toLocaleString()}</span>
                      {s.adminNote && <span className="text-red-400/70">Note: {s.adminNote}</span>}
                    </div>
                  </div>

                  {s.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => doAction(s.id, "approve")}
                        disabled={!!actionLoading}
                        className="text-xs px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg font-semibold transition-colors disabled:opacity-40 min-w-[90px] text-center"
                      >
                        {actionLoading === s.id ? "Working..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => setRejectModal({ id: s.id })}
                        disabled={!!actionLoading}
                        className="text-xs px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg font-semibold transition-colors disabled:opacity-40 min-w-[90px] text-center"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-400">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
