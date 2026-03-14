export interface UserProfile {
  name: string;
  productName: string;
  productDescription: string;
  teamSize: "solo" | "2-5" | "6-15" | "16+";
  customerType: "b2b" | "b2c" | "both";
  userCount: "pre-launch" | "1-100" | "100-1k" | "1k-10k" | "10k+";
  revenue: "pre-revenue" | "under-10k" | "10k-50k" | "50k-200k" | "200k+";
  channels: string[];
  painPoints: string[];
  tools: string[];
  onboardedAt: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  reason: string;
}
