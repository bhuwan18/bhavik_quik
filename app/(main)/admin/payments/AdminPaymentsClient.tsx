"use client";

import { useEffect, useState, useCallback } from "react";

type PaymentRow = {
  id: string;
  type: string;
  coins: number | null;
  amountInr: number;
  utrNumber: string;
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

export default function AdminPaymentsClient() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
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

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/admin/payments?${params}`);
      if (!res.ok) { showToast("Failed to load payments", false); return; }
      const data = await res.json();
      setPayments(data.payments ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const doAction = async (id: string, action: "approve" | "reject", adminNote?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      showToast(action === "approve" ? "Payment approved" : "Payment rejected", true);
      fetchPayments();
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Payment Requests</h1>
        <p className="text-gray-400 text-sm">Review and approve UPI payment submissions.</p>
      </div>

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

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-3">Reject Payment</h3>
            <p className="text-sm text-gray-400 mb-4">Optionally add a note for the user (not shown to user currently, stored for records).</p>
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

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === tab.value
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500 self-center">{total} result{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No payments found.</div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex flex-wrap items-start gap-4">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-semibold text-sm">{p.user.name ?? "—"}</span>
                    <StatusBadge status={p.status} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      p.type === "pro"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-purple-500/20 text-purple-300"
                    }`}>
                      {p.type === "pro" ? "⭐ Pro" : `🪙 ${p.coins} coins`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{p.user.email}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                    <span>₹{p.amountInr}</span>
                    <span>UTR: <span className="font-mono text-gray-400">{p.utrNumber}</span></span>
                    <span>Submitted: {new Date(p.createdAt).toLocaleString()}</span>
                    {p.adminNote && <span className="text-red-400/70">Note: {p.adminNote}</span>}
                  </div>
                </div>

                {/* Right: actions (only for pending) */}
                {p.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => doAction(p.id, "approve")}
                      disabled={!!actionLoading}
                      className="text-xs px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg font-semibold transition-colors disabled:opacity-40 min-w-[90px] text-center"
                    >
                      {actionLoading === p.id ? "Working..." : "✓ Approve"}
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: p.id })}
                      disabled={!!actionLoading}
                      className="text-xs px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg font-semibold transition-colors disabled:opacity-40 min-w-[90px] text-center"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm disabled:opacity-40 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
