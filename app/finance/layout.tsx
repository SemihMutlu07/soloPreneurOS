import Link from "next/link";
import { Wallet, Home } from "lucide-react";

export default function FinanceLayout({
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
            <span className="text-border">/</span>
            <Link
              href="/finance"
              className="flex items-center gap-2 text-text-primary font-medium"
            >
              <Wallet size={18} />
              Finance-OS
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/finance"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/finance/invoices/new"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Fatura Oluştur
            </Link>
            <Link
              href="/finance/tax-calendar"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Vergi Takvimi
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
