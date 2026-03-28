"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const NotificationsContext = createContext(0);

export function useUnreadCount() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: { isRead: boolean }[]) => {
        if (Array.isArray(data)) setUnreadCount(data.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  }, [session, pathname]);

  return (
    <NotificationsContext.Provider value={unreadCount}>
      {children}
    </NotificationsContext.Provider>
  );
}
