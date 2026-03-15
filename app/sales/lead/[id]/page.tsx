import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { salesLeads, salesActivities } from "@/lib/mock-data";
import { LEAD_STATUSES, SUGGESTED_ACTIONS } from "@/lib/constants";
import type { SalesLeadStage } from "@/lib/constants";
import { AiAnalysisCard } from "@/components/sales/ai-analysis-card";
import { ActivityTimeline } from "@/components/sales/activity-timeline";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const lead = salesLeads.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-lg mb-4">Lead not found</p>
        <Link href="/sales" className="text-accent-primary hover:underline text-sm">
          Back to Pipeline
        </Link>
      </div>
    );
  }

  const leadActivities = salesActivities.filter((a) => a.lead_id === lead.id);
  const stageInfo = LEAD_STATUSES[lead.stage as SalesLeadStage] ?? {
    label: lead.stage,
    color: "bg-surface-elevated text-text-secondary",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/sales"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Pipeline
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-text-primary">{lead.name}</h1>
        <span className="text-text-secondary">{lead.company}</span>
        <span className={`px-3 py-1 rounded text-xs font-medium ${stageInfo.color}`}>
          {stageInfo.label}
        </span>
      </div>

      {/* Lead info + AI + Timeline grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Lead info card */}
          <div className="card space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-text-secondary">
                <span className="text-text-muted text-xs block mb-0.5">Email</span>
                {lead.email}
              </div>
              <div className="text-text-secondary">
                <span className="text-text-muted text-xs block mb-0.5">Role</span>
                {lead.role}
              </div>
              <div className="text-text-secondary">
                <span className="text-text-muted text-xs block mb-0.5">Deal Value</span>
                <span className="font-mono">{lead.deal_value.toLocaleString("tr-TR")} TL</span>
              </div>
              <div className="text-text-secondary">
                <span className="text-text-muted text-xs block mb-0.5">Source</span>
                <span className="capitalize">{lead.source}</span>
              </div>
              <div className="text-text-secondary">
                <span className="text-text-muted text-xs block mb-0.5">Created</span>
                {new Date(lead.created_at).toLocaleDateString()}
              </div>
              <div className="text-text-secondary">
                <span className="text-text-muted text-xs block mb-0.5">Last Contact</span>
                {new Date(lead.last_contact_at).toLocaleDateString()}
              </div>
            </div>
            {lead.ai_suggested_action && (
              <div className="border-t border-border pt-3">
                <span className="text-xs text-text-muted">Suggested Action: </span>
                <span className="text-sm text-accent-primary font-medium">
                  {SUGGESTED_ACTIONS[lead.ai_suggested_action as keyof typeof SUGGESTED_ACTIONS] ?? lead.ai_suggested_action}
                </span>
              </div>
            )}
            {lead.notes && (
              <p className="text-sm text-text-secondary border-t border-border pt-3">
                {lead.notes}
              </p>
            )}
          </div>

          {/* AI Analysis */}
          <AiAnalysisCard lead={lead} />

          {/* AI Draft Response */}
          {lead.ai_draft_response && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                AI Draft Response
              </h3>
              <div className="p-3 rounded-lg bg-surface-elevated text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {lead.ai_draft_response}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          <ActivityTimeline activities={leadActivities} />
        </div>
      </div>
    </div>
  );
}
