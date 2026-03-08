"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/dashboard", icon: "📊", label: "Home" },
  { href: "/discover", icon: "🔍", label: "Discover" },
  { href: "/marketplace", icon: "🛒", label: "Shop" },
  { href: "/quizlets", icon: "🎴", label: "Quizlets" },
];

const MORE_NAV = [
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  { href: "/game", icon: "🎮", label: "Game Modes" },
  { href: "/feedback", icon: "💬", label: "Feedback" },
  { href: "/info", icon: "ℹ️", label: "Info" },
  { href: "/upgrade", icon: "⭐", label: "Go Pro" },
  { href: "/buy-coins", icon: "🪙", label: "Buy Coins" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMoreActive = MORE_NAV.some(
    ({ href }) => pathname === href || pathname.startsWith(href + "/")
  );

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
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
          bottom: "56px", // sits just above the nav bar
          background: "linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-mid) 100%)",
          borderTop: "1px solid rgba(88,28,135,0.35)",
          borderRadius: "20px 20px 0 0",
          paddingBottom: "8px",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-purple-800/20">
          <p className="text-xs font-bold text-purple-400/80 uppercase tracking-widest">More</p>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 p-3">
          {MORE_NAV.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-medium transition-colors",
                  active
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <span className="text-center leading-tight">{label}</span>
              </Link>
            );
          })}
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

          {/* More button */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
              drawerOpen || isMoreActive ? "text-purple-400" : "text-gray-500"
            )}
          >
            <span className="text-xl leading-none">{drawerOpen ? "✕" : "☰"}</span>
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
