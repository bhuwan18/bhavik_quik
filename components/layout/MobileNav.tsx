"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/dashboard", icon: "📊", label: "Home" },
  { href: "/discover", icon: "🔍", label: "Discover" },
  { href: "/marketplace", icon: "🛒", label: "Shop" },
  { href: "/quizlets", icon: "🎴", label: "Quizlets" },
  { href: "/feedback", icon: "💬", label: "Feedback" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
      style={{
        background: "linear-gradient(180deg, var(--sidebar-mid) 0%, var(--sidebar-to) 100%)",
        borderColor: "rgba(88,28,135,0.35)",
      }}
    >
      <div className="flex">
        {MOBILE_NAV.map(({ href, icon, label }) => {
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
      </div>
    </nav>
  );
}
