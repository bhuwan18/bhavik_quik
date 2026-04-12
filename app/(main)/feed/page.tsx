"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, ChevronDown, Send, Trophy, Flame, Star, Package, RotateCcw, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedUser = { id: string; name: string | null; image: string | null };

type FeedItem = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  user: FeedUser;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  isOwn: boolean;
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: FeedUser;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function ActivityIcon({ type }: { type: string }) {
  const base = "w-8 h-8 rounded-xl flex items-center justify-center shrink-0";
  switch (type) {
    case "quiz_completed":
      return <div className={cn(base, "bg-blue-500/20")}><Star size={16} className="text-blue-400" /></div>;
    case "milestone_earned":
      return <div className={cn(base, "bg-amber-500/20")}><Trophy size={16} className="text-amber-400" /></div>;
    case "quizlet_earned":
      return <div className={cn(base, "bg-purple-500/20")}><Package size={16} className="text-purple-400" /></div>;
    case "streak_milestone":
      return <div className={cn(base, "bg-orange-500/20")}><Flame size={16} className="text-orange-400" /></div>;
    case "user_returned":
      return <div className={cn(base, "bg-teal-500/20")}><RotateCcw size={16} className="text-teal-400" /></div>;
    case "leaderboard_top3":
      return <div className={cn(base, "bg-yellow-500/20")}><Trophy size={16} className="text-yellow-400" /></div>;
    default:
      return <div className={cn(base, "bg-white/10")}><Star size={16} className="text-gray-400" /></div>;
  }
}

function ActivityBody({ type, data }: { type: string; data: Record<string, unknown> }) {
  switch (type) {
    case "quiz_completed": {
      const { quizTitle, score, total, coinsEarned } = data as {
        quizTitle: string; score: number; total: number; coinsEarned: number;
      };
      return (
        <p className="text-sm text-gray-200 leading-snug">
          Completed <span className="font-semibold text-white">{quizTitle}</span>{" "}
          <span className="text-blue-400 font-medium">{score}/{total}</span>
          {coinsEarned > 0 && (
            <span className="text-yellow-400 font-medium"> · +{coinsEarned} 🪙</span>
          )}
        </p>
      );
    }
    case "milestone_earned": {
      const { milestoneName, milestoneType } = data as { milestoneName: string; milestoneType: string };
      return (
        <p className="text-sm text-gray-200 leading-snug">
          Earned the <span className="font-semibold text-amber-300">{milestoneName}</span>{" "}
          milestone 🏅{" "}
          <span className="text-xs text-gray-500 capitalize">({milestoneType})</span>
        </p>
      );
    }
    case "quizlet_earned": {
      const { quizletName, rarity, icon, colorFrom, colorTo, source } = data as {
        quizletName: string; rarity: string; icon: string;
        colorFrom: string; colorTo: string; source: string;
      };
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-gray-200">
            {source === "mystical" ? "Unlocked a mystical quizlet ✨" : "Opened a pack and got:"}
          </p>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
          >
            <span>{icon}</span>
            <span>{quizletName}</span>
            <span className="opacity-70 capitalize text-[10px]">{rarity}</span>
          </span>
        </div>
      );
    }
    case "streak_milestone": {
      const { days } = data as { days: number };
      return (
        <p className="text-sm text-gray-200 leading-snug">
          Hit a <span className="font-semibold text-orange-400">{days}-day streak</span> 🔥
        </p>
      );
    }
    case "user_returned": {
      const { daysMissed } = data as { daysMissed: number };
      return (
        <p className="text-sm text-gray-200 leading-snug">
          Back after <span className="font-semibold text-teal-400">{daysMissed} days</span>! 👋
        </p>
      );
    }
    case "leaderboard_top3":
      return (
        <p className="text-sm text-gray-200 leading-snug">
          Joined the <span className="font-semibold text-yellow-400">Top 3</span> on the leaderboard! 🏆
        </p>
      );
    default:
      return <p className="text-sm text-gray-400">Activity</p>;
  }
}

function CommentsPanel({ activityId, initialCount }: { activityId: string; initialCount: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loaded) return;
    setLoading(true);
    fetch(`/api/feed/${activityId}/comments`)
      .then((r) => r.json())
      .then((data) => { setComments(data); setLoaded(true); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activityId, loaded]);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/feed/${activityId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setText("");
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
      {loading && <p className="text-xs text-gray-500 text-center py-2">Loading comments…</p>}
      {!loading && comments.length === 0 && initialCount === 0 && (
        <p className="text-xs text-gray-600 text-center py-1">No comments yet — be the first!</p>
      )}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2">
          {c.user.image ? (
            <Image src={c.user.image} alt="" width={24} height={24} className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
              {c.user.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-white">{c.user.name ?? "Unknown"}</span>
              <span className="text-xs text-gray-400 break-words">{c.text}</span>
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(c.createdAt)}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a comment…"
          maxLength={280}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
        />
        <button
          onClick={submit}
          disabled={!text.trim() || submitting}
          className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-40 transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function FeedCard({ item, onLike }: { item: FeedItem; onLike: (id: string, liked: boolean, count: number) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    const res = await fetch(`/api/feed/${item.id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked, likeCount } = await res.json();
      onLike(item.id, liked, likeCount);
    }
    setLiking(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/profile/${item.user.id}`} className="shrink-0">
          {item.user.image ? (
            <Image src={item.user.image} alt="" width={36} height={36} className="w-9 h-9 rounded-full ring-1 ring-white/20 hover:ring-purple-400 transition-all" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white ring-1 ring-white/20">
              {item.user.name?.[0] ?? "?"}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${item.user.id}`} className="text-sm font-semibold text-white hover:text-purple-300 transition-colors truncate block">
            {item.isOwn ? "You" : (item.user.name ?? "Unknown")}
          </Link>
          <p className="text-xs text-gray-500">{timeAgo(item.createdAt)}</p>
        </div>
        <ActivityIcon type={item.type} />
      </div>

      {/* Body */}
      <ActivityBody type={item.type} data={item.data} />

      {/* Footer */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleLike}
          disabled={liking}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors",
            item.liked ? "text-red-400 hover:text-red-300" : "text-gray-500 hover:text-red-400"
          )}
        >
          <Heart size={15} className={cn("transition-all", item.liked && "fill-current")} />
          <span>{item.likeCount > 0 ? item.likeCount : ""}</span>
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium transition-colors",
            showComments ? "text-purple-400" : "text-gray-500 hover:text-purple-400"
          )}
        >
          <MessageCircle size={15} />
          <span>{item.commentCount > 0 ? item.commentCount : "Comment"}</span>
        </button>
      </div>

      {showComments && <CommentsPanel activityId={item.id} initialCount={item.commentCount} />}
    </div>
  );
}

export default function FeedPage() {
  const [activities, setActivities] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (page: number, append = false) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/feed?page=${page}`);
      const data = await res.json();
      setActivities((prev) => append ? [...prev, ...data.activities] : data.activities);
      setHasMore(data.hasMore);
      setNextPage(data.nextPage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchPage(1); }, []);

  const handleLike = (id: string, liked: boolean, likeCount: number) => {
    setActivities((prev) => prev.map((a) => a.id === id ? { ...a, liked, likeCount } : a));
  };

  return (
    <div className="p-4 pb-24 md:p-8 md:pb-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-grotesk)" }}>
          📡 Feed
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Your activity and updates from players you follow</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-5xl mb-4">🌱</div>
          <p className="text-gray-300 font-semibold text-lg">Nothing here yet</p>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
            Complete a quiz or follow other players to see activity here.
          </p>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm font-medium rounded-xl transition-colors"
          >
            <Users size={15} />
            Find players to follow
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {activities.map((item) => (
              <FeedCard key={item.id} item={item} onLike={handleLike} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => nextPage && fetchPage(nextPage, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
                ) : (
                  <ChevronDown size={16} />
                )}
                Load more
              </button>
            </div>
          )}

          {!hasMore && activities.length > 0 && (
            <p className="text-center text-xs text-gray-600 mt-6">You&apos;re all caught up!</p>
          )}
        </>
      )}
    </div>
  );
}
