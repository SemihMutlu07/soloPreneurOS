import { SalesPageClient } from "@/components/sales/sales-page-client";
import { salesLeads, salesActivities } from "@/lib/mock-data";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Lead Pipeline
        </h1>
      </div>

      <SalesPageClient leads={salesLeads} activities={salesActivities} />
    </div>
  );
}
