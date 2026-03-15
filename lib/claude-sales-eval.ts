import Anthropic from "@anthropic-ai/sdk";

export interface SalesEvalInput {
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  snippet: string | null;
  businessContext: string;
}

export interface SalesEvalResult {
  ai_score: number;
  ai_summary: string;
  ai_signals: {
    positive: string[];
    negative: string[];
    questions: string[];
  };
  ai_suggested_action: "send_demo" | "follow_up" | "nurture" | "disqualify";
  ai_draft_response: string | null;
}

// TODO: Move businessContext to Settings page — currently hardcoded
export const DEFAULT_BUSINESS_CONTEXT =
  "We build an AI-powered K-12 learning platform. Our target customers are schools, districts, and education resellers. Average deal size is 100K-300K TRY annually.";

export async function evaluateLead(
  input: SalesEvalInput,
): Promise<SalesEvalResult> {
  const systemPrompt = `You are a sales qualification assistant for a solo founder. Your job is to evaluate inbound emails and score leads based on buying intent, budget signals, timeline urgency, and decision-making authority.

## Business Context
${input.businessContext}

## Evaluation Criteria
- **Buying Intent (0-30):** Is the sender actively looking for a solution? Do they mention a problem your product solves?
- **Budget Signals (0-25):** Any mention of budget, pricing questions, procurement process, or deal size indicators?
- **Timeline (0-25):** Is there urgency? Upcoming deadlines, academic year start, pilot windows, RFP timelines?
- **Authority (0-20):** Is this person a decision-maker (principal, superintendent, procurement lead) or an influencer/researcher?

## Output Format
Respond with ONLY valid JSON in this exact format:
{
  "ai_score": 0-100,
  "ai_summary": "One paragraph summary of the lead quality and recommendation",
  "ai_signals": {
    "positive": ["signal 1", "signal 2"],
    "negative": ["flag 1", "flag 2"],
    "questions": ["question to ask 1", "question to ask 2"]
  },
  "ai_suggested_action": "send_demo" | "follow_up" | "nurture" | "disqualify",
  "ai_draft_response": "Draft email reply if action is send_demo or follow_up, null otherwise"
}

## Action Guidelines
- **send_demo** (score 70+): High intent, clear fit. Draft a personalized demo invite.
- **follow_up** (score 40-69): Some interest but needs more info. Draft a discovery question email.
- **nurture** (score 20-39): Low intent now but could be future customer. No draft needed.
- **disqualify** (score 0-19): No fit or spam. No draft needed.

When drafting emails, write in a professional but warm tone. Keep it concise (3-5 sentences). Address the sender by name.`;

  const userMessage = [
    `Evaluate this inbound email as a potential sales lead:`,
    ``,
    `**From:** ${input.name} <${input.email}>${input.company ? ` (${input.company})` : ""}`,
    `**Subject:** ${input.subject || "(no subject)"}`,
    ``,
    `**Email snippet:**`,
    input.snippet || "(no content available)",
    ``,
    `Score this lead and return only JSON.`,
  ].join("\n");

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse sales evaluation response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate required fields
  if (
    typeof parsed.ai_score !== "number" ||
    parsed.ai_score < 0 ||
    parsed.ai_score > 100
  ) {
    throw new Error("Invalid ai_score: must be a number between 0 and 100");
  }
  if (typeof parsed.ai_summary !== "string" || !parsed.ai_summary) {
    throw new Error("Invalid ai_summary: must be a non-empty string");
  }
  if (
    !parsed.ai_signals ||
    !Array.isArray(parsed.ai_signals.positive) ||
    !Array.isArray(parsed.ai_signals.negative) ||
    !Array.isArray(parsed.ai_signals.questions)
  ) {
    throw new Error("Invalid ai_signals: must contain positive, negative, and questions arrays");
  }
  const validActions = ["send_demo", "follow_up", "nurture", "disqualify"];
  if (!validActions.includes(parsed.ai_suggested_action)) {
    throw new Error(`Invalid ai_suggested_action: must be one of ${validActions.join(", ")}`);
  }

  return {
    ai_score: parsed.ai_score,
    ai_summary: parsed.ai_summary,
    ai_signals: parsed.ai_signals,
    ai_suggested_action: parsed.ai_suggested_action,
    ai_draft_response: parsed.ai_draft_response ?? null,
  } as SalesEvalResult;
}
