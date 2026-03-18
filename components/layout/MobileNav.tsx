"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/dashboard", icon: "📊", label: "Home" },
  { href: "/discover", icon: "🔍", label: "Discover" },
  { href: "/marketplace", icon: "🛒", label: "Packs" },
  { href: "/quizlets", icon: "🎴", label: "Quizlets" },
];

const MORE_NAV = [
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  { href: "/game", icon: "🎮", label: "Game Modes" },
  { href: "/feedback", icon: "💬", label: "Feedback" },
  { href: "/shop", icon: "🏪", label: "Upgrade" },
  { href: "/notifications", icon: "🔔", label: "Notifications" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const isLight = theme === "light";

  const user = session?.user as { isAdmin?: boolean; isPro?: boolean } | undefined;
  const isAdmin = !!user?.isAdmin;
  const isPro = !!user?.isPro;

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

  const isMoreActive = MORE_NAV.some(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-up More drawer */}
      <div
        className={cn(
          "fixed left-0 right-0 z-40 md:hidden transition-transform duration-300 ease-out",
          drawerOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          bottom: "56px",
          background: "linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-mid) 100%)",
          borderTop: "1px solid rgba(88,28,135,0.35)",
          borderRadius: "20px 20px 0 0",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* User profile row */}
        {session?.user && (
          <div className="px-4 pt-4 pb-3 border-b border-purple-800/20">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className={cn(
                    "rounded-full ring-2",
                    isPro ? "ring-yellow-400" : "ring-purple-500/50"
                  )}
                />
              ) : (
                <div className={cn(
                  "w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white ring-2",
                  isPro ? "ring-yellow-400" : "ring-purple-500/50"
                )}>
                  {session.user.name?.[0] ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-white truncate">{session.user.name}</p>
                  {isAdmin && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                      ADMIN
                    </span>
                  )}
                  {!isAdmin && isPro && (
                    <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-400 text-black px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
            </div>

            {/* Theme toggle + Sign out */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setTheme(isLight ? "dark" : "light")}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10 transition-colors border border-white/10"
              >
                <span>{isLight ? "🌙" : "☀️"}</span>
                <span>{isLight ? "Dark Mode" : "Light Mode"}</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
              >
                <span>↩</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Nav grid */}
        <div className="p-3">
          <p className="text-xs font-bold text-purple-400/60 uppercase tracking-widest px-1 mb-2">Pages</p>
          <div className="grid grid-cols-3 gap-1">
            {MORE_NAV.map(({ href, icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              const isNotif = href === "/notifications";
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-colors relative",
                    active
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="text-2xl leading-none relative">
                    {icon}
                    {isNotif && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border border-black text-[8px] font-bold text-white flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="text-center leading-tight">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{
          background: "linear-gradient(180deg, var(--sidebar-mid) 0%, var(--sidebar-to) 100%)",
          borderColor: "rgba(88,28,135,0.35)",
        }}
      >
        <div className="flex">
          {PRIMARY_NAV.map(({ href, icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-purple-400" : "text-gray-500"
                )}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}

          {/* More button — shows red dot if unread notifications */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors relative",
              drawerOpen || isMoreActive ? "text-purple-400" : "text-gray-500"
            )}
          >
            <span className="text-xl leading-none relative">
              {drawerOpen ? "✕" : "☰"}
              {!drawerOpen && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black" />
              )}
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
