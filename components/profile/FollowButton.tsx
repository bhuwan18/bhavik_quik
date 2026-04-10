"use client";

import { useState } from "react";

type Props = {
  targetUserId: string;
  initialIsFollowing: boolean;
};

export default function FollowButton({ targetUserId, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const next = !isFollowing;
    setIsFollowing(next);
    setPending(true);
    try {
      const res = await fetch(`/api/user/follow/${targetUserId}`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) setIsFollowing(!next); // rollback on failure
    } catch {
      setIsFollowing(!next); // rollback on network error
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`px-5 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${
        isFollowing
          ? "bg-white/10 border border-white/10 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
          : "bg-amber-500 hover:bg-amber-400 text-black"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
