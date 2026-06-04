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
    if (pathname !== "/feed") return;
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    // Defer state update to avoid synchronous setState in effect body
    const id = setTimeout(() => setHasNew(false), 0);
    return () => clearTimeout(id);
  }, [pathname]);

  // Check once on session load whether there's a newer feed activity than last seen
  useEffect(() => {
    if (!session?.user) return;

    fetch("/api/feed/latest")
      .then((r) => r.json())
      .then((data: { createdAt?: string }) => {
        if (!data.createdAt) return;
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        if (!lastSeen || new Date(data.createdAt) > new Date(lastSeen)) {
          setHasNew(true);
        }
      })
      .catch(() => {});
  }, [session]);

  return (
    <FeedContext.Provider value={hasNew}>
      {children}
    </FeedContext.Provider>
  );
}
