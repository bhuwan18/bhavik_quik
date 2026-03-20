"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Compass,
  Trophy,
  ShoppingBag,
  Layers,
  Gamepad2,
  MessageSquare,
  Store,
  Bell,
  PenLine,
  Users,
  CreditCard,
  ClipboardList,
  MessageCircle,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { href: string; icon: LucideIcon; label: string; color: string }[] = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard",   color: "text-blue-400"   },
  { href: "/discover",    icon: Compass,         label: "Discover",    color: "text-cyan-400"   },
  { href: "/leaderboard", icon: Trophy,           label: "Leaderboard", color: "text-amber-400"  },
  { href: "/marketplace", icon: ShoppingBag,      label: "Marketplace", color: "text-green-400"  },
  { href: "/quizlets",    icon: Layers,           label: "Quizlets",    color: "text-violet-400" },
  { href: "/game",        icon: Gamepad2,         label: "Game Modes",  color: "text-orange-400" },
  { href: "/feedback",    icon: MessageSquare,    label: "Feedback",    color: "text-pink-400"   },
  { href: "/shop",        icon: Store,            label: "Shop",        color: "text-emerald-400"},
];

const ADMIN_NAV_ITEMS: { href: string; icon: LucideIcon; label: string; color: string }[] = [
  { href: "/quiz-maker",       icon: PenLine,       label: "Quiz Maker",   color: "text-indigo-400" },
  { href: "/admin/users",      icon: Users,         label: "User Manager", color: "text-sky-400"    },
  { href: "/admin/payments",   icon: CreditCard,    label: "Payments",     color: "text-lime-400"   },
  { href: "/admin/quizzes",    icon: ClipboardList, label: "Edit Quizzes", color: "text-amber-400"  },
  { href: "/admin/feedback",   icon: MessageCircle, label: "Feedback",     color: "text-rose-400"   },
  { href: "/admin/settings",   icon: Settings,      label: "Settings",     color: "text-slate-400"  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const user = session?.user as { isAdmin?: boolean; isPro?: boolean } | undefined;
  const isAdmin = !!user?.isAdmin;
  const isPro = !!user?.isPro;
  const isLight = theme === "light";

  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("bq_sidebar_collapsed") === "true";
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("bq_sidebar_collapsed", String(next));
  };

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data: { isRead: boolean }[]) => {
        if (Array.isArray(data)) setUnreadCount(data.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  }, [session, pathname]);

  const navItemClass = (active: boolean, adminStyle = false) =>
    cn(
      "flex items-center rounded-lg transition-all duration-200 group/item",
      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
      active
        ? adminStyle
          ? "bg-gradient-to-r from-purple-600/40 to-pink-600/30 text-purple-100 border border-purple-400/50"
          : "bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10"
        : adminStyle
          ? "text-purple-400/80 hover:bg-purple-500/10 hover:text-purple-200"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
    );

  return (
    <aside
      className="min-h-screen flex flex-col shrink-0 border-r overflow-hidden transition-[width] duration-300 ease-in-out"
      style={{
        width: collapsed ? "68px" : "240px",
        background: "linear-gradient(180deg, var(--sidebar-from) 0%, var(--sidebar-mid) 50%, var(--sidebar-to) 100%)",
        borderColor: "var(--sidebar-border, rgba(88,28,135,0.3))",
      }}
    >
      {/* Logo + toggle */}
      <div className={cn(
        "border-b border-purple-800/30 flex items-center",
        collapsed ? "justify-center p-3 flex-col gap-2" : "px-4 py-4 justify-between"
      )}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0" title={collapsed ? "BittsQuiz" : undefined}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 group-hover:scale-110 transition-transform">
            <defs>
              <linearGradient id="slg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5b21b6"/>
                <stop offset="50%" stopColor="#7c3aed"/>
                <stop offset="100%" stopColor="#be185d"/>
              </linearGradient>
              <linearGradient id="sbolt" x1="0" y1="0" x2="0" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fef3c7"/>
                <stop offset="100%" stopColor="#f59e0b"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#slg)"/>
            <path d="M20 3 L11 18 H17 L12 29 L21 14 H15 Z" fill="url(#sbolt)"/>
            <polygon points="27,5 28,7.5 30.5,7.5 28.5,9 29.5,11.5 27,10 24.5,11.5 25.5,9 23.5,7.5 26,7.5" fill="#fde68a" opacity="0.85"/>
          </svg>
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent whitespace-nowrap">
              BittsQuiz
            </span>
          )}
        </Link>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0",
            collapsed && "mt-0"
          )}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-3 space-y-0.5 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
        {NAV_ITEMS.map(({ href, icon: Icon, label, color }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined} className={navItemClass(active)}>
              <Icon size={collapsed ? 20 : 17} className={cn("shrink-0", active ? "opacity-100" : color)} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </Link>
          );
        })}

        {/* Notifications */}
        <Link
          href="/notifications"
          title={collapsed ? "Notifications" : undefined}
          className={navItemClass(pathname === "/notifications")}
        >
          <span className="relative shrink-0">
            <Bell size={collapsed ? 20 : 17} className={cn(pathname === "/notifications" ? "opacity-100" : "text-red-400")} />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute bg-red-500 text-white font-bold rounded-full leading-none flex items-center justify-center",
                collapsed
                  ? "-top-1.5 -right-1.5 w-4 h-4 text-[9px]"
                  : "-top-1 -right-1 w-3.5 h-3.5 text-[8px]"
              )}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 text-sm font-medium">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </>
          )}
        </Link>

        {/* Admin-only section */}
        {isAdmin && (
          <>
            <div className={cn("pt-3 pb-1", collapsed ? "px-0" : "px-1")}>
              <div className="border-t border-purple-800/30 mb-2" />
              {!collapsed && (
                <p className="text-[10px] text-purple-400/80 font-bold uppercase tracking-widest">Admin Panel</p>
              )}
            </div>
            {ADMIN_NAV_ITEMS.map(({ href, icon: Icon, label, color }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} title={collapsed ? label : undefined} className={navItemClass(active, true)}>
                  <Icon size={collapsed ? 20 : 17} className={cn("shrink-0", active ? "opacity-100" : color)} />
                  {!collapsed && <span className="text-sm font-medium">{label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Theme toggle */}
      <div className={cn("py-2 border-t border-purple-800/20", collapsed ? "px-2" : "px-3")}>
        <button
          onClick={() => setTheme(isLight ? "dark" : "light")}
          title={collapsed ? (isLight ? "Dark Mode" : "Light Mode") : undefined}
          className={cn(
            "w-full flex items-center rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all",
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
          )}
        >
          {isLight
            ? <Moon size={collapsed ? 20 : 17} className="shrink-0 text-indigo-400" />
            : <Sun size={collapsed ? 20 : 17} className="shrink-0 text-yellow-400" />
          }
          {!collapsed && (isLight ? "Dark Mode" : "Light Mode")}
        </button>
      </div>

      {/* User section */}
      {session?.user && (
        <div className={cn("border-t border-purple-800/30", collapsed ? "px-2 py-3" : "px-4 py-4")}>
          {!collapsed && isAdmin && (
            <div className="mb-2.5 text-center">
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-0.5 rounded-full font-semibold">
                ADMIN
              </span>
            </div>
          )}
          {!collapsed && !isAdmin && isPro && (
            <div className="mb-2.5 text-center">
              <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-400 text-black px-3 py-0.5 rounded-full font-bold">
                PRO
              </span>
            </div>
          )}

          {collapsed ? (
            /* Collapsed: avatar + sign-out icon stacked */
            <div className="flex flex-col items-center gap-2">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="Avatar"
                  width={32}
                  height={32}
                  title={session.user.name ?? ""}
                  className={cn(
                    "rounded-full ring-2 shrink-0 cursor-pointer",
                    isPro ? "ring-yellow-400 shadow-md shadow-yellow-400/50" : "ring-purple-500/50"
                  )}
                />
              ) : (
                <div
                  title={session.user.name ?? ""}
                  className={cn(
                    "w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white ring-2 shrink-0",
                    isPro ? "ring-yellow-400 shadow-md shadow-yellow-400/50" : "ring-purple-500/50"
                  )}
                >
                  {session.user.name?.[0] ?? "?"}
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign out"
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            /* Expanded: full user row */
            <>
              <div className="flex items-center gap-3 mb-3">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt="Avatar"
                    width={34}
                    height={34}
                    className={cn(
                      "rounded-full ring-2 shrink-0",
                      isPro ? "ring-yellow-400 shadow-md shadow-yellow-400/50" : "ring-purple-500/50"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-[34px] h-[34px] rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold text-white ring-2 shrink-0",
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
                className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-400 py-2 transition-colors hover:bg-red-500/10 rounded-lg"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
