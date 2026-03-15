"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES, SUGGESTED_ACTIONS } from "@/lib/constants";
import type { SalesLead } from "@/lib/sales-types";

interface LeadTableProps {
  leads: SalesLead[];
  onSelectLead?: (id: string) => void;
}

type SortKey = "name" | "ai_score" | "stage" | "last_contact_at" | "deal_value";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

function formatTRY(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-accent-green";
  if (score >= 40) return "text-accent-amber";
  return "text-accent-red";
}

function needsAction(lead: SalesLead): boolean {
  return lead.stage === "qualified" && lead.ai_suggested_action !== undefined;
}

export function LeadTable({ leads, onSelectLead }: LeadTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ai_score");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStage, setFilterStage] = useState("");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "name");
    }
  }

  const filtered = leads.filter((l) => {
    if (filterStage && l.stage !== filterStage) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sortKey === "ai_score") {
      cmp = a.ai_score - b.ai_score;
    } else if (sortKey === "deal_value") {
      cmp = a.deal_value - b.deal_value;
    } else if (sortKey === "last_contact_at") {
      cmp = new Date(a.last_contact_at).getTime() - new Date(b.last_contact_at).getTime();
    } else {
      cmp = a.stage.localeCompare(b.stage);
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? (
      <ChevronUp size={14} className="inline" />
    ) : (
      <ChevronDown size={14} className="inline" />
    );
  };

  const stageKeys = Object.keys(LEAD_STATUSES) as Array<keyof typeof LEAD_STATUSES>;

  return (
    <div className="card">
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All Stages</option>
          {stageKeys.map((key) => (
            <option key={key} value={key}>
              {LEAD_STATUSES[key].label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="pb-3 pr-4 cursor-pointer hover:text-text-primary" onClick={() => handleSort("name")}>
                Name <SortIcon col="name" />
              </th>
              <th className="pb-3 pr-4 cursor-pointer hover:text-text-primary" onClick={() => handleSort("ai_score")}>
                Score <SortIcon col="ai_score" />
              </th>
              <th className="pb-3 pr-4 cursor-pointer hover:text-text-primary" onClick={() => handleSort("stage")}>
                Stage <SortIcon col="stage" />
              </th>
              <th className="pb-3 pr-4">Suggested Action</th>
              <th className="pb-3 pr-4 cursor-pointer hover:text-text-primary" onClick={() => handleSort("last_contact_at")}>
                Last Contact <SortIcon col="last_contact_at" />
              </th>
              <th className="pb-3 cursor-pointer hover:text-text-primary text-right" onClick={() => handleSort("deal_value")}>
                Deal Value <SortIcon col="deal_value" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead) => {
              const stageInfo = LEAD_STATUSES[lead.stage as keyof typeof LEAD_STATUSES];
              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead?.(lead.id)}
                  className={cn(
                    "border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer",
                    needsAction(lead) && "border-l-2 border-l-accent-amber",
                  )}
                >
                  <td className={`py-3 pr-4 ${needsAction(lead) ? "pl-3" : ""}`}>
                    <div>
                      <span className="text-text-primary">{lead.name}</span>
                      <p className="text-xs text-text-muted">{lead.company}</p>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn("font-mono font-semibold", scoreColor(lead.ai_score))}>
                      {lead.ai_score}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {stageInfo ? (
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", stageInfo.color)}>
                        {stageInfo.label}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-surface-elevated rounded text-xs text-text-secondary">
                        {lead.stage}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-xs text-text-secondary">
                    {lead.ai_suggested_action
                      ? SUGGESTED_ACTIONS[lead.ai_suggested_action as keyof typeof SUGGESTED_ACTIONS] || lead.ai_suggested_action
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs text-text-secondary font-mono">
                    {formatRelativeTime(lead.last_contact_at)}
                  </td>
                  <td className="py-3 text-right font-mono text-text-primary">
                    {formatTRY(lead.deal_value)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden space-y-2">
        {sorted.map((lead) => {
          const stageInfo = LEAD_STATUSES[lead.stage as keyof typeof LEAD_STATUSES];
          return (
            <div
              key={lead.id}
              onClick={() => onSelectLead?.(lead.id)}
              className={cn(
                "p-3 rounded-xl bg-surface-hover/50 border border-border/50 hover:border-accent-primary/30 transition-colors cursor-pointer",
                needsAction(lead) && "border-l-2 border-l-accent-amber",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-text-primary truncate block">{lead.name}</span>
                  <span className="text-xs text-text-muted">{lead.company}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("font-mono font-semibold text-sm", scoreColor(lead.ai_score))}>
                    {lead.ai_score}
                  </span>
                  {stageInfo && (
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", stageInfo.color)}>
                      {stageInfo.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs text-text-secondary">
                <span className="font-mono">{formatTRY(lead.deal_value)}</span>
                <span className="font-mono text-text-muted">{formatRelativeTime(lead.last_contact_at)}</span>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <p className="py-8 text-center text-text-muted text-sm">No leads found</p>
        )}
      </div>
    </div>
  );
}
