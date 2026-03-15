"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Target, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/hiring", label: "Hire-OS", icon: Users },
  { href: "/sales", label: "Sales-OS", icon: Target },
  { href: "/finance", label: "Finance-OS", icon: Wallet },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-14 lg:w-48 bg-surface/50 border-r border-border z-20 flex flex-col items-center lg:items-stretch py-4 gap-1">
      {/* Logo / Brand */}
      <div className="px-3 mb-4 hidden lg:block">
        <span className="text-xs font-semibold text-accent-primary tracking-wide">
          soloPreneurOS
        </span>
      </div>
      <div className="mb-4 lg:hidden">
        <span className="text-accent-primary font-bold text-sm">sOS</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-1 lg:px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-white/10 text-text-primary font-medium border-l-2 border-l-accent-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
