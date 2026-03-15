import Anthropic from "@anthropic-ai/sdk";

export interface EvalResult {
  strong_signals: string[];
  risk_flags: string[];
  critical_question: string;
  recommendation: "GÖRÜŞ" | "GEÇME" | "BEKLET";
  raw_score: Record<string, number>;
}

export async function evaluateCandidate(
  pdfBase64: string,
  rubric: string,
  task: string,
): Promise<EvalResult> {
  const systemPrompt = `You are an expert hiring evaluator. Evaluate the candidate's resume/CV against the provided rubric and task description.

## Role Rubric
${rubric}

## Task Description
${task}

## Output Format
Respond with ONLY valid JSON in this exact format:
{
  "strong_signals": ["signal 1", "signal 2"],
  "risk_flags": ["flag 1", "flag 2"],
  "critical_question": "One key question to ask in the interview",
  "recommendation": "GÖRÜŞ" | "GEÇME" | "BEKLET",
  "raw_score": { "category_name": 0-10 }
}

Recommendations:
- GÖRÜŞ = Strong candidate, proceed to interview
- GEÇME = Does not meet criteria, pass
- BEKLET = Uncertain, hold for review`;

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: "Evaluate this candidate based on the rubric provided. Return only JSON.",
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse evaluation response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as EvalResult;
}
