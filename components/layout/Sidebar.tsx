"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/discover", icon: "🔍", label: "Discover" },
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  { href: "/marketplace", icon: "🛒", label: "Marketplace" },
  { href: "/quizlets", icon: "🎴", label: "Quizlets" },
  { href: "/game", icon: "🎮", label: "Game Modes" },
  { href: "/info", icon: "ℹ️", label: "Info" },
  { href: "/feedback", icon: "💬", label: "Feedback" },
  { href: "/upgrade", icon: "⭐", label: "Go Pro" },
  { href: "/buy-coins", icon: "🪙", label: "Buy Coins" },
];

const ADMIN_NAV_ITEMS = [
  { href: "/quiz-maker", icon: "✏️", label: "Quiz Maker" },
  { href: "/admin/users", icon: "👥", label: "User Manager" },
  { href: "/admin/payments", icon: "💳", label: "Payments" },
  { href: "/admin/quizzes", icon: "📋", label: "Edit Quizzes" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const user = session?.user as { isAdmin?: boolean; isPro?: boolean } | undefined;
  const isAdmin = !!user?.isAdmin;
  const isPro = !!user?.isPro;
  const isLight = theme === "light";

  return (
    <aside
      className="w-64 min-h-screen flex flex-col shrink-0 border-r"
      style={{
        background: "linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-mid) 50%, var(--sidebar-to) 100%)",
        borderColor: "var(--sidebar-border, rgba(88,28,135,0.3))",
      }}
    >
      {/* Logo */}
      <div className="p-6 border-b border-purple-800/30">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            BittsQuiz
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-500/10"
                  : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1"
              )}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          );
        })}

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-4">
              <div className="border-t border-purple-800/30 mb-3" />
              <p className="text-xs text-purple-400/80 font-bold uppercase tracking-widest">Admin Panel</p>
            </div>
            {ADMIN_NAV_ITEMS.map(({ href, icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-gradient-to-r from-purple-600/40 to-pink-600/30 text-purple-100 border border-purple-400/50"
                      : "text-purple-400/80 hover:bg-purple-500/10 hover:text-purple-200 hover:translate-x-1"
                  )}
                >
                  <span className="text-xl">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Theme toggle */}
      <div className="px-4 py-2 border-t border-purple-800/20">
        <button
          onClick={() => setTheme(isLight ? "dark" : "light")}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <span className="text-xl">{isLight ? "🌙" : "☀️"}</span>
          {isLight ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      {/* User section */}
      {session?.user && (
        <div className="p-4 border-t border-purple-800/30">
          {isAdmin && (
            <div className="mb-2 text-center">
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-0.5 rounded-full font-semibold">
                ADMIN
              </span>
            </div>
          )}
          {!isAdmin && isPro && (
            <div className="mb-2 text-center">
              <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-400 text-black px-3 py-0.5 rounded-full font-bold">
                PRO
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={36}
                height={36}
                className={cn(
                  "rounded-full ring-2",
                  isPro ? "ring-yellow-400 shadow-md shadow-yellow-400/50" : "ring-purple-500/50"
                )}
              />
            ) : (
              <div className={cn(
                "w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white ring-2",
                isPro ? "ring-yellow-400 shadow-md shadow-yellow-400/50" : "ring-purple-500/50"
              )}>
                {session.user.name?.[0] ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-xs text-gray-500 hover:text-red-400 py-2 transition-colors hover:bg-red-500/10 rounded-lg"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
