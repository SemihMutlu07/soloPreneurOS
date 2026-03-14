import { NextResponse } from "next/server";
import { externalSignals } from "@/lib/mock-data";

interface RedditPost {
  title: string;
  score: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
  created_utc: number;
}

const SUBREDDITS = ["edtech", "SaaS"];

export async function GET() {
  try {
    const responses = await Promise.all(
      SUBREDDITS.map((sub) =>
        fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=5`, {
          headers: { "User-Agent": "soloPreneurOS/1.0" },
        })
      )
    );

    const allPosts: RedditPost[] = [];

    for (const res of responses) {
      if (!res.ok) continue;
      const json = await res.json();
      const posts = json.data.children.map(
        (child: { data: RedditPost }) => ({
          title: child.data.title,
          score: child.data.score,
          num_comments: child.data.num_comments,
          permalink: child.data.permalink,
          subreddit: child.data.subreddit,
          created_utc: child.data.created_utc,
        })
      );
      allPosts.push(...posts);
    }

    allPosts.sort((a, b) => b.score - a.score);
    const top = allPosts.slice(0, 8);

    return NextResponse.json({ posts: top, source: "live" }, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  } catch {
    const mock = externalSignals.filter((s) => s.source === "reddit");
    return NextResponse.json({ posts: mock, source: "mock" }, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  }
}
