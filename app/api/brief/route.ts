import { NextRequest, NextResponse } from "next/server";
import {
  companyInfo,
  mindQueueItems,
  todaysDecisions,
  externalSignals,
  studentMetrics,
  studentInsightCommentary,
  teacherMetrics,
  teacherInsightCommentary,
  leads,
} from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set. Add it to .env.local to enable the Morning Brief." },
      { status: 500 }
    );
  }

  // Read previousDecisions from request body (sent from client localStorage)
  let previousDecisions: { question: string; choice: string; timestamp: string }[] = [];
  try {
    const body = await request.json();
    previousDecisions = body.previousDecisions || [];
  } catch {
    // No body or invalid JSON — that's fine
  }

  const systemPrompt = `You are the AI co-founder of "${companyInfo.name}" — ${companyInfo.tagline}. You are NOT an assistant. You are a sharp, opinionated co-founder who speaks directly.

Your tone:
- Direct. No fluff. No "Great news!" or "Here's your update!". Just say it.
- Opinionated. You have a take on everything. "Fix the iPad sync NOW — parent complaints kill school renewals faster than anything."
- Urgent when it matters, calm when it doesn't. You know the difference.
- Never suggest tweeting, posting on social media, or writing blog posts as quick wins. Instead, surface real conversation opportunities: joining trending discussions, engaging with influencers who are already talking about the space, or responding to community threads.
- Reference specific numbers, names, and data points. Never be vague.

You write a morning briefing with EXACTLY these 6 sections (use ## headings):

## Top Priority
The single most critical thing today. Explain WHY it matters more than everything else — connect it to revenue, churn, or growth.

## Quick Wins
2-3 things that take under 30 minutes. Focus on: joining conversations happening RIGHT NOW (Reddit threads, influencer discussions), quick follow-ups with leads, or small product fixes with outsized impact. NO social media posting suggestions.

## Watch Out
1-2 risks or things trending in the wrong direction. Be specific with metrics.

## Market Pulse
What the external signals mean for the business. Connect competitor moves, community discussions, and search trends into a coherent picture.

## Lead Action
Pick the most important lead to follow up with. Reference their specific behavior data. Be prescriptive: "Call James today — he opened the pricing PDF 3 times this week. He's comparing options and will go cold by Friday."

## Yesterday's Decisions → Today's Actions
Reference any decisions the founder made recently. If they decided something, connect it to a concrete action for today. If no previous decisions exist, skip this section entirely — do NOT make up decisions.

Keep the entire brief under 400 words. Every sentence should be actionable or provide critical context. Cut anything that doesn't earn its place.`;

  // Fetch live signals from Reddit and Hacker News
  let liveSignals = "";
  try {
    const baseUrl = new URL(request.url).origin;
    const [redditRes, hnRes] = await Promise.all([
      fetch(`${baseUrl}/api/signals/reddit`).then((r) => r.json()),
      fetch(`${baseUrl}/api/signals/hackernews`).then((r) => r.json()),
    ]);

    const parts: string[] = [];

    if (redditRes.posts?.length) {
      parts.push(
        ...redditRes.posts.map(
          (p: { title: string; score: number; num_comments?: number; subreddit?: string }) =>
            `- [REDDIT${p.subreddit ? ` r/${p.subreddit}` : ""}] ${p.title} (score: ${p.score}${p.num_comments != null ? `, ${p.num_comments} comments` : ""})`
        )
      );
    }

    if (hnRes.stories?.length) {
      parts.push(
        ...hnRes.stories.map(
          (s: { title: string; score: number; descendants?: number }) =>
            `- [HACKER NEWS] ${s.title} (score: ${s.score}${s.descendants != null ? `, ${s.descendants} comments` : ""})`
        )
      );
    }

    if (parts.length) {
      liveSignals = parts.join("\n");
    }
  } catch {
    // Fall back to mock signals below
  }

  const signalsSection = liveSignals
    ? liveSignals
    : externalSignals
        .map(
          (s) =>
            `- [${s.source.toUpperCase()}] ${s.title} (score: ${s.score}, ${s.timestamp})\n  ${s.summary}`
        )
        .join("\n");

  const contextData = `
COMPANY: ${companyInfo.name} — ${companyInfo.tagline}
Metrics: ${companyInfo.students} students, ${companyInfo.teachers} teachers, ${companyInfo.schools} schools, $${companyInfo.mrr} MRR

MIND QUEUE (founder's priorities):
${mindQueueItems.map((item) => `- [${item.priority.toUpperCase()}] [${item.category}] ${item.text}`).join("\n")}

DECISIONS PENDING TODAY:
${todaysDecisions.map((d) => `- ${d.question}\n  Options: ${d.options.join(" | ")}\n  Context: ${d.context}`).join("\n")}

EXTERNAL SIGNALS:
${signalsSection}

STUDENT METRICS:
${studentMetrics.map((m) => `- ${m.label}: ${m.value.toLocaleString()}${m.unit} (${m.change >= 0 ? "+" : ""}${m.change}% change)`).join("\n")}
AI Commentary:
${studentInsightCommentary.map((c) => `- ${c}`).join("\n")}

TEACHER METRICS:
${teacherMetrics.map((m) => `- ${m.label}: ${m.value}/${m.total} (${Math.round((m.value / m.total) * 100)}%)`).join("\n")}
AI Commentary:
${teacherInsightCommentary.map((c) => `- ${c}`).join("\n")}

LEAD PIPELINE:
${leads.map((l) => `- ${l.name} | ${l.school} | $${l.value.toLocaleString()} | Stage: ${l.stage} | Last contact: ${l.lastContact}`).join("\n")}

${previousDecisions.length > 0 ? `PREVIOUS DECISIONS (made by the founder):\n${previousDecisions.map((d) => `- "${d.question}" → Chose: "${d.choice}" (decided: ${d.timestamp})`).join("\n")}` : "PREVIOUS DECISIONS: None yet."}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Generate my morning brief based on this data:\n\n${contextData}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Anthropic API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const brief = data.content[0]?.text || "No response generated.";
    return NextResponse.json({ brief });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to Anthropic API" },
      { status: 500 }
    );
  }
}
