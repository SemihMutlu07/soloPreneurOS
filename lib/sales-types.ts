// Sales-OS Types
// Pipeline stages from CLAUDE.md spec

export const PIPELINE_STAGES = [
  "new",
  "qualified",
  "contacted",
  "demo",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "nurture",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface LeadAISignals {
  positive: string[];
  negative: string[];
  questions: string[];
}

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  source: "gmail_scan" | "manual" | "referral" | "website";
  source_email_subject: string | null;
  source_email_snippet: string | null;
  source_email_date: string | null;
  status: PipelineStage;
  ai_score: number | null;
  ai_summary: string | null;
  ai_signals: LeadAISignals | null;
  ai_suggested_action: "send_demo" | "follow_up" | "nurture" | "disqualify" | null;
  ai_draft_response: string | null;
  assigned_to: string | null;
  deal_value: number | null;
  currency: string;
  notes: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  lost_reason: string | null;
  previous_lead_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: "email_received" | "email_sent" | "note" | "status_change" | "call" | "meeting";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  created_by: "system" | "ai" | "user";
}

export interface SalesTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  stage?: PipelineStage | string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SalesEvalResult {
  ai_score: number;
  ai_summary: string;
  ai_signals: LeadAISignals;
  ai_suggested_action: "send_demo" | "follow_up" | "nurture" | "disqualify";
  ai_draft_response: string;
}

// Backward-compatible aliases used by mock-data.ts and existing components
export type SalesLead = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  stage: PipelineStage | string;
  deal_value: number;
  ai_score: number;
  ai_summary?: string;
  ai_signals: { positive: string[]; negative: string[]; questions?: string[] };
  ai_suggested_action?: "send_demo" | "follow_up" | "nurture" | "disqualify";
  ai_draft_response?: string | null;
  source: string;
  created_at: string;
  last_contact_at: string;
  notes: string;
};

export type SalesActivity = {
  id: string;
  lead_id: string;
  type: "email_received" | "email_sent" | "note" | "status_change" | "meeting" | "call";
  subject: string;
  body: string;
  created_at: string;
  created_by?: "system" | "ai" | "user";
};
