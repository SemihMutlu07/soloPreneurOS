import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT =
  "You are an AI assistant for soloPreneurOS, a business management platform. You can help manage candidates, leads, invoices, and expenses. Execute the requested tool when the user asks for CRUD operations. Be concise.";

const TOOLS = [
  {
    name: "update_candidate_status",
    description: "Update a hiring candidate's status",
    input_schema: {
      type: "object" as const,
      properties: {
        candidate_id: { type: "string", description: "The candidate ID" },
        status: { type: "string", description: "The new status" },
      },
      required: ["candidate_id", "status"],
    },
  },
  {
    name: "update_lead_status",
    description: "Update a sales lead's stage",
    input_schema: {
      type: "object" as const,
      properties: {
        lead_id: { type: "string", description: "The lead ID" },
        stage: { type: "string", description: "The new stage" },
      },
      required: ["lead_id", "stage"],
    },
  },
  {
    name: "create_invoice",
    description: "Create a new invoice",
    input_schema: {
      type: "object" as const,
      properties: {
        client_name: { type: "string", description: "Client name" },
        gross_amount: { type: "number", description: "Invoice amount" },
        description: { type: "string", description: "Invoice description" },
      },
      required: ["client_name", "gross_amount", "description"],
    },
  },
  {
    name: "create_expense",
    description: "Record a new expense",
    input_schema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "Expense description" },
        amount: { type: "number", description: "Expense amount" },
        category: { type: "string", description: "Expense category" },
      },
      required: ["description", "amount", "category"],
    },
  },
];

async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  requestUrl: string
): Promise<string> {
  let path: string;
  let method: string;
  let body: Record<string, unknown>;

  switch (toolName) {
    case "update_candidate_status":
      path = `/api/hiring/candidates/${input.candidate_id}`;
      method = "PATCH";
      body = { status: input.status };
      break;
    case "update_lead_status":
      path = `/api/sales/leads/${input.lead_id}`;
      method = "PATCH";
      body = { status: input.stage };
      break;
    case "create_invoice":
      path = `/api/finance/invoices`;
      method = "POST";
      body = {
        client_name: input.client_name,
        gross_amount: input.gross_amount,
        description: input.description,
      };
      break;
    case "create_expense":
      path = `/api/finance/expenses`;
      method = "POST";
      body = {
        description: input.description,
        amount: input.amount,
        category: input.category,
      };
      break;
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  const url = new URL(path, requestUrl).toString();

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return JSON.stringify(data);
}

export async function POST(request: NextRequest) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          answer:
            "The AI assistant is not configured. Please set the ANTHROPIC_API_KEY environment variable to enable this feature.",
        },
        { status: 200 }
      );
    }

    const { message, context } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { answer: "Please provide a message." },
        { status: 400 }
      );
    }

    const userContent = context
      ? `[Context: ${context}]\n${message}`
      : message;

    // Initial Claude call
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json(
        { answer: "AI service returned an error. Please try again." },
        { status: 502 }
      );
    }

    const claudeData = await claudeRes.json();

    // Check if Claude wants to use a tool
    const toolBlock = claudeData.content?.find(
      (block: { type: string }) => block.type === "tool_use"
    );

    if (!toolBlock) {
      // No tool use — extract text response
      const textBlock = claudeData.content?.find(
        (block: { type: string }) => block.type === "text"
      );
      return NextResponse.json({
        answer: textBlock?.text ?? "No response generated.",
      });
    }

    // Execute the tool
    const toolResult = await executeTool(
      toolBlock.name,
      toolBlock.input,
      request.url
    );

    // Send tool result back to Claude for a natural language summary
    const followUpRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: [
          { role: "user", content: userContent },
          { role: "assistant", content: claudeData.content },
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: toolBlock.id,
                content: toolResult,
              },
            ],
          },
        ],
      }),
    });

    if (!followUpRes.ok) {
      return NextResponse.json({
        answer: "Tool executed but could not generate summary.",
        toolUsed: toolBlock.name,
      });
    }

    const followUpData = await followUpRes.json();
    const summaryBlock = followUpData.content?.find(
      (block: { type: string }) => block.type === "text"
    );

    return NextResponse.json({
      answer: summaryBlock?.text ?? "Action completed.",
      toolUsed: toolBlock.name,
    });
  } catch (error) {
    console.error("Assistant API error:", error);
    return NextResponse.json(
      { answer: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
