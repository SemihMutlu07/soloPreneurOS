export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  applied_at: string;
  pdf_url: string;
  status: "pending" | "analyzed" | "reviewed";
  previous_application_id: string | null;
  gmail_message_id: string | null;
  created_at: string;
}

export interface Evaluation {
  id: string;
  candidate_id: string;
  strong_signals: string[];
  risk_flags: string[];
  critical_question: string | null;
  recommendation: "GÖRÜŞ" | "GEÇME" | "BEKLET";
  raw_score: Record<string, number>;
  created_at: string;
}

export interface Role {
  id: string;
  title: string;
  rubric: string;
  task: string;
  active: boolean;
  created_at: string;
}

export interface CandidateWithEvaluation extends Candidate {
  evaluation: Evaluation | null;
}

export interface CronResult {
  processed: number;
  errors: string[];
}
