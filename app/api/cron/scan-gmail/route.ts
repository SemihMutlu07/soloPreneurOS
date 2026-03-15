import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEmailsWithPDFs } from "@/lib/gmail";
import type { CronResult } from "@/lib/hiring-types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const result: CronResult = { processed: 0, errors: [] };

  try {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const attachments = await fetchEmailsWithPDFs(since);

    for (const att of attachments) {
      try {
        // Check for duplicate by gmail_message_id
        const { data: existing } = await supabase
          .from("candidates")
          .select("id")
          .eq("gmail_message_id", att.messageId)
          .maybeSingle();

        if (existing) continue;

        // Determine role from subject line (default: "general")
        const roleMatch = att.subject.match(
          /\[(.*?)\]|role:\s*(\S+)/i,
        );
        const role = roleMatch?.[1] || roleMatch?.[2] || "general";

        // Check for previous application with same email+role
        const { data: previous } = await supabase
          .from("candidates")
          .select("id")
          .eq("email", att.senderEmail)
          .eq("role", role)
          .maybeSingle();

        // Generate candidate ID for storage path
        const candidateId = crypto.randomUUID();

        // Upload PDF to Supabase Storage
        const storagePath = `${role}/${candidateId}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(storagePath, att.data, {
            contentType: "application/pdf",
          });

        if (uploadError) {
          result.errors.push(
            `Upload failed for ${att.senderEmail}: ${uploadError.message}`,
          );
          continue;
        }

        // Insert candidate row
        const { error: insertError } = await supabase
          .from("candidates")
          .insert({
            id: candidateId,
            name: att.senderName,
            email: att.senderEmail,
            role,
            pdf_url: storagePath,
            status: "pending",
            gmail_message_id: att.messageId,
            previous_application_id: previous?.id || null,
          });

        if (insertError) {
          result.errors.push(
            `Insert failed for ${att.senderEmail}: ${insertError.message}`,
          );
          continue;
        }

        result.processed++;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`${att.senderEmail}: ${message}`);
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
