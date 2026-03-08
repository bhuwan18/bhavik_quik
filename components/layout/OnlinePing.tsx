"use client";

import { useEffect } from "react";

/** Silently pings /api/user/ping every 2 minutes to track online status */
export default function OnlinePing() {
  useEffect(() => {
    const ping = () => fetch("/api/user/ping", { method: "POST" }).catch(() => {});
    ping(); // immediate ping on mount
    const interval = setInterval(ping, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
