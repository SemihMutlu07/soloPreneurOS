import { NextResponse } from "next/server";
import { runIntelligencePipeline } from "@/lib/intelligence-pipeline";

export async function POST(_request: Request) {
  // Fire and forget — do not await. Returns 202 immediately.
  runIntelligencePipeline().catch((err) => {
    console.error("[trigger] Pipeline error:", err);
  });
  return NextResponse.json({ running: true }, { status: 202 });
}
