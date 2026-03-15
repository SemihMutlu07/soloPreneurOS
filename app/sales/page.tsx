import { SalesPageClient } from "@/components/sales/sales-page-client";
import { salesLeads, salesActivities } from "@/lib/mock-data";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Lead Pipeline
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          AI-powered lead qualification and tracking
        </p>
      </div>

      <SalesPageClient leads={salesLeads} activities={salesActivities} />
    </div>
  );
}
