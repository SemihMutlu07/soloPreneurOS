"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Target, Wallet, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/hiring", label: "Hire-OS", icon: Users },
  { href: "/sales", label: "Sales-OS", icon: Target },
  { href: "/finance", label: "Finance-OS", icon: Wallet },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Block body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Don't show sidebar on login page
  if (pathname === "/login") return null;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-30 p-2 rounded-lg bg-surface/80 backdrop-blur-sm border border-border text-text-secondary hover:text-text-primary transition-colors lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible; mobile: drawer overlay */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-surface/95 backdrop-blur-md border-r border-border z-50 flex flex-col py-4 gap-1 transition-transform duration-200 ease-out",
          // Desktop: always visible, narrow icon bar expands on lg
          "hidden lg:flex lg:w-48 lg:items-stretch",
          // Mobile: full drawer when open
          open
            ? "flex w-64 items-stretch translate-x-0"
            : "max-lg:-translate-x-full"
        )}
      >
        {/* Header with close button on mobile */}
        <div className="flex items-center justify-between px-3 mb-4">
          <span className="text-xs font-semibold text-accent-primary tracking-wide">
            soloPreneurOS
          </span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-2">
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
