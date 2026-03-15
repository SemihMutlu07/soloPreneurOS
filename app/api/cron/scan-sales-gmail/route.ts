import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyEmail, extractLeadInfo } from "@/lib/gmail";
import type { GmailMessage } from "@/lib/gmail";
import { google } from "googleapis";

function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return oauth2Client;
}

async function fetchRecentEmails(sinceDate: Date): Promise<GmailMessage[]> {
  const auth = getAuthClient();
  const gmail = google.gmail({ version: "v1", auth });

  const epoch = Math.floor(sinceDate.getTime() / 1000);
  const query = `after:${epoch} -label:sent`;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const messages = listRes.data.messages || [];
  const results: GmailMessage[] = [];

  for (const msg of messages) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });

    const headers = full.data.payload?.headers || [];
    const from = headers.find((h) => h.name === "From")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const date = headers.find((h) => h.name === "Date")?.value || "";

    const nameMatch = from.match(/^"?([^"<]+)"?\s*</);
    const emailMatch = from.match(/<([^>]+)>/);
    const senderName = nameMatch?.[1]?.trim() || from;
    const senderEmail = emailMatch?.[1] || from;

    results.push({
      messageId: msg.id!,
      senderName,
      senderEmail,
      subject,
      date,
      bodySnippet: full.data.snippet || "",
    });
  }

  return results;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const result = { processed: 0, skipped: 0, errors: [] as string[] };

  try {
    const since = new Date();
    since.setDate(since.getDate() - 1);

    const emails = await fetchRecentEmails(since);

    for (const email of emails) {
      try {
        if (classifyEmail(email.subject) === "hiring") {
          result.skipped++;
          continue;
        }

        // Check for duplicate by email address + subject
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .eq("email", email.senderEmail)
          .eq("source_email_subject", email.subject)
          .maybeSingle();

        if (existing) {
          result.skipped++;
          continue;
        }

        const leadInfo = extractLeadInfo(email);

        const { error: insertError } = await supabase
          .from("leads")
          .insert({
            name: leadInfo.name,
            email: leadInfo.email,
            company: leadInfo.company,
            source: "gmail_scan",
            source_email_subject: leadInfo.subject,
            source_email_snippet: leadInfo.snippet,
            source_email_date: leadInfo.date,
            status: "new",
            currency: "TRY",
          });

        if (insertError) {
          result.errors.push(
            `Insert failed for ${email.senderEmail}: ${insertError.message}`,
          );
          continue;
        }

        result.processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`${email.senderEmail}: ${message}`);
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
