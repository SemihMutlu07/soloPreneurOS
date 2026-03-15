export type InsightSeverity = "critical" | "warning" | "info";

export interface InsightCandidate {
  rule_id: string;       // e.g. "R1", "R2", "LLM"
  severity: InsightSeverity;
  module_tags: string[]; // e.g. ["sales", "finance"]
  evidence: string;      // human-readable explanation
}

export interface CrossModuleInsight extends InsightCandidate {
  id: string;                   // SHA256 content-addressed key
  generated_at: string;         // ISO timestamp
  dismissed_at: string | null;
  created_at: string;           // ISO timestamp
}

export interface PersistResult {
  upserted: number;
  errors: string[];
}
