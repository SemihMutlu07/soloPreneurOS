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
  calendarEvents,
  leads,
  founderStories,
} from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      answer: "ANTHROPIC_API_KEY not set. Add it to .env.local to enable Ask Your Dashboard.",
      error: true,
    });
  }

  let question = "";
  let previousDecisions: { question: string; choice: string; timestamp: string }[] = [];
  try {
    const body = await request.json();
    question = body.question || "";
    previousDecisions = body.previousDecisions || [];
  } catch {
    return NextResponse.json({ answer: "Couldn't process that — try again.", error: true });
  }

  if (!question.trim()) {
    return NextResponse.json({ answer: "Couldn't process that — try again.", error: true });
  }

  const contextData = `
COMPANY: ${companyInfo.name} — ${companyInfo.tagline}
Metrics: ${companyInfo.students} students, ${companyInfo.teachers} teachers, ${companyInfo.schools} schools, $${companyInfo.mrr} MRR

MIND QUEUE (founder's priorities):
${mindQueueItems.map((item) => `- [${item.priority.toUpperCase()}] [${item.category}] ${item.text}`).join("\n")}

DECISIONS PENDING TODAY:
${todaysDecisions.map((d) => `- ${d.question}\n  Options: ${d.options.join(" | ")}\n  Context: ${d.context}`).join("\n")}

EXTERNAL SIGNALS:
${externalSignals.map((s) => `- [${s.source.toUpperCase()}] ${s.title} (score: ${s.score}, ${s.timestamp})\n  ${s.summary}`).join("\n")}

STUDENT METRICS:
${studentMetrics.map((m) => `- ${m.label}: ${m.value.toLocaleString()}${m.unit} (${m.change >= 0 ? "+" : ""}${m.change}% change)`).join("\n")}
AI Commentary:
${studentInsightCommentary.map((c) => `- ${c}`).join("\n")}

TEACHER METRICS:
${teacherMetrics.map((m) => `- ${m.label}: ${m.value}/${m.total} (${Math.round((m.value / m.total) * 100)}%)`).join("\n")}
AI Commentary:
${teacherInsightCommentary.map((c) => `- ${c}`).join("\n")}

CALENDAR TODAY:
${calendarEvents.map((e) => `- ${e.time} ${e.title} (${e.duration}min, ${e.type})`).join("\n")}

LEAD PIPELINE:
${leads.map((l) => `- ${l.name} | ${l.school} | $${l.value.toLocaleString()} | Stage: ${l.stage} | Last contact: ${l.lastContact}`).join("\n")}

FOUNDER STORIES:
${founderStories.map((f) => `- "${f.quote}" — ${f.author}, ${f.role}\n  Takeaway: ${f.takeaway}`).join("\n")}

${previousDecisions.length > 0 ? `PREVIOUS DECISIONS:\n${previousDecisions.map((d) => `- "${d.question}" → Chose: "${d.choice}" (decided: ${d.timestamp})`).join("\n")}` : ""}`;

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
        max_tokens: 800,
        system: `You are the AI co-pilot for an EdTech solopreneur running LearnLoop. Answer questions about the business using the dashboard data provided. Be direct, specific, reference actual names and numbers. Keep answers under 3 paragraphs. If asked about a lead, reference pipeline data. If asked about students, reference student metrics. If asked about what to do, reference mind queue priorities.`,
        messages: [
          {
            role: "user",
            content: `${question}\n\nDashboard context:\n${contextData}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ answer: "Couldn't process that — try again.", error: true });
    }

    const data = await response.json();
    const answer = data.content[0]?.text || "No response generated.";
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ answer: "Couldn't process that — try again.", error: true });
  }
}
