export interface AgentResult {
  agentId: string;
  timestamp: string;
  data: any;
  status: "success" | "error" | "mock";
  summary?: string;
}

export function getAgentResult(agentId: string): AgentResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`agent-${agentId}`);
    if (!raw) return null;
    return JSON.parse(raw) as AgentResult;
  } catch {
    return null;
  }
}

export function setAgentResult(
  agentId: string,
  data: any,
  status: AgentResult["status"],
  summary?: string
): void {
  const result: AgentResult = {
    agentId,
    timestamp: new Date().toISOString(),
    data,
    status,
    summary,
  };
  localStorage.setItem(`agent-${agentId}`, JSON.stringify(result));
}

export function isStale(agentId: string, maxAgeMinutes: number): boolean {
  const result = getAgentResult(agentId);
  if (!result) return true;
  const age = Date.now() - new Date(result.timestamp).getTime();
  return age > maxAgeMinutes * 60 * 1000;
}

export function getAllAgentResults(): Record<string, AgentResult> {
  if (typeof window === "undefined") return {};
  const results: Record<string, AgentResult> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("agent-")) {
      try {
        const result = JSON.parse(localStorage.getItem(key)!) as AgentResult;
        results[result.agentId] = result;
      } catch {
        // skip invalid entries
      }
    }
  }
  return results;
}
