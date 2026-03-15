"use client";

import { useState, useEffect } from "react";
import type { TaxDeadline } from "@/lib/finance-types";
import type { Invoice } from "@/lib/finance-types";
import { DeadlineCard } from "./deadline-card";

interface TaxCalendarProps {
  deadlines: TaxDeadline[];
}

const STORAGE_KEY = "finance_invoices";
const MOCK_INPUT_KDV = 6640;

const turkishMonths = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function TaxCalendar({ deadlines }: TaxCalendarProps) {
  const [kdvFromInvoices, setKdvFromInvoices] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const invoices: Invoice[] = JSON.parse(raw);
        if (invoices.length > 0) {
          const totalKdv = invoices.reduce((s, inv) => s + (inv.kdv_amount || 0), 0);
          setKdvFromInvoices(totalKdv - MOCK_INPUT_KDV);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const sorted = [...deadlines].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const grouped = sorted.reduce<Record<string, TaxDeadline[]>>((acc, dl) => {
    const date = new Date(dl.due_date);
    const key = `${turkishMonths[date.getMonth()]} ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(dl);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            {month}
          </h3>
          <div className="space-y-3">
            {items.map((dl) => {
              const isKdv = dl.type === "KDV";
              const hasCalc = isKdv && kdvFromInvoices !== null;
              return (
                <DeadlineCard
                  key={dl.id}
                  deadline={dl}
                  overrideAmount={hasCalc ? Math.max(0, kdvFromInvoices) : undefined}
                  calculated={isKdv ? hasCalc : undefined}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
