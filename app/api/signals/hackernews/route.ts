import { NextResponse } from "next/server";
import { externalSignals } from "@/lib/mock-data";

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  descendants: number;
}

const TOPIC_FILTER =
  /AI|education|edtech|learning|school|teacher|student|LLM|classroom|tutoring|K-12/i;

export async function GET() {
  try {
    const idsRes = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );
    if (!idsRes.ok) throw new Error("Failed to fetch top stories");

    const ids: number[] = await idsRes.json();
    const first30 = ids.slice(0, 30);

    const stories: HNStory[] = await Promise.all(
      first30.map(async (id) => {
        const res = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        );
        return res.json();
      })
    );

    const filtered = stories
      .filter((s) => s && s.title && TOPIC_FILTER.test(s.title))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({ stories: filtered, source: "live" }, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  } catch {
    const mock = externalSignals.filter(
      (s) => s.source === "google-trends" || s.source === "twitter"
    );
    return NextResponse.json({ stories: mock, source: "mock" }, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  }
}
