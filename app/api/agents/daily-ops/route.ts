import { NextRequest, NextResponse } from "next/server";

interface TaskItem {
  id: string;
  text: string;
  priority: "critical" | "important" | "can-wait";
  completed: boolean;
}

export async function POST(request: NextRequest) {
  let tasks: TaskItem[] = [];
  try {
    const body = await request.json();
    tasks = body.tasks || [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const activeTasks = tasks.filter((t) => !t.completed);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Mock fallback
    return NextResponse.json({
      analysis: "Focus on your critical tasks first. Knock out quick wins between deep work sessions to maintain momentum.",
      suggestedOrder: activeTasks.map((t) => t.text),
      blockers: [],
    });
  }

  const taskList = activeTasks
    .map((t) => `- [${t.priority.toUpperCase()}] ${t.text}`)
    .join("\n");

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
        system: `You are a productivity-focused co-pilot for a solo founder. Analyze their task list and return a JSON object with exactly these fields:
- "analysis": A 2-3 sentence opinionated take on their priorities. Be direct and actionable.
- "suggestedOrder": An array of task texts in the order you recommend tackling them.
- "blockers": An array of potential blockers or risks you see (empty array if none).
Return ONLY valid JSON, no markdown or explanation.`,
        messages: [
          {
            role: "user",
            content: `Here are my active tasks:\n${taskList}\n\nAnalyze and prioritize them.`,
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
    const text = data.content[0]?.text || "{}";
    const result = JSON.parse(text);

    return NextResponse.json({
      analysis: result.analysis || "No analysis generated.",
      suggestedOrder: result.suggestedOrder || [],
      blockers: result.blockers || [],
    });
  } catch {
    // Fallback on parse or network error
    return NextResponse.json({
      analysis: "Focus on your critical tasks first. Knock out quick wins between deep work sessions to maintain momentum.",
      suggestedOrder: activeTasks.map((t) => t.text),
      blockers: [],
    });
  }
}
