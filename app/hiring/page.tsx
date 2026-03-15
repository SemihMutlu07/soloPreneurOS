import { createClient } from "@/lib/supabase/server";
import { HiringPageClient } from "@/components/hiring/hiring-page-client";
import type { CandidateWithEvaluation } from "@/lib/hiring-types";

export default async function HiringPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidates")
    .select("*, evaluations(*)")
    .order("applied_at", { ascending: false });

  const candidates: CandidateWithEvaluation[] = (data || []).map((c) => ({
    ...c,
    evaluation: c.evaluations?.[0] || null,
    evaluations: undefined,
  }));

  if (error) {
    return (
      <div className="card text-center py-8">
        <p className="text-accent-red">Failed to load candidates: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Hiring Pipeline
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          AI-powered candidate evaluation and tracking
        </p>
      </div>

      <HiringPageClient candidates={candidates} />
    </div>
  );
}
