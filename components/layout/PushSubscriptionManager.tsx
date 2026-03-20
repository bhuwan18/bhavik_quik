"use client";

import { useEffect, useState, startTransition } from "react";
import { useSession } from "next-auth/react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const DISMISSED_KEY = "bq_push_dismissed";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;
}

async function subscribeAndSave(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      }),
    });
  } catch {
    // Silently ignore — permission may have been revoked
  }
}

export default function PushSubscriptionManager() {
  const { data: session } = useSession();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const permission = Notification.permission;

    if (permission === "granted") {
      subscribeAndSave();
    } else if (permission === "default") {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) startTransition(() => setShowBanner(true));
    }
    // "denied" — respect user's choice, do nothing
  }, [session?.user?.id]);

  const handleEnable = async () => {
    setShowBanner(false);
    const result = await Notification.requestPermission();
    if (result === "granted") {
      await subscribeAndSave();
    } else {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
        <span className="text-2xl shrink-0">🔔</span>
        <p className="flex-1 text-sm leading-snug">
          Enable push notifications to know when you&apos;re overtaken on the leaderboard.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleEnable}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Enable
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
