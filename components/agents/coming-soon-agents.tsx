"use client";

import { Search, Eye, FlaskConical, BarChart3 } from "lucide-react";
import AgentCardWrapper from "./agent-card-wrapper";

const comingSoonAgents = [
  {
    id: "research-agent",
    name: "Research Agent",
    icon: <Search className="w-5 h-5 text-text-muted" />,
    description: "AI-powered research assistant. Finds tools, examples, and solutions when you're stuck.",
  },
  {
    id: "competitive-intel",
    name: "Competitive Intel Agent",
    icon: <Eye className="w-5 h-5 text-text-muted" />,
    description: "Monitors your competitors' launches, pricing changes, and market moves.",
  },
  {
    id: "growth-experiment",
    name: "Growth Experiment Agent",
    icon: <FlaskConical className="w-5 h-5 text-text-muted" />,
    description: "Track your growth experiments. Log hypotheses, run A/B tests, measure results.",
  },
  {
    id: "product-analytics",
    name: "Product Analytics Agent",
    icon: <BarChart3 className="w-5 h-5 text-text-muted" />,
    description: "Connects to your analytics tools. Surfaces anomalies, drop-offs, and opportunities.",
  },
];

export default function ComingSoonAgents() {
  return (
    <>
      {comingSoonAgents.map((agent) => (
        <AgentCardWrapper
          key={agent.id}
          agentId={agent.id}
          agentName={agent.name}
          icon={agent.icon}
          status="coming-soon"
          comingSoon
        >
          <p className="text-sm text-text-secondary leading-relaxed">
            {agent.description}
          </p>
        </AgentCardWrapper>
      ))}
    </>
  );
}
