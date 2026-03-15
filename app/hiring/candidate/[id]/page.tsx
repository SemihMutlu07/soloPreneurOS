import { createClient } from "@/lib/supabase/server";
import { CandidateDetail } from "@/components/hiring/candidate-detail";
import { notFound } from "next/navigation";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("candidates")
    .select("*, evaluations(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const candidate = {
    ...data,
    evaluation: data.evaluations?.[0] || null,
    evaluations: undefined,
  };

  return <CandidateDetail candidate={candidate} />;
}
