"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/discover", icon: "🔍", label: "Discover" },
  { href: "/marketplace", icon: "🛒", label: "Marketplace" },
  { href: "/quizlets", icon: "🎴", label: "Quizlets" },
  { href: "/quiz-maker", icon: "✏️", label: "Quiz Maker" },
  { href: "/game", icon: "🎮", label: "Game Modes" },
  { href: "/info", icon: "ℹ️", label: "Info" },
];

const year = new Date().getFullYear();

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 min-h-screen bg-[#0d0d1a] border-r border-white/10 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
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
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {session?.user && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={36}
                height={36}
                className="rounded-full ring-2 ring-indigo-500/50"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
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
            className="w-full text-xs text-gray-500 hover:text-red-400 py-2 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
