"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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
];

const ADMIN_NAV_ITEMS = [
  { href: "/quiz-maker", icon: "✏️", label: "Quiz Maker" },
];

const year = new Date().getFullYear();

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

  return (
    <aside className="w-64 min-h-screen flex flex-col shrink-0 border-r border-purple-900/30"
      style={{ background: "linear-gradient(180deg, #1a0a3e 0%, #110830 50%, #0d0622 100%)" }}>
      {/* Logo */}
      <div className="p-6 border-b border-purple-800/30">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            Quizlet {year}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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
            <div className="pt-3 pb-1 px-4">
              <p className="text-xs text-purple-500/60 font-semibold uppercase tracking-widest">Admin</p>
            </div>
            {ADMIN_NAV_ITEMS.map(({ href, icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-purple-200 border border-purple-500/40"
                      : "text-purple-400/70 hover:bg-purple-500/10 hover:text-purple-300"
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
          <div className="flex items-center gap-3 mb-3">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={36}
                height={36}
                className="rounded-full ring-2 ring-purple-500/50"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white">
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
