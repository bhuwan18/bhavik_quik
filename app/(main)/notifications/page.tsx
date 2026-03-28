"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  overtaken:              { icon: "⬆️", label: "Overtaken",        color: "bg-red-500/15 border-red-500/30" },
  top3_join:              { icon: "🏆", label: "Top 3",            color: "bg-yellow-500/15 border-yellow-500/30" },
  feedback_reply:         { icon: "💬", label: "Admin Reply",      color: "bg-purple-500/15 border-purple-500/30" },
  admin_message:          { icon: "📣", label: "Admin",            color: "bg-blue-500/15 border-blue-500/30" },
  milestone:              { icon: "🏅", label: "Milestone",        color: "bg-amber-500/15 border-amber-500/30" },
  streak_milestone:       { icon: "🔥", label: "Streak",           color: "bg-orange-500/15 border-orange-500/30" },
  follow_milestone:       { icon: "👥", label: "Following",        color: "bg-amber-500/15 border-amber-500/30" },
  follow_streak_milestone:{ icon: "✨", label: "Following Streak", color: "bg-orange-500/15 border-orange-500/30" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => { setNotifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-4 pb-20 md:p-8 md:pb-0 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">🔔 Notifications</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount > 0 ? (
              <span className="text-purple-400 font-semibold">{unreadCount} unread</span>
            ) : (
              "All caught up!"
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-gray-400 hover:text-white px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-5xl mb-4">🔕</div>
          <p className="text-gray-400 font-medium">No notifications yet</p>
          <p className="text-gray-600 text-sm mt-1">You&apos;ll be notified when someone overtakes you or an admin replies to your feedback.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? { icon: "📌", label: n.type, color: "bg-white/5 border-white/10" };
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`rounded-2xl border p-4 flex gap-3 transition-all cursor-pointer ${
                  n.isRead ? "opacity-50 bg-white/3 border-white/8" : `${meta.color} hover:opacity-90`
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{meta.label}</span>
                    <span className="text-xs text-gray-600 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{" "}
                      {new Date(n.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-white leading-snug">{n.message}</p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
