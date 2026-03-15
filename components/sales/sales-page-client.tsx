"use client";

import { useState } from "react";
import type { SalesLead, SalesActivity } from "@/lib/sales-types";
import { StatsBar } from "./stats-bar";
import { LeadTable } from "./lead-table";
import { LeadDrawer } from "./lead-drawer";

interface SalesPageClientProps {
  leads: SalesLead[];
  activities: SalesActivity[];
}

export function SalesPageClient({ leads: initialLeads, activities }: SalesPageClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedLead = selectedId ? leads.find((l) => l.id === selectedId) ?? null : null;

  function handleStatusChange(leadId: string, newStage: string) {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, stage: newStage as SalesLead["stage"] } : l,
      ),
    );
  }

  function handleClose() {
    setSelectedId(null);
  }

  return (
    <>
      <StatsBar leads={leads} />
      <LeadTable
        leads={leads}
        onSelectLead={(id) => setSelectedId(id)}
      />
      <LeadDrawer
        lead={selectedLead}
        activities={activities}
        onClose={handleClose}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
