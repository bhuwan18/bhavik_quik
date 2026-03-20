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
  isMax: boolean;
  maxExpiresAt: string | null;
  dailyCoinsEarned: number;
  dailyCoinsReset: string;
  totalCorrect: number;
  totalAnswered: number;
  createdAt: string;
  _count: { quizAttempts: number; ownedQuizlets: number };
};

type Action = "lock" | "unlock" | "reset_daily" | "grant_pro" | "revoke_pro" | "grant_max" | "revoke_max";
type NotifyTarget = { userId: string; userName: string };

const DAILY_LIMIT_REGULAR = 500;
const DAILY_LIMIT_PRO = 1000;
const DAILY_LIMIT_MAX = 1500;

function DailyBar({ user }: { user: UserRow }) {
  const isMaxActive = user.isMax && (!user.maxExpiresAt || new Date(user.maxExpiresAt) > new Date());
  const isProActive = !isMaxActive && user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
  const limit = isMaxActive ? DAILY_LIMIT_MAX : isProActive ? DAILY_LIMIT_PRO : DAILY_LIMIT_REGULAR;
  const now = new Date();
  const resetDate = new Date(user.dailyCoinsReset);
  const isNewDay =
    now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
    now.getUTCMonth() !== resetDate.getUTCMonth() ||
    now.getUTCDate() !== resetDate.getUTCDate();
  const earned = isNewDay ? 0 : user.dailyCoinsEarned;
  const pct = Math.min(100, Math.round((earned / limit) * 100));
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="w-16 bg-white/10 rounded-full h-1.5 shrink-0">
        <div
          className={`h-1.5 rounded-full ${pct >= 100 ? "bg-red-400" : "bg-indigo-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{earned}/{limit}</span>
    </div>
  );
}

type Confirm = { userId: string; userName: string; action: Action; label: string };

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<NotifyTarget | null>(null);
  const [notifyForm, setNotifyForm] = useState({ title: "", body: "", url: "" });
  const [notifyLoading, setNotifyLoading] = useState(false);

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
      if (!res.ok) { showToast("Failed to load users", false); return; }
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const doAction = async (userId: string, action: Action, label: string) => {
    setConfirm(null);
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

  const requestAction = (userId: string, userName: string, action: Action, label: string) => {
    setConfirm({ userId, userName, action, label });
  };

  const sendNotify = async () => {
    if (!notifyTarget || !notifyForm.title.trim()) return;
    setNotifyLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${notifyTarget.userId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notifyForm.title.trim(),
          body: notifyForm.body.trim(),
          url: notifyForm.url.trim() || "/notifications",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      showToast(`Notification sent (${data.subscriptions} device${data.subscriptions !== 1 ? "s" : ""})`, true);
      setNotifyTarget(null);
      setNotifyForm({ title: "", body: "", url: "" });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Error", false);
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const ACTION_DESCRIPTIONS: Record<Action, string> = {
    lock: "lock this account (user will not be able to play)",
    unlock: "unlock this account",
    reset_daily: "reset the daily coin limit counter",
    grant_pro: "grant Pro tier for 30 days",
    revoke_pro: "revoke Pro tier immediately",
    grant_max: "grant Max tier for 30 days",
    revoke_max: "revoke Max tier immediately",
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">User Manager</h1>
        <p className="text-gray-400 text-sm">
          Manage accounts · {total} total users
        </p>
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--surface)] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-semibold text-base mb-1">Confirm action</h3>
            <p className="text-gray-400 text-sm mb-1">
              You are about to <span className="text-white">{ACTION_DESCRIPTIONS[confirm.action]}</span> for:
            </p>
            <p className="text-purple-300 font-medium text-sm mb-5 truncate">{confirm.userName}</p>
            <div className="flex gap-3">
              <button
                onClick={() => doAction(confirm.userId, confirm.action, confirm.label)}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify modal */}
      {notifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[var(--surface)] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-semibold text-base mb-1">Send Push Notification</h3>
            <p className="text-gray-400 text-sm mb-4 truncate">To: <span className="text-purple-300">{notifyTarget.userName}</span></p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. New quiz available!"
                  value={notifyForm.title}
                  onChange={(e) => setNotifyForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Body</label>
                <textarea
                  maxLength={300}
                  rows={3}
                  placeholder="Optional message body…"
                  value={notifyForm.body}
                  onChange={(e) => setNotifyForm((f) => ({ ...f, body: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">URL (optional)</label>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="/dashboard"
                  value={notifyForm.url}
                  onChange={(e) => setNotifyForm((f) => ({ ...f, url: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={sendNotify}
                disabled={notifyLoading || !notifyForm.title.trim()}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {notifyLoading ? "Sending…" : "Send"}
              </button>
              <button
                onClick={() => { setNotifyTarget(null); setNotifyForm({ title: "", body: "", url: "" }); }}
                disabled={notifyLoading}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value.slice(0, 100))}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No users found.</div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs text-gray-500 font-semibold">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Coins</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Correct</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Daily</th>
                  <th className="px-4 py-3 text-center">Tier</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isMaxActive = user.isMax && (!user.maxExpiresAt || new Date(user.maxExpiresAt) > new Date());
                  const isProActive = !isMaxActive && user.isPro && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
                  const tierExpiry = isMaxActive && user.maxExpiresAt
                    ? `Max → ${new Date(user.maxExpiresAt).toLocaleDateString()}`
                    : isProActive && user.proExpiresAt
                    ? `Pro → ${new Date(user.proExpiresAt).toLocaleDateString()}`
                    : null;

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-white/5 last:border-0 text-sm ${
                        user.isLocked ? "bg-red-500/5" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${user.isLocked ? "text-gray-500 line-through" : "text-white"}`}>
                            {user.name ?? "—"}
                          </span>
                          {user.isAdmin && <span className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">ADMIN</span>}
                          {user.isLocked && <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full">LOCKED</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          Joined {new Date(user.createdAt).toLocaleDateString()} · 🎴 {user._count.ownedQuizlets} · 📝 {user._count.quizAttempts}
                        </div>
                      </td>

                      {/* Coins */}
                      <td className="px-4 py-3 text-right text-yellow-400 font-mono hidden sm:table-cell">
                        {user.coins.toLocaleString()}
                      </td>

                      {/* Correct */}
                      <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">
                        {user.totalCorrect}/{user.totalAnswered}
                      </td>

                      {/* Daily bar */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <DailyBar user={user} />
                      </td>

                      {/* Tier */}
                      <td className="px-4 py-3 text-center">
                        {isMaxActive ? (
                          <div>
                            <span className="text-xs bg-pink-500/20 border border-pink-500/30 text-pink-300 px-2 py-0.5 rounded-full font-bold">MAX</span>
                            {tierExpiry && <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">{tierExpiry.split("→")[1]?.trim()}</div>}
                          </div>
                        ) : isProActive ? (
                          <div>
                            <span className="text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full font-bold">PRO</span>
                            {tierExpiry && <div className="text-xs text-gray-600 mt-1 whitespace-nowrap">{tierExpiry.split("→")[1]?.trim()}</div>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {user.isAdmin ? (
                          <span className="text-xs text-purple-400/40 italic">no actions</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            <button
                              onClick={() => requestAction(user.id, user.name ?? user.email, user.isLocked ? "unlock" : "lock", user.isLocked ? "Unlocked" : "Locked")}
                              disabled={!!actionLoading}
                              title={user.isLocked ? "Unlock account" : "Lock account"}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40 ${
                                user.isLocked
                                  ? "bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                                  : "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                              }`}
                            >
                              {actionLoading === `${user.id}-${user.isLocked ? "unlock" : "lock"}` ? "…" : user.isLocked ? "🔓" : "🔒"}
                            </button>

                            <button
                              onClick={() => requestAction(user.id, user.name ?? user.email, "reset_daily", "Daily reset")}
                              disabled={!!actionLoading}
                              title="Reset daily coin limit"
                              className="text-xs px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg font-semibold transition-colors disabled:opacity-40"
                            >
                              {actionLoading === `${user.id}-reset_daily` ? "…" : "🔄"}
                            </button>

                            <button
                              onClick={() => requestAction(user.id, user.name ?? user.email, isProActive ? "revoke_pro" : "grant_pro", isProActive ? "Pro revoked" : "Pro granted")}
                              disabled={!!actionLoading}
                              title={isProActive ? "Revoke Pro" : "Grant Pro (30 days)"}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40 ${
                                isProActive
                                  ? "bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/30"
                                  : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                              }`}
                            >
                              {actionLoading === `${user.id}-${isProActive ? "revoke_pro" : "grant_pro"}` ? "…" : isProActive ? "✖⭐" : "⭐"}
                            </button>

                            <button
                              onClick={() => requestAction(user.id, user.name ?? user.email, isMaxActive ? "revoke_max" : "grant_max", isMaxActive ? "Max revoked" : "Max granted")}
                              disabled={!!actionLoading}
                              title={isMaxActive ? "Revoke Max" : "Grant Max (30 days)"}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-40 ${
                                isMaxActive
                                  ? "bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 border border-gray-500/30"
                                  : "bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30"
                              }`}
                            >
                              {actionLoading === `${user.id}-${isMaxActive ? "revoke_max" : "grant_max"}` ? "…" : isMaxActive ? "✖👑" : "👑"}
                            </button>

                            <button
                              onClick={() => setNotifyTarget({ userId: user.id, userName: user.name ?? user.email })}
                              disabled={!!actionLoading || notifyLoading}
                              title="Send push notification"
                              className="text-xs px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg font-semibold transition-colors disabled:opacity-40"
                            >
                              🔔
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <span>🔒 Lock · 🔄 Reset daily · ⭐ Pro · 👑 Max · 🔔 Notify</span>
        <span>✖⭐ = revoke Pro · ✖👑 = revoke Max</span>
      </div>
    </div>
  );
}
