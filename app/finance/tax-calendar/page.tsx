import { TaxCalendar } from "@/components/finance/tax-calendar";
import { TaxProvisionCard } from "@/components/finance/tax-provision-card";
import { financeTaxDeadlines, financeTaxProvisions } from "@/lib/mock-data";

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

      <TaxCalendar deadlines={financeTaxDeadlines} />

      <TaxProvisionCard provisions={financeTaxProvisions} />
    </div>
  );
}
