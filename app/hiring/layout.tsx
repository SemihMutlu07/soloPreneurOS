import Link from "next/link";
import { Users, Home } from "lucide-react";

export default function HiringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Home size={18} />
            </Link>
            <span className="text-text-muted">/</span>
            <Link
              href="/hiring"
              className="flex items-center gap-2 text-accent-orange font-medium"
            >
              <Users size={18} />
              Hire-OS
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
