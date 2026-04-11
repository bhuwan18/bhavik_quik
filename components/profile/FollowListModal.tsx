"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type FollowUser = { id: string; name: string | null; image: string | null };

type Props = {
  userId: string;
  followerCount: number;
  followingCount: number;
  canView: boolean;
};

export default function FollowListModal({
  userId,
  followerCount,
  followingCount,
  canView,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const [data, setData] = useState<{
    followers: FollowUser[] | null;
    following: FollowUser[] | null;
  }>({ followers: null, following: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const fetchTab = async (tab: "followers" | "following") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/${userId}/follow-list?type=${tab}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData((prev) => ({ ...prev, [tab]: json.users }));
    } catch {
      setError("Could not load the list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (tab: "followers" | "following") => {
    setActiveTab(tab);
    setOpen(true);
    if (data[tab] === null) fetchTab(tab);
  };

  const switchTab = (tab: "followers" | "following") => {
    setActiveTab(tab);
    if (data[tab] === null) fetchTab(tab);
  };

  const currentList = data[activeTab];

  return (
    <>
      <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/10">
        {canView ? (
          <button
            onClick={() => openModal("followers")}
            className="text-center group cursor-pointer"
            aria-label="View followers list"
          >
            <p className="text-xl font-bold text-white group-hover:text-[var(--accent)] transition-colors">
              {followerCount}
            </p>
            <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
              Followers
            </p>
          </button>
        ) : (
          <div className="text-center">
            <p className="text-xl font-bold text-white">{followerCount}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
        )}

        <div className="w-px h-8 bg-white/10" />

        {canView ? (
          <button
            onClick={() => openModal("following")}
            className="text-center group cursor-pointer"
            aria-label="View following list"
          >
            <p className="text-xl font-bold text-white group-hover:text-[var(--accent)] transition-colors">
              {followingCount}
            </p>
            <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
              Following
            </p>
          </button>
        ) : (
          <div className="text-center">
            <p className="text-xl font-bold text-white">{followingCount}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Followers and following"
                className="bg-[var(--surface)] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden"
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
                  <h2 className="text-base font-bold text-white">Connections</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-white/5"
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path
                        d="M4 4l10 10M14 4L4 14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 mt-4 flex-shrink-0">
                  {(["followers", "following"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => switchTab(tab)}
                      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        activeTab === tab
                          ? "border-b-2 border-[var(--accent)] text-white"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {tab === "followers"
                        ? `${followerCount} Followers`
                        : `${followingCount} Following`}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                    </div>
                  )}
                  {error && !loading && (
                    <div className="text-center py-12 px-4">
                      <p className="text-gray-500 text-sm">{error}</p>
                      <button
                        onClick={() => fetchTab(activeTab)}
                        className="mt-3 text-[var(--accent)] text-sm font-semibold hover:brightness-110 transition"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {!loading && !error && currentList !== null && currentList.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <p className="text-2xl mb-2">👤</p>
                      <p className="text-gray-500 text-sm">
                        {activeTab === "followers"
                          ? "No followers yet."
                          : "Not following anyone yet."}
                      </p>
                    </div>
                  )}
                  {!loading && !error && currentList !== null && currentList.length > 0 && (
                    <ul className="py-2">
                      {currentList.map((user) => (
                        <li key={user.id}>
                          <Link
                            href={`/profile/${user.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition-colors"
                          >
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name ?? ""}
                                width={36}
                                height={36}
                                className="rounded-full ring-1 ring-white/20 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                {user.name?.[0] ?? "?"}
                              </div>
                            )}
                            <span className="text-sm font-medium text-white truncate">
                              {user.name ?? "Anonymous"}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
