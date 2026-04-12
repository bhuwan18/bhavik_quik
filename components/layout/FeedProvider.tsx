"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "bq_feed_last_seen";

const FeedContext = createContext(false);

export function useHasNewFeed() {
  return useContext(FeedContext);
}

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [hasNew, setHasNew] = useState(false);

  // When user visits /feed, mark as seen
  useEffect(() => {
    if (pathname === "/feed") {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setHasNew(false);
    }
  }, [pathname]);

  // On every route change, check if there's a newer feed activity than last seen
  useEffect(() => {
    if (!session?.user || pathname === "/feed") return;

    fetch("/api/feed?page=1")
      .then((r) => r.json())
      .then((data: { activities?: { createdAt: string }[] }) => {
        if (!Array.isArray(data.activities) || data.activities.length === 0) return;
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        const newest = data.activities[0].createdAt;
        if (!lastSeen || new Date(newest) > new Date(lastSeen)) {
          setHasNew(true);
        }
      })
      .catch(() => {});
  }, [session, pathname]);

  return (
    <FeedContext.Provider value={hasNew}>
      {children}
    </FeedContext.Provider>
  );
}
