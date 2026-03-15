"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";
import { RECOMMENDATION_COLORS } from "@/lib/constants";
import { DuplicateBadge } from "./duplicate-badge";

interface CandidateTableProps {
  candidates: CandidateWithEvaluation[];
}

type SortKey = "name" | "role" | "applied_at" | "status" | "recommendation";

export function CandidateTable({ candidates }: CandidateTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("applied_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const roles = [...new Set(candidates.map((c) => c.role))];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const filtered = candidates.filter((c) => {
    if (filterRole && c.role !== filterRole) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string;
    let bVal: string;

    if (sortKey === "recommendation") {
      aVal = a.evaluation?.recommendation || "";
      bVal = b.evaluation?.recommendation || "";
    } else {
      aVal = String(a[sortKey]);
      bVal = String(b[sortKey]);
    }

    const cmp = aVal.localeCompare(bVal);
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

  return (
    <div className="card">
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="analyzed">Analyzed</option>
          <option value="reviewed">Reviewed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th
                className="pb-3 pr-4 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("name")}
              >
                Name <SortIcon col="name" />
              </th>
              <th
                className="pb-3 pr-4 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("role")}
              >
                Role <SortIcon col="role" />
              </th>
              <th
                className="pb-3 pr-4 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("applied_at")}
              >
                Applied <SortIcon col="applied_at" />
              </th>
              <th
                className="pb-3 pr-4 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("status")}
              >
                Status <SortIcon col="status" />
              </th>
              <th
                className="pb-3 cursor-pointer hover:text-text-primary"
                onClick={() => handleSort("recommendation")}
              >
                Rec. <SortIcon col="recommendation" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/50 hover:bg-surface-hover transition-colors"
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/hiring/candidate/${c.id}`}
                    className="text-text-primary hover:text-accent-teal transition-colors"
                  >
                    {c.name}
                  </Link>
                  {c.previous_application_id && <DuplicateBadge />}
                </td>
                <td className="py-3 pr-4 text-text-secondary">{c.role}</td>
                <td className="py-3 pr-4 text-text-secondary font-mono text-xs">
                  {new Date(c.applied_at).toLocaleDateString()}
                </td>
                <td className="py-3 pr-4">
                  <span className="px-2 py-0.5 bg-surface-elevated rounded text-xs text-text-secondary">
                    {c.status}
                  </span>
                </td>
                <td className="py-3">
                  {c.evaluation?.recommendation ? (
                    <span
                      className={`font-semibold text-xs ${RECOMMENDATION_COLORS[c.evaluation.recommendation] || ""}`}
                    >
                      {c.evaluation.recommendation}
                    </span>
                  ) : (
                    <span className="text-text-muted text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-text-muted"
                >
                  No candidates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
