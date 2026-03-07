"use client";

import { useEffect, useState, useCallback } from "react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  coins: number;
  isAdmin: boolean;
  isLocked: boolean;
  isPro: boolean;
  proExpiresAt: string | null;
  dailyCoinsEarned: number;
  dailyCoinsReset: string;
  totalCorrect: number;
  totalAnswered: number;
  createdAt: string;
  _count: { quizAttempts: number; ownedQuizlets: number };
};

type Action = "lock" | "unlock" | "reset_daily" | "grant_pro" | "revoke_pro";

const DAILY_LIMIT_REGULAR = 100;
const DAILY_LIMIT_PRO = 500;

function DailyBar({ user }: { user: UserRow }) {
  const isProActive = user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
  const limit = isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;
  const now = new Date();
  const resetDate = new Date(user.dailyCoinsReset);
  const isNewDay =
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth() ||
    now.getUTCDate() !== resetDate.getUTCDate();
  const earned = isNewDay ? 0 : user.dailyCoinsEarned;
  const pct = Math.min(100, Math.round((earned / limit) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-white/10 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${pct >= 100 ? "bg-red-400" : "bg-indigo-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{earned}/{limit}</span>
    </div>
  );
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const limit = 20;

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        showToast("Failed to load users", false);
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const doAction = async (userId: string, action: Action, label: string) => {
    setActionLoading(`${userId}-${action}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      showToast(`${label} — done`, true);
      fetchUsers();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">User Manager</h1>
          <p className="text-gray-400 text-sm">
            Lock/unlock accounts, reset daily coin limits, and manage Pro access.
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>{total} total users</div>
          <div className="mt-0.5">Page {page} of {Math.max(1, totalPages)}</div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl transition-all ${
          toast.ok
            ? "bg-green-500/20 border border-green-500/40 text-green-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"
        }`}>
          {toast.ok ? "✓" : "✗"} {toast.text}
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value.slice(0, 100))}
          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Locked</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Pro</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Admin</span>
      </div>

      {/* User table */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No users found.</div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const isProActive = user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
            return (
              <div
                key={user.id}
                className={`border rounded-2xl p-5 transition-colors ${
                  user.isLocked
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex flex-wrap items-start gap-4">
                  {/* Left: user info */}
                  <div className="flex-1 min-w-0">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-semibold text-sm ${user.isLocked ? "text-gray-400 line-through" : "text-white"}`}>
                        {user.name ?? "—"}
                      </span>
                      {user.isAdmin && (
                        <span className="text-xs bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                      )}
                      {isProActive && (
                        <span className="text-xs bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-2 py-0.5 rounded-full font-bold">PRO</span>
                      )}
                      {user.isLocked && (
                        <span className="text-xs bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full font-bold">LOCKED</span>
                      )}
                    </div>

                    {/* Email */}
                    <p className="text-xs text-gray-500 mb-2">{user.email}</p>

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                      <span>🪙 {user.coins.toLocaleString()} coins</span>
                      <span>✅ {user.totalCorrect}/{user.totalAnswered} correct</span>
                      <span>🎴 {user._count.ownedQuizlets} quizlets</span>
                      <span>📝 {user._count.quizAttempts} attempts</span>
                      <span>📆 {new Date(user.createdAt).toLocaleDateString()}</span>
                      {isProActive && user.proExpiresAt && (
                        <span className="text-yellow-500/70">Pro until {new Date(user.proExpiresAt).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Daily coins bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-600">Daily coins:</span>
                      <DailyBar user={user} />
                    </div>
                  </div>

                  {/* Right: action buttons — hidden for admin accounts */}
                  {!user.isAdmin && (
                    <div className="flex flex-col gap-2 shrink-0">
                      {/* Lock / Unlock */}
                      <button
                        onClick={() => doAction(
                          user.id,
                          user.isLocked ? "unlock" : "lock",
                          user.isLocked ? "Account unlocked" : "Account locked"
                        )}
                        disabled={!!actionLoading}
                        className={cn(
                          "text-xs px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40 min-w-[110px] text-center",
                          user.isLocked
                            ? "bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                            : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                        )}
                      >
                        {actionLoading === `${user.id}-${user.isLocked ? "unlock" : "lock"}`
                          ? "Working..."
                          : user.isLocked ? "🔓 Unlock" : "🔒 Lock"}
                      </button>

                      {/* Reset daily coins */}
                      <button
                        onClick={() => doAction(user.id, "reset_daily", "Daily limit reset")}
                        disabled={!!actionLoading}
                        className="text-xs px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg font-semibold transition-colors disabled:opacity-40 min-w-[110px] text-center"
                      >
                        {actionLoading === `${user.id}-reset_daily` ? "Working..." : "🔄 Reset Daily"}
                      </button>

                      {/* Grant / Revoke Pro */}
                      <button
                        onClick={() => doAction(
                          user.id,
                          isProActive ? "revoke_pro" : "grant_pro",
                          isProActive ? "Pro revoked" : "Pro granted (30 days)"
                        )}
                        disabled={!!actionLoading}
                        className={cn(
                          "text-xs px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40 min-w-[110px] text-center",
                          isProActive
                            ? "bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/30"
                            : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                        )}
                      >
                        {actionLoading === `${user.id}-${isProActive ? "revoke_pro" : "grant_pro"}`
                          ? "Working..."
                          : isProActive ? "✖ Revoke Pro" : "⭐ Grant Pro"}
                      </button>
                    </div>
                  )}

                  {user.isAdmin && (
                    <div className="shrink-0 text-xs text-purple-400/50 italic self-center">
                      Admin account — no actions
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

// Helper (inline since we can't import from utils in this client component easily)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
