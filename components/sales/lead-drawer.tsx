"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Mail, Building2, DollarSign, CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { LEAD_STATUSES } from "@/lib/constants";
import type { SalesLeadStage } from "@/lib/constants";
import type { SalesLead, SalesActivity } from "@/lib/sales-types";
import { AiAnalysisCard } from "./ai-analysis-card";
import { ActivityTimeline } from "./activity-timeline";
import { LeadActions } from "./lead-actions";

interface LeadDrawerProps {
  lead: SalesLead | null;
  activities: SalesActivity[];
  onClose: () => void;
  onStatusChange?: (leadId: string, newStage: string) => void;
}

export function LeadDrawer({ lead, activities, onClose, onStatusChange }: LeadDrawerProps) {
  const [closing, setClosing] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Block body scroll when open
  useEffect(() => {
    if (lead) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [lead]);

  // Escape key closes modal
  useEffect(() => {
    if (!lead) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, handleClose]);

  if (!lead) return null;

  const stageInfo = LEAD_STATUSES[lead.stage as SalesLeadStage] ?? {
    label: lead.stage,
    color: "bg-surface-elevated text-text-secondary",
  };

  const leadActivities = activities.filter((a) => a.lead_id === lead.id);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Centered modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`bg-bg border border-border rounded-2xl flex flex-col
            w-[80vw] max-h-[85vh]
            max-md:w-[95vw] max-md:max-h-[90vh]
            shadow-2xl
            ${closing ? "animate-modal-out" : "animate-modal-in"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate">
                {lead.name}
              </h2>
              <span className="text-sm text-text-secondary hidden sm:inline">{lead.company}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${stageInfo.color}`}>
                {stageInfo.label}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors shrink-0 ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Left column */}
              <div className="lg:col-span-3 space-y-5">
                {/* Lead info card */}
                <div className="card space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail size={14} className="shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Building2 size={14} className="shrink-0" />
                      <span>{lead.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <DollarSign size={14} className="shrink-0" />
                      <span>{lead.deal_value.toLocaleString("tr-TR")} TL</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <CalendarDays size={14} className="shrink-0" />
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {lead.source && (
                    <div className="text-xs text-text-muted">
                      Source: <span className="capitalize">{lead.source}</span>
                    </div>
                  )}
                  {lead.notes && (
                    <p className="text-sm text-text-secondary border-t border-border pt-3">
                      {lead.notes}
                    </p>
                  )}
                </div>

                {/* AI Analysis — collapsible */}
                <div className="card">
                  <button
                    onClick={() => setAiOpen(!aiOpen)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                        AI Analysis
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        lead.ai_score >= 70 ? "text-green-400 bg-green-400/15" :
                        lead.ai_score >= 40 ? "text-amber-400 bg-amber-400/15" :
                        "text-red-400 bg-red-400/15"
                      }`}>
                        {lead.ai_score}/100
                      </span>
                    </div>
                    {aiOpen ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
                  </button>
                  {aiOpen && (
                    <div className="mt-4">
                      <AiAnalysisCard lead={lead} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-2">
                <ActivityTimeline activities={leadActivities} />
              </div>
            </div>
          </div>

          {/* Footer — actions */}
          <div className="shrink-0 border-t border-border px-6 py-4">
            <LeadActions
              leadId={lead.id}
              currentStage={lead.stage}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}
