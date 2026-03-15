import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateCandidate } from "@/lib/claude-eval";
import { EVAL_BATCH_SIZE } from "@/lib/constants";
import type { CronResult } from "@/lib/hiring-types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const result: CronResult = { processed: 0, errors: [] };

  try {
    // Pull pending candidates
    const { data: candidates, error: fetchError } = await supabase
      .from("candidates")
      .select("*")
      .eq("status", "pending")
      .limit(EVAL_BATCH_SIZE)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;
    if (!candidates?.length) {
      return NextResponse.json({ ...result, message: "No pending candidates" });
    }

    for (const candidate of candidates) {
      try {
        // Load role rubric and task
        const { data: role } = await supabase
          .from("roles")
          .select("rubric, task")
          .eq("id", candidate.role)
          .single();

        if (!role) {
          result.errors.push(
            `No role config found for "${candidate.role}" (candidate ${candidate.id})`,
          );
          continue;
        }

        // Download PDF from storage
        const { data: pdfData, error: downloadError } = await supabase
          .storage
          .from("resumes")
          .download(candidate.pdf_url);

        if (downloadError || !pdfData) {
          result.errors.push(
            `PDF download failed for ${candidate.id}: ${downloadError?.message}`,
          );
          continue;
        }

        const buffer = Buffer.from(await pdfData.arrayBuffer());
        const pdfBase64 = buffer.toString("base64");

        // Run Claude evaluation
        const evalResult = await evaluateCandidate(
          pdfBase64,
          role.rubric,
          role.task,
        );

        // Insert evaluation
        const { error: evalInsertError } = await supabase
          .from("evaluations")
          .insert({
            candidate_id: candidate.id,
            strong_signals: evalResult.strong_signals,
            risk_flags: evalResult.risk_flags,
            critical_question: evalResult.critical_question,
            recommendation: evalResult.recommendation,
            raw_score: evalResult.raw_score,
          });

        if (evalInsertError) {
          result.errors.push(
            `Eval insert failed for ${candidate.id}: ${evalInsertError.message}`,
          );
          continue;
        }

        // Update candidate status
        await supabase
          .from("candidates")
          .update({ status: "analyzed" })
          .eq("id", candidate.id);

        result.processed++;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`Candidate ${candidate.id}: ${message}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, ...result },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
