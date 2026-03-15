import { TaxCalendar } from "@/components/finance/tax-calendar";
import { TaxProvisionCard } from "@/components/finance/tax-provision-card";
import type { TaxDeadline, TaxProvision } from "@/lib/finance-types";

const STATIC_TAX_DEADLINES: TaxDeadline[] = [
  {
    id: "td-1",
    name: "KDV Beyannamesi",
    type: "KDV",
    due_date: "2026-03-26",
    estimated_amount: 21440,
    status: "hazirlaniyor",
    description: "Mart ayı KDV beyannamesi",
  },
  {
    id: "td-2",
    name: "Geçici Vergi (Q1)",
    type: "Geçici Vergi",
    due_date: "2026-05-17",
    estimated_amount: 8400,
    status: "bekliyor",
    description: "2026 Q1 geçici vergi beyannamesi",
  },
  {
    id: "td-3",
    name: "KDV Beyannamesi",
    type: "KDV",
    due_date: "2026-04-26",
    estimated_amount: 21440,
    status: "bekliyor",
    description: "Nisan ayı KDV beyannamesi",
  },
  {
    id: "td-4",
    name: "SGK (Bağ-Kur) Primi",
    type: "SGK",
    due_date: "2026-03-31",
    estimated_amount: 2800,
    status: "bekliyor",
    description: "Mart ayı Bağ-Kur primi",
  },
  {
    id: "td-5",
    name: "KDV Beyannamesi",
    type: "KDV",
    due_date: "2026-05-26",
    estimated_amount: 21440,
    status: "bekliyor",
    description: "Mayıs ayı KDV beyannamesi",
  },
];

const STATIC_TAX_PROVISIONS: TaxProvision[] = [
  {
    id: "00000000-0000-0000-0003-000000000001",
    user_id: "00000000-0000-0000-0000-000000000001",
    period: "2026-Q1",
    kdv_payable: 3200,
    gecici_vergi_estimate: 8400,
    sgk_amount: 2800,
    total_provision: 14400,
    created_at: "2026-03-01T00:00:00Z",
  },
];

export default function TaxCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Vergi Takvimi
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Önümüzdeki 90 günlük vergi takviminiz
        </p>
      </div>

      <TaxCalendar deadlines={STATIC_TAX_DEADLINES} />

      <TaxProvisionCard provisions={STATIC_TAX_PROVISIONS} />
    </div>
  );
}
