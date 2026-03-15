import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateLead, DEFAULT_BUSINESS_CONTEXT } from "@/lib/claude-sales-eval";
import { EVAL_BATCH_SIZE } from "@/lib/constants";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const result = { processed: 0, errors: [] as string[] };

  try {
    const { data: leads, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "new")
      .is("ai_score", null)
      .limit(EVAL_BATCH_SIZE)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;
    if (!leads?.length) {
      return NextResponse.json({ ...result, message: "No leads to evaluate" });
    }

    for (const lead of leads) {
      try {
        const evalResult = await evaluateLead({
          name: lead.name,
          email: lead.email,
          company: lead.company,
          subject: lead.source_email_subject,
          snippet: lead.source_email_snippet,
          businessContext: DEFAULT_BUSINESS_CONTEXT,
        });

        const newStatus =
          evalResult.ai_score >= 40 ? "qualified" : "new";

        const { error: updateError } = await supabase
          .from("leads")
          .update({
            ai_score: evalResult.ai_score,
            ai_summary: evalResult.ai_summary,
            ai_signals: evalResult.ai_signals,
            ai_suggested_action: evalResult.ai_suggested_action,
            ai_draft_response: evalResult.ai_draft_response,
            status: newStatus,
          })
          .eq("id", lead.id);

        if (updateError) {
          result.errors.push(
            `Update failed for ${lead.id}: ${updateError.message}`,
          );
          continue;
        }

        result.processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`Lead ${lead.id}: ${message}`);
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
