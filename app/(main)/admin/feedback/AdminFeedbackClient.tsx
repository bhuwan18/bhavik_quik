"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type FeedbackItem = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: { name: string | null; email: string | null; image: string | null };
};

const TYPE_COLORS: Record<string, string> = {
  "General": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Bug Report": "bg-red-500/20 text-red-300 border-red-500/30",
  "Feature Request": "bg-green-500/20 text-green-300 border-green-500/30",
  "Content Issue": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Other": "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const ALL_TYPES = ["All", "General", "Bug Report", "Feature Request", "Content Issue", "Other"];

export default function AdminFeedbackClient() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showUnread, setShowUnread] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState<string | null>(null); // id of item being sent
  const [replySent, setReplySent] = useState<Set<string>>(new Set());
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then((r) => r.json())
      .then((data) => { setItems(data.items ?? data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleRead = async (id: string, current: boolean) => {
    const next = !current;
    setItems((prev) => prev.map((f) => f.id === id ? { ...f, isRead: next } : f));
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isRead: next }),
    });
  };

  const sendReply = async (id: string) => {
    const text = replyText.trim();
    if (!text) return;
    setReplySending(id);
    setReplyError(null);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reply: text }),
      });
      if (res.ok) {
        setReplySent((prev) => new Set(prev).add(id));
        setItems((prev) => prev.map((f) => f.id === id ? { ...f, isRead: true } : f));
        setReplyingTo(null);
        setReplyText("");
      } else {
        const data = await res.json().catch(() => ({}));
        setReplyError(data.error ?? "Failed to send reply");
      }
    } catch {
      setReplyError("Network error — please try again");
    } finally {
      setReplySending(null);
    }
  };

  const filtered = items.filter((f) => {
    if (showUnread && f.isRead) return false;
    if (filter !== "All" && f.type !== filter) return false;
    return true;
  });

  const unreadCount = items.filter((f) => !f.isRead).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">💬 User Feedback</h1>
        <p className="text-sm text-gray-400">
          {items.length} total &nbsp;·&nbsp;
          <span className={unreadCount > 0 ? "text-purple-400 font-semibold" : "text-gray-500"}>
            {unreadCount} unread
          </span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === t
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            }`}
          >
            {t}
          </button>
        ))}
        <button
          onClick={() => setShowUnread((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ml-auto ${
            showUnread
              ? "bg-indigo-600 text-white border-indigo-500"
              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
          }`}
        >
          {showUnread ? "● Unread only" : "○ Show all"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading feedback…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400">No feedback here yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div
              key={f.id}
              className={`rounded-2xl border p-5 transition-all ${
                f.isRead
                  ? "bg-white/3 border-white/8 opacity-70"
                  : "bg-white/5 border-white/15 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: user + type */}
                <div className="flex items-center gap-3 min-w-0">
                  {f.user.image ? (
                    <Image src={f.user.image} alt="" width={32} height={32} className="rounded-full shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {f.user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{f.user.name ?? "Unknown"}</p>
                    <p className="text-xs text-gray-500 truncate">{f.user.email}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[f.type] ?? TYPE_COLORS["Other"]}`}>
                    {f.type}
                  </span>
                </div>

                {/* Right: date + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs text-gray-500">
                    {new Date(f.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === f.id ? null : f.id);
                        setReplyText("");
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                        replySent.has(f.id)
                          ? "text-green-400 border-green-500/30 bg-green-500/10"
                          : replyingTo === f.id
                          ? "text-purple-300 border-purple-500/40 bg-purple-500/15"
                          : "text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
                      }`}
                    >
                      {replySent.has(f.id) ? "✓ Replied" : replyingTo === f.id ? "Cancel" : "↩ Reply"}
                    </button>
                    <button
                      onClick={() => toggleRead(f.id, f.isRead)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-colors border ${
                        f.isRead
                          ? "text-gray-500 border-white/10 hover:text-white hover:border-white/20"
                          : "text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20"
                      }`}
                    >
                      {f.isRead ? "Mark unread" : "✓ Mark read"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Message */}
              <p className="mt-3 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap pl-11">
                {f.message}
              </p>

              {/* Reply input */}
              {replyingTo === f.id && (
                <div className="mt-4 pl-11">
                  <textarea
                    value={replyText}
                    onChange={(e) => { setReplyText(e.target.value); setReplyError(null); }}
                    placeholder="Type your reply… it will be sent to the user's notifications."
                    rows={3}
                    className="w-full bg-white/5 border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                  {replyError && (
                    <p className="text-xs text-red-400 mt-1">{replyError}</p>
                  )}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => sendReply(f.id)}
                      disabled={!replyText.trim() || replySending === f.id}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {replySending === f.id ? "Sending…" : "Send Reply"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
