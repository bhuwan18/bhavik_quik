"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, ChevronDown, Send, Trophy, Flame, Star, Package, RotateCcw, Users, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedUser = { id: string; name: string | null; image: string | null; lastSeenAt?: string | null };

type FeedReaction = { emoji: string; count: number; reacted: boolean };

type FeedItem = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  user: FeedUser;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  reactions: FeedReaction[];
  isOwn: boolean;
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: FeedUser;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_THEME: Record<string, { border: string; gradient: string }> = {
  quiz_completed:   { border: "border-blue-500/25",   gradient: "from-blue-500/8" },
  milestone_earned: { border: "border-amber-500/30",  gradient: "from-amber-500/8" },
  quizlet_earned:   { border: "border-purple-500/30", gradient: "from-purple-500/8" },
  streak_milestone: { border: "border-orange-500/30", gradient: "from-orange-500/10" },
  leaderboard_top3: { border: "border-yellow-500/35", gradient: "from-yellow-500/10" },
  user_returned:    { border: "border-teal-500/25",   gradient: "from-teal-500/8" },
};

const TIER_BADGE: Record<string, { text: string; bg: string; border: string }> = {
  bronze:   { text: "text-amber-600",  bg: "bg-amber-900/30",  border: "border-amber-700/40" },
  silver:   { text: "text-gray-300",   bg: "bg-gray-700/30",   border: "border-gray-500/40" },
  gold:     { text: "text-yellow-400", bg: "bg-yellow-900/30", border: "border-yellow-600/40" },
  platinum: { text: "text-cyan-300",   bg: "bg-cyan-900/30",   border: "border-cyan-600/40" },
  diamond:  { text: "text-blue-300",   bg: "bg-blue-900/30",   border: "border-blue-600/40" },
  cosmic:   { text: "text-purple-300", bg: "bg-purple-900/30", border: "border-purple-500/40" },
};

const RARITY_ANIM: Record<string, string> = {
  legendary: "legendary-card",
  impossible: "rainbow-card",
  unique: "rainbow-card",
  mystical: "mystical-card",
};

const REACTION_EMOJIS = ["🔥", "🎉", "👏", "😱"] as const;

const FILTER_TABS = [
  { key: "all",              label: "All" },
  { key: "quiz_completed",   label: "Quizzes" },
  { key: "milestone_earned", label: "Milestones" },
  { key: "streak_milestone", label: "Streaks" },
  { key: "quizlet_earned",   label: "Quizlets" },
] as const;

const SOUND_COLORS = ["#d32f2f","#212121","#5d4037","#c2185b","#00acc1","#f0f0dc","#43a047","#1a237e","#c6d400"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashColor(slug: string): string {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) & 0xfffffff;
  return SOUND_COLORS[h % SOUND_COLORS.length];
}

function isOnline(lastSeenAt?: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}

function extractRichContent(text: string) {
  const trimmed = text.trim();
  const soundMatch = trimmed.match(/https:\/\/www\.myinstants\.com\/(?:en\/)?instant\/([^/?#\s]+)[^\s]*/);
  if (soundMatch) {
    const slug = soundMatch[1];
    const isPure = trimmed === soundMatch[0];
    return { displayText: isPure ? null : text.replace(soundMatch[0], "").trim() || null, gifUrl: null, soundUrl: `https://www.myinstants.com/en/instant/${slug}/`, soundSlug: slug };
  }
  const gifMatch = trimmed.match(/https:\/\/\S+\.gif(?:\?\S*)?/) ||
    trimmed.match(/https:\/\/(?:media\.tenor\.com|c\.tenor\.com|media\.giphy\.com|i\.giphy\.com|media[12]\.giphy\.com)\/\S+/);
  if (gifMatch) {
    const gifUrl = gifMatch[0];
    const isPure = trimmed === gifUrl;
    return { displayText: isPure ? null : text.replace(gifUrl, "").trim() || null, gifUrl, soundUrl: null, soundSlug: null };
  }
  return { displayText: text, gifUrl: null, soundUrl: null, soundSlug: null };
}

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

// ─── SoundButton ──────────────────────────────────────────────────────────────

function SoundButton({ slug, url }: { slug: string; url: string }) {
  const [state, setState] = useState<"resolving" | "idle" | "loading" | "playing" | "error">("resolving");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedUrl = useRef<string | null>(null);
  const color = hashColor(slug);
  const isPlaying = state === "playing";

  const resolve = () => {
    setState("resolving");
    fetch(`/api/myinstants-proxy?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.proxyUrl) { resolvedUrl.current = d.proxyUrl; setState("idle"); }
        else setState("error");
      })
      .catch(() => setState("error"));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resolve(); }, [slug]);

  const toggle = () => {
    if (isPlaying) { audioRef.current?.pause(); audioRef.current = null; setState("idle"); return; }
    // Tap on error = retry the pre-fetch (user taps again once resolved)
    if (state === "error") { resolve(); return; }
    if (state !== "idle" || !resolvedUrl.current) return;
    setState("loading");
    const audio = new Audio(resolvedUrl.current);
    audioRef.current = audio;
    audio.onplaying = () => setState("playing");
    audio.onended = () => setState("idle");
    audio.onerror = () => setState("idle");
    audio.play().catch(() => setState("idle"));
  };

  const label = slug.replace(/-/g, " ");
  return (
    <div className="flex flex-col items-center gap-1.5 mt-2" style={{ width: 80 }}>
      <button
        onClick={toggle}
        aria-label={`Play ${label}`}
        style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%), radial-gradient(circle at 50% 50%, ${color}, color-mix(in srgb, ${color} 55%, black))`,
          opacity: state === "resolving" ? 0.5 : 1,
          boxShadow: isPlaying
            ? "0 2px 6px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.5)"
            : "0 6px 18px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.35), inset 0 2px 6px rgba(255,255,255,0.15)",
          transform: isPlaying ? "scale(0.92) translateY(2px)" : "scale(1)",
          cursor: state === "resolving" ? "wait" : "pointer",
          transition: "transform 0.08s ease, box-shadow 0.08s ease",
          border: "none", outline: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}
      >
        {state === "resolving" && <span style={{ fontSize: 16, opacity: 0.6 }}>⏳</span>}
        {state === "loading"   && <span style={{ fontSize: 16 }}>⏳</span>}
        {state === "error"     && <span style={{ fontSize: 16 }}>⚠️</span>}
      </button>
      <span className="text-[10px] text-gray-400 text-center leading-tight capitalize" style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

// ─── ActivityIcon ─────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  const base = "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm";
  switch (type) {
    case "quiz_completed":   return <div className={cn(base, "bg-blue-500/25")}><Star size={18} className="text-blue-400" /></div>;
    case "milestone_earned": return <div className={cn(base, "bg-amber-500/25")}><Trophy size={18} className="text-amber-400" /></div>;
    case "quizlet_earned":   return <div className={cn(base, "bg-purple-500/25")}><Package size={18} className="text-purple-400" /></div>;
    case "streak_milestone": return <div className={cn(base, "bg-orange-500/25")}><Flame size={18} className="text-orange-400" /></div>;
    case "user_returned":    return <div className={cn(base, "bg-teal-500/25")}><RotateCcw size={18} className="text-teal-400" /></div>;
    case "leaderboard_top3": return <div className={cn(base, "bg-yellow-500/25")}><Trophy size={18} className="text-yellow-400" /></div>;
    default:                 return <div className={cn(base, "bg-white/10")}><Star size={18} className="text-gray-400" /></div>;
  }
}

// ─── ActivityBody ─────────────────────────────────────────────────────────────

function ActivityBody({ type, data }: { type: string; data: Record<string, unknown> }) {
  const feedFont = { fontFamily: "var(--font-nunito), var(--font-jakarta), sans-serif" };

  switch (type) {
    case "quiz_completed": {
      const { quizId, quizTitle, category, score, total, coinsEarned } = data as {
        quizId?: string; quizTitle: string; category?: string; score: number; total: number; coinsEarned: number;
      };
      const isPerfect = score === total;
      const dotCount = Math.min(total, 10);
      const filledDots = Math.round((score / total) * dotCount);
      return (
        <div className="space-y-2" style={feedFont}>
          <p className="text-sm text-gray-200 leading-snug font-semibold">
            Completed <span className="text-white">{quizTitle}</span>
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 items-center">
              {Array.from({ length: dotCount }).map((_, i) => (
                <span key={i} className={cn("w-2 h-2 rounded-full inline-block", i < filledDots ? "bg-green-400" : "bg-white/15")} />
              ))}
            </div>
            <span className="text-blue-400 font-bold text-sm">{score}/{total}</span>
            {isPerfect && (
              <span className="text-[10px] font-extrabold text-green-400 bg-green-400/15 border border-green-400/25 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                Perfect! ✓
              </span>
            )}
            {coinsEarned > 0 && (
              <span className="text-yellow-400 text-xs font-bold bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">
                +{coinsEarned} 🪙
              </span>
            )}
            {category && (
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full capitalize">
                {category.replace(/-/g, " ")}
              </span>
            )}
          </div>
          {quizId && (
            <Link
              href={`/quiz/${quizId}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 px-2.5 py-1 rounded-xl transition-colors"
            >
              <Play size={11} className="fill-current" />
              Challenge — beat this score!
            </Link>
          )}
        </div>
      );
    }
    case "milestone_earned": {
      const { milestoneName, milestoneType, tier } = data as {
        milestoneName: string; milestoneType: string; tier?: string;
      };
      const tierStyle = (tier ? TIER_BADGE[tier] : undefined) ?? TIER_BADGE.bronze;
      return (
        <div className="space-y-1.5" style={feedFont}>
          <p className="text-sm text-gray-200">Earned a new milestone badge 🏅</p>
          <div className="flex items-center gap-2 flex-wrap">
            {tier && (
              <span className={cn("text-xs font-extrabold px-2 py-0.5 rounded-full border capitalize", tierStyle.text, tierStyle.bg, tierStyle.border)}>
                {tier}
              </span>
            )}
            <span className="font-extrabold text-amber-300 text-base">{milestoneName}</span>
            <span className="text-xs text-gray-500 capitalize">· {milestoneType}</span>
          </div>
        </div>
      );
    }
    case "quizlet_earned": {
      const { quizletName, rarity, icon, colorFrom, colorTo, source } = data as {
        quizletName: string; rarity: string; icon: string;
        colorFrom: string; colorTo: string; source: string;
      };
      const animClass = RARITY_ANIM[rarity] ?? "";
      return (
        <div className="space-y-2" style={feedFont}>
          <p className="text-sm text-gray-200 font-semibold">
            {source === "mystical" ? "Unlocked a mystical quizlet ✨" : "Opened a pack and got:"}
          </p>
          <span
            className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white border border-white/15", animClass)}
            style={{ background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }}
          >
            <span className="text-lg">{icon}</span>
            <span>{quizletName}</span>
            <span className="opacity-70 capitalize text-xs font-semibold">{rarity}</span>
          </span>
        </div>
      );
    }
    case "streak_milestone": {
      const { days } = data as { days: number };
      return (
        <div className="flex items-center gap-3" style={feedFont}>
          <div className="text-3xl leading-none">{days >= 50 ? "🌋" : "🔥"}</div>
          <div>
            <p className="font-extrabold text-orange-400 text-base">{days}-day streak!</p>
            <p className="text-xs text-gray-500">Keep the fire going 💪</p>
          </div>
        </div>
      );
    }
    case "user_returned": {
      const { daysMissed } = data as { daysMissed: number };
      return (
        <div className="flex items-center gap-2" style={feedFont}>
          <span className="text-2xl leading-none">👋</span>
          <div>
            <p className="text-sm text-gray-200 font-semibold">
              Back after <span className="text-teal-400">{daysMissed} days</span>!
            </p>
            <p className="text-xs text-gray-500">Welcome back</p>
          </div>
        </div>
      );
    }
    case "leaderboard_top3": {
      const { rank } = data as { rank?: number };
      const medals = ["🥇", "🥈", "🥉"];
      const medal = rank ? (medals[rank - 1] ?? "🏆") : "🏆";
      return (
        <div className="flex items-center gap-3" style={feedFont}>
          <span className="text-3xl leading-none">{medal}</span>
          <div>
            <p className="font-extrabold text-yellow-400 text-base">
              {rank ? `#${rank} on the Leaderboard!` : "Joined the Top 3!"}
            </p>
            <p className="text-xs text-gray-500">Absolutely crushing it 🔥</p>
          </div>
        </div>
      );
    }
    default:
      return <p className="text-sm text-gray-400">Activity</p>;
  }
}

// ─── CommentsPanel ────────────────────────────────────────────────────────────

function CommentsPanel({
  activityId,
  initialCount,
  onReplyTo,
}: {
  activityId: string;
  initialCount: number;
  onReplyTo?: (name: string) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loaded) return;
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

  const handleReply = (name: string) => {
    setText(`@${name} `);
    inputRef.current?.focus();
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
      {loading && <p className="text-xs text-gray-500 text-center py-2">Loading comments…</p>}
      {!loading && comments.length === 0 && initialCount === 0 && (
        <p className="text-xs text-gray-600 text-center py-1">No comments yet — be the first! 👀</p>
      )}
      {comments.map((c) => {
        const { displayText, gifUrl, soundUrl, soundSlug } = extractRichContent(c.text);
        return (
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
                <button
                  onClick={() => handleReply(c.user.name ?? "user")}
                  className="text-xs font-bold text-white hover:text-purple-300 transition-colors"
                >
                  {c.user.name ?? "Unknown"}
                </button>
                {displayText && <span className="text-xs text-gray-400 break-words" style={{ fontFamily: "var(--font-nunito), var(--font-jakarta), sans-serif" }}>{displayText}</span>}
              </div>
              {gifUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gifUrl} alt="gif" className="mt-1 rounded-lg max-w-[200px] max-h-[150px] object-contain block" />
              )}
              {soundUrl && soundSlug && <SoundButton slug={soundSlug} url={soundUrl} />}
              <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
        );
      })}
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a comment…"
          maxLength={500}
          style={{ fontFamily: "var(--font-nunito), var(--font-jakarta), sans-serif" }}
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
      {!text && (
        <p className="text-[10px] text-gray-600 px-1">Tip: paste a .gif URL or myinstants link to embed</p>
      )}
    </div>
  );
}

// ─── FeedCard ─────────────────────────────────────────────────────────────────

function FeedCard({ item, index, onLike, onReact }: {
  item: FeedItem;
  index: number;
  onLike: (id: string, liked: boolean, count: number) => void;
  onReact: (id: string, emoji: string, reactions: FeedReaction[]) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [reactingEmoji, setReactingEmoji] = useState<string | null>(null);
  const [nudging, setNudging] = useState(false);
  const [nudged, setNudged] = useState(false);

  const handleNudge = async () => {
    if (nudging || nudged) return;
    setNudging(true);
    const res = await fetch(`/api/feed/nudge/${item.user.id}`, { method: "POST" });
    if (res.ok || (await res.json().catch(() => ({}))).alreadySent) setNudged(true);
    setNudging(false);
  };

  const theme = ACTIVITY_THEME[item.type] ?? { border: "border-white/10", gradient: "from-white/5" };
  const online = isOnline(item.user.lastSeenAt);
  const isAchievement = item.type === "milestone_earned" || item.type === "quizlet_earned";

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    setJustLiked(true);
    setTimeout(() => setJustLiked(false), 400);
    const res = await fetch(`/api/feed/${item.id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked, likeCount } = await res.json();
      onLike(item.id, liked, likeCount);
    }
    setLiking(false);
  };

  const handleReact = async (emoji: string) => {
    if (reactingEmoji) return;
    setReactingEmoji(emoji);
    const res = await fetch(`/api/feed/${item.id}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const { reactions } = await res.json();
      onReact(item.id, emoji, reactions);
    }
    setReactingEmoji(null);
  };

  // Merge existing reactions into a full map (show all 4 always)
  const reactionMap = new Map(item.reactions.map((r) => [r.emoji, r]));

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 space-y-3 feed-card-in bg-gradient-to-br to-transparent",
        theme.border,
        theme.gradient
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/profile/${item.user.id}`} className="shrink-0 relative">
          {item.user.image ? (
            <Image
              src={item.user.image}
              alt=""
              width={36}
              height={36}
              className={cn(
                "w-9 h-9 rounded-full ring-2 hover:ring-purple-400 transition-all",
                item.isOwn ? "ring-purple-500/60" : "ring-white/20"
              )}
            />
          ) : (
            <div className={cn(
              "w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white ring-2",
              item.isOwn ? "ring-purple-500/60" : "ring-white/20"
            )}>
              {item.user.name?.[0] ?? "?"}
            </div>
          )}
          {online && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[var(--background)]" />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${item.user.id}`}
            className="text-sm font-bold text-white hover:text-purple-300 transition-colors truncate block"
            style={{ fontFamily: "var(--font-nunito), var(--font-jakarta), sans-serif" }}
          >
            {item.isOwn ? "You" : (item.user.name ?? "Unknown")}
          </Link>
          <p className="text-xs text-gray-500">{timeAgo(item.createdAt)}</p>
        </div>
        <ActivityIcon type={item.type} />
      </div>

      {/* Achievement badge */}
      {isAchievement && (
        <div className="flex items-center gap-1.5 -mt-1 mb-0.5">
          <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest" style={{ fontFamily: "var(--font-nunito), sans-serif" }}>
            ✨ Achievement Unlocked
          </span>
        </div>
      )}

      {/* Body */}
      <ActivityBody type={item.type} data={item.data} />

      {/* Footer */}
      <div className="flex items-center gap-3 pt-1 flex-wrap">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={liking}
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold transition-colors",
            item.liked ? "text-red-400 hover:text-red-300" : "text-gray-500 hover:text-red-400"
          )}
        >
          <Heart size={15} className={cn("transition-colors", item.liked && "fill-current", justLiked && "heart-pop")} />
          <span>{item.likeCount > 0 ? item.likeCount : ""}</span>
        </button>

        {/* Emoji reactions */}
        {REACTION_EMOJIS.map((emoji) => {
          const r = reactionMap.get(emoji);
          const reacted = r?.reacted ?? false;
          const count = r?.count ?? 0;
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              disabled={!!reactingEmoji}
              className={cn(
                "flex items-center gap-1 text-xs font-bold rounded-lg px-1.5 py-0.5 transition-all",
                reacted
                  ? "bg-white/15 text-white scale-105"
                  : "text-gray-500 hover:text-white hover:bg-white/10"
              )}
            >
              <span className="text-sm leading-none">{emoji}</span>
              {count > 0 && <span className={reacted ? "text-white" : "text-gray-400"}>{count}</span>}
            </button>
          );
        })}

        {/* Comment */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold transition-colors ml-auto",
            showComments ? "text-purple-400" : "text-gray-500 hover:text-purple-400"
          )}
        >
          <MessageCircle size={15} />
          <span>{item.commentCount > 0 ? item.commentCount : "Comment"}</span>
        </button>

        {/* Nudge (non-own only) */}
        {!item.isOwn && (
          <button
            onClick={handleNudge}
            disabled={nudging}
            title={nudged ? "Nudge sent!" : "Nudge to practice"}
            className={cn(
              "flex items-center gap-1 text-xs font-bold transition-all",
              nudged ? "text-green-400" : "text-gray-500 hover:text-yellow-400"
            )}
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}
          >
            <span className="text-sm leading-none">{nudged ? "✓" : "👊"}</span>
            <span>{nudged ? "Nudged!" : "Nudge"}</span>
          </button>
        )}
      </div>

      {showComments && <CommentsPanel activityId={item.id} initialCount={item.commentCount} />}
    </div>
  );
}

// ─── AchievementSpotlight ─────────────────────────────────────────────────────

function AchievementSpotlight({ activities }: { activities: FeedItem[] }) {
  const achievements = activities
    .filter((a) => !a.isOwn && (a.type === "milestone_earned" || a.type === "quizlet_earned"))
    .slice(0, 6);

  if (achievements.length === 0) return null;

  return (
    <div className="mb-4">
      <p
        className="text-[10px] font-extrabold text-amber-400/80 uppercase tracking-widest mb-2"
        style={{ fontFamily: "var(--font-nunito), sans-serif" }}
      >
        🏆 Recent Achievements
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {achievements.map((a) => {
          const isMilestone = a.type === "milestone_earned";
          const icon = isMilestone ? "🏅" : ((a.data.icon as string) ?? "🎴");
          const badgeName = isMilestone
            ? (a.data.milestoneName as string)
            : (a.data.quizletName as string);
          const firstName = (a.user.name ?? "?").split(" ")[0];
          const tier = isMilestone ? (a.data.tier as string | undefined) : undefined;
          const tierStyle = tier ? TIER_BADGE[tier] : null;
          return (
            <div
              key={a.id}
              className="shrink-0 flex flex-col items-center gap-1 bg-white/5 border border-amber-500/20 rounded-2xl px-3 py-2.5 min-w-[76px] max-w-[84px]"
              style={{ fontFamily: "var(--font-nunito), sans-serif" }}
            >
              <span className="text-2xl leading-none">{icon}</span>
              <span className="text-[11px] font-extrabold text-white text-center leading-tight truncate w-full text-center">{firstName}</span>
              {tierStyle && (
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize", tierStyle.text, tierStyle.bg, tierStyle.border)}>
                  {tier}
                </span>
              )}
              <span className="text-[9px] text-gray-500 text-center leading-tight w-full truncate text-center">{badgeName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FeedPage ─────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const [activities, setActivities] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

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

  const handleReact = (id: string, _emoji: string, reactions: FeedReaction[]) => {
    setActivities((prev) => prev.map((a) => a.id === id ? { ...a, reactions } : a));
  };

  const filtered = activeFilter === "all"
    ? activities
    : activities.filter((a) => a.type === activeFilter);

  return (
    <div className="p-4 pb-24 md:p-8 md:pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20 shrink-0">
            📡
          </div>
          <h1
            className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-nunito), var(--font-grotesk), sans-serif" }}
          >
            Feed
          </h1>
        </div>
        <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-nunito), var(--font-jakarta), sans-serif" }}>
          Your activity and updates from players you follow
        </p>
      </div>

      {/* Achievement spotlight row */}
      {!loading && <AchievementSpotlight activities={activities} />}

      {/* Filter tabs */}
      {!loading && activities.length > 0 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {FILTER_TABS.map((tab) => {
            const count = tab.key === "all" ? activities.length : activities.filter((a) => a.type === tab.key).length;
            if (tab.key !== "all" && count === 0) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all border",
                  activeFilter === tab.key
                    ? "bg-purple-500/30 border-purple-500/50 text-purple-200"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                )}
                style={{ fontFamily: "var(--font-nunito), var(--font-jakarta), sans-serif" }}
              >
                {tab.label}
                {tab.key !== "all" && <span className="ml-1 opacity-60">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/8 bg-white/4 p-4 animate-pulse h-20" />
          <div className="rounded-2xl border border-white/8 bg-white/4 p-4 animate-pulse h-28" />
          <div className="rounded-2xl border border-white/8 bg-white/4 p-4 animate-pulse h-20" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
          <div className="text-5xl mb-4">🌱</div>
          <p className="text-gray-300 font-bold text-lg" style={{ fontFamily: "var(--font-nunito), sans-serif" }}>Nothing here yet</p>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
            Complete a quiz or follow other players to see activity here.
          </p>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm font-bold rounded-xl transition-colors"
            style={{ fontFamily: "var(--font-nunito), sans-serif" }}
          >
            <Users size={15} />
            Find players to follow
          </Link>
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-12">No {activeFilter.replace("_", " ")} activity yet.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((item, index) => (
                <FeedCard key={item.id} item={item} index={index} onLike={handleLike} onReact={handleReact} />
              ))}
            </div>
          )}

          {hasMore && activeFilter === "all" && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => nextPage && fetchPage(nextPage, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                style={{ fontFamily: "var(--font-nunito), sans-serif" }}
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

          {!hasMore && activities.length > 0 && activeFilter === "all" && (
            <p className="text-center text-xs text-gray-600 mt-6" style={{ fontFamily: "var(--font-nunito), sans-serif" }}>
              You&apos;re all caught up! 🎉
            </p>
          )}
        </>
      )}
    </div>
  );
}
