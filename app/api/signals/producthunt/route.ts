import { NextResponse } from "next/server";
import { externalSignals } from "@/lib/mock-data";

interface PHPost {
  name: string;
  tagline: string;
  votesCount: number;
  url: string;
  topics: { edges: { node: { name: string } }[] };
}

const PRIORITY_TOPICS = /education|edtech|ai|learning|teaching|school/i;

export async function GET() {
  const token = process.env.PRODUCTHUNT_TOKEN;

  if (!token) {
    const mock = externalSignals.filter((s) => s.source === "product-hunt");
    return NextResponse.json({ posts: mock, source: "mock" }, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  }

  try {
    const response = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `{
          posts(order: VOTES, first: 5) {
            edges {
              node {
                name
                tagline
                votesCount
                url
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
              }
            }
          }
        }`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Product Hunt API error: ${response.status}`);
    }

    const data = await response.json();
    const posts: PHPost[] = data.data.posts.edges.map(
      (edge: { node: PHPost }) => edge.node
    );

    // Sort: prioritize posts matching education/AI topics
    posts.sort((a, b) => {
      const aMatch = a.topics.edges.some((t) => PRIORITY_TOPICS.test(t.node.name));
      const bMatch = b.topics.edges.some((t) => PRIORITY_TOPICS.test(t.node.name));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return b.votesCount - a.votesCount;
    });

    return NextResponse.json({ posts, source: "live" }, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  } catch {
    const mock = externalSignals.filter((s) => s.source === "product-hunt");
    return NextResponse.json({ posts: mock, source: "mock" }, {
      headers: { "Cache-Control": "public, s-maxage=1800" },
    });
  }
}
