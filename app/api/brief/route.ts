import { NextResponse } from "next/server";
import {
  companyInfo,
  mindQueueItems,
  todaysDecisions,
  externalSignals,
  studentMetrics,
  teacherMetrics,
} from "@/lib/mock-data";

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set. Add it to .env.local to enable the Morning Brief." },
      { status: 500 }
    );
  }

  const context = `
You are the AI co-pilot for a solo EdTech founder running "${companyInfo.name}" — ${companyInfo.tagline}.

Current metrics:
- ${companyInfo.students} active students across ${companyInfo.schools} schools
- ${companyInfo.teachers} teachers
- $${companyInfo.mrr} MRR

Top priorities today:
${mindQueueItems.slice(0, 4).map((item) => `- [${item.priority.toUpperCase()}] ${item.text}`).join("\n")}

Key decisions to make:
${todaysDecisions.map((d) => `- ${d.question} (Context: ${d.context})`).join("\n")}

External signals:
${externalSignals.map((s) => `- [${s.source}] ${s.title}: ${s.summary}`).join("\n")}

Student metrics:
${studentMetrics.map((m) => `- ${m.label}: ${m.value}${m.unit} (${m.change >= 0 ? "+" : ""}${m.change}%)`).join("\n")}

Teacher metrics:
${teacherMetrics.map((m) => `- ${m.label}: ${m.value}/${m.total}`).join("\n")}
`;

  const prompt = `Based on the context above, write a concise morning briefing for the founder. Include:

## Top Priority
The single most important thing to focus on today and why.

## Quick Wins
2-3 things that can be done in under 30 minutes for high impact.

## Watch Out
1-2 risks or things that need attention soon.

## Market Pulse
A brief take on the external signals and what they mean for the business.

Keep it sharp, actionable, and under 300 words. Write like a trusted advisor, not a corporate report.`;

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
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `${context}\n\n${prompt}`,
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
