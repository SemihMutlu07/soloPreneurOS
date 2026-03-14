import type { UserProfile, AgentConfig } from "./types";

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const AGENTS: AgentDefinition[] = [
  {
    id: "market-scout",
    name: "Market Scout",
    description: "Monitors competitors, trends, and market signals relevant to your product",
    icon: "Radar",
  },
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    description: "Prioritizes your day, manages decisions, and keeps you focused",
    icon: "Crown",
  },
  {
    id: "daily-ops",
    name: "Daily Ops",
    description: "Tracks tasks, calendar, and operational rhythm",
    icon: "CalendarCheck",
  },
  {
    id: "growth-hacker",
    name: "Growth Hacker",
    description: "Identifies acquisition channels and optimizes conversion funnels",
    icon: "TrendingUp",
  },
  {
    id: "customer-whisperer",
    name: "Customer Whisperer",
    description: "Analyzes user feedback, support tickets, and sentiment",
    icon: "MessageCircle",
  },
  {
    id: "content-engine",
    name: "Content Engine",
    description: "Generates content ideas and manages publishing pipeline",
    icon: "PenTool",
  },
  {
    id: "revenue-pilot",
    name: "Revenue Pilot",
    description: "Tracks MRR, churn, and revenue optimization opportunities",
    icon: "DollarSign",
  },
  {
    id: "hiring-scout",
    name: "Hiring Scout",
    description: "Sources candidates and manages the hiring pipeline",
    icon: "Users",
  },
];

export function getActiveAgents(profile: UserProfile): AgentConfig[] {
  return AGENTS.map((agent) => {
    let active = false;
    let reason = "";

    switch (agent.id) {
      case "market-scout":
        active = true;
        reason = "Always active — keeps you aware of market movements";
        break;
      case "chief-of-staff":
        active = true;
        reason = "Always active — your daily decision partner";
        break;
      case "daily-ops":
        active = true;
        reason = "Always active — manages your operational rhythm";
        break;
      case "growth-hacker":
        active = profile.channels.length > 0;
        reason = active
          ? `Activated — monitoring ${profile.channels.length} channel(s)`
          : "Activate by adding marketing channels";
        break;
      case "customer-whisperer":
        active =
          profile.userCount !== "pre-launch" &&
          profile.painPoints.includes("understanding-users");
        reason = active
          ? "Activated — you have users and want to understand them better"
          : "Activates when you have users and select user understanding as a pain point";
        break;
      case "content-engine":
        active = profile.channels.some((ch) =>
          ["blog", "twitter", "linkedin", "youtube", "newsletter", "tiktok"].includes(ch)
        );
        reason = active
          ? "Activated — you use content-driven channels"
          : "Activates when you use content-driven marketing channels";
        break;
      case "revenue-pilot":
        active = profile.revenue !== "pre-revenue";
        reason = active
          ? "Activated — tracking your revenue metrics"
          : "Activates once you have revenue to track";
        break;
      case "hiring-scout":
        active =
          profile.teamSize !== "solo" ||
          profile.painPoints.includes("hiring");
        reason = active
          ? "Activated — helping you build your team"
          : "Activates when you have a team or need to hire";
        break;
    }

    return { ...agent, active, reason };
  });
}
