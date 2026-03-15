"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { setProfile } from "@/lib/profile-store";
import { getActiveAgents } from "@/lib/agent-config";
import type { UserProfile } from "@/lib/types";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Radar,
  Crown,
  CalendarCheck,
  TrendingUp,
  MessageCircle,
  PenTool,
  DollarSign,
  Users,
  Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Radar,
  Crown,
  CalendarCheck,
  TrendingUp,
  MessageCircle,
  PenTool,
  DollarSign,
  Users,
};

const TEAM_SIZES = [
  { value: "solo", label: "Solo" },
  { value: "2-5", label: "2-5" },
  { value: "6-15", label: "6-15" },
  { value: "16+", label: "16+" },
] as const;

const CUSTOMER_TYPES = [
  { value: "b2b", label: "B2B", desc: "Selling to businesses" },
  { value: "b2c", label: "B2C", desc: "Selling to consumers" },
  { value: "both", label: "Both", desc: "Mixed audience" },
] as const;

const USER_COUNTS = [
  { value: "pre-launch", label: "Pre-launch" },
  { value: "1-100", label: "1-100" },
  { value: "100-1k", label: "100-1K" },
  { value: "1k-10k", label: "1K-10K" },
  { value: "10k+", label: "10K+" },
] as const;

const REVENUE_RANGES = [
  { value: "pre-revenue", label: "Pre-revenue" },
  { value: "under-10k", label: "<$10K" },
  { value: "10k-50k", label: "$10K-50K" },
  { value: "50k-200k", label: "$50K-200K" },
  { value: "200k+", label: "$200K+" },
] as const;

const CHANNEL_GROUPS = [
  {
    label: "Content",
    channels: ["blog", "newsletter", "youtube", "tiktok"],
  },
  {
    label: "Social",
    channels: ["twitter", "linkedin", "reddit", "instagram"],
  },
  {
    label: "Paid",
    channels: ["google-ads", "facebook-ads", "sponsorships"],
  },
  {
    label: "Other",
    channels: ["seo", "product-hunt", "referrals", "partnerships", "cold-outreach"],
  },
];

const PAIN_POINTS = [
  { id: "finding-customers", label: "Finding customers", icon: "🎯" },
  { id: "understanding-users", label: "Understanding users", icon: "🔍" },
  { id: "building-fast-enough", label: "Building fast enough", icon: "⚡" },
  { id: "staying-focused", label: "Staying focused", icon: "🧘" },
  { id: "managing-finances", label: "Managing finances", icon: "💰" },
  { id: "hiring", label: "Hiring the right people", icon: "👥" },
  { id: "marketing", label: "Marketing & content", icon: "📣" },
  { id: "pricing", label: "Pricing strategy", icon: "🏷️" },
  { id: "competition", label: "Competition", icon: "🏁" },
];

const TOOLS = [
  { id: "stripe", label: "Stripe" },
  { id: "google-analytics", label: "Google Analytics" },
  { id: "slack", label: "Slack" },
  { id: "notion", label: "Notion" },
  { id: "linear", label: "Linear" },
  { id: "github", label: "GitHub" },
  { id: "figma", label: "Figma" },
  { id: "intercom", label: "Intercom" },
  { id: "hubspot", label: "HubSpot" },
  { id: "mailchimp", label: "Mailchimp" },
  { id: "vercel", label: "Vercel" },
  { id: "posthog", label: "PostHog" },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

type FormData = Omit<UserProfile, "onboardedAt">;

const initialFormData: FormData = {
  name: "",
  productName: "",
  productDescription: "",
  teamSize: "solo",
  customerType: "b2b",
  userCount: "pre-launch",
  revenue: "pre-revenue",
  channels: [],
  painPoints: [],
  tools: [],
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activatedAgents, setActivatedAgents] = useState<
    { name: string; icon: string; active: boolean; reason: string; visible: boolean }[]
  >([]);

  const totalSteps = 5;

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return formData.name.trim() !== "" && formData.productName.trim() !== "";
      case 2:
        return true; // has defaults
      case 3:
        return formData.channels.length > 0;
      case 4:
        return formData.painPoints.length > 0;
      case 5:
        return true; // tools are optional
      default:
        return false;
    }
  };

  const toggleArrayItem = (field: "channels" | "painPoints" | "tools", item: string) => {
    setFormData((prev) => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter((i) => i !== item) };
      }
      if (field === "painPoints" && arr.length >= 3) return prev;
      return { ...prev, [field]: [...arr, item] };
    });
  };

  const handleComplete = () => {
    const profile: UserProfile = {
      ...formData,
      onboardedAt: new Date().toISOString(),
    };
    setProfile(profile);
    setCompleting(true);

    const agents = getActiveAgents(profile);
    const agentItems = agents.map((a) => ({
      name: a.name,
      icon: a.icon,
      active: a.active,
      reason: a.reason,
      visible: false,
    }));
    setActivatedAgents(agentItems);

    // Stagger agent appearance
    agents.forEach((_, i) => {
      setTimeout(() => {
        setActivatedAgents((prev) =>
          prev.map((a, j) => (j === i ? { ...a, visible: true } : a))
        );
      }, 200 + i * 150);
    });

    // Complete after all agents shown
    setTimeout(() => {
      onComplete();
    }, 200 + agents.length * 150 + 800);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (completing) {
    return (
      <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <Sparkles className="w-8 h-8 text-accent-orange mx-auto mb-4 animate-gentle-spin" />
          <h2 className="text-xl font-bold font-mono text-gray-100 mb-2">
            Setting up your OS...
          </h2>
          <p className="text-text-secondary text-sm mb-8">
            Activating AI agents based on your profile
          </p>
          <div className="space-y-2 text-left">
            {activatedAgents.map((agent) => {
              const IconComp = ICON_MAP[agent.icon];
              return (
                <div
                  key={agent.name}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300",
                    agent.visible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2",
                    agent.active
                      ? "bg-surface border-accent-orange/20"
                      : "bg-surface/50 border-border"
                  )}
                >
                  {IconComp && (
                    <IconComp
                      className={cn(
                        "w-4 h-4",
                        agent.active ? "text-accent-orange" : "text-text-muted"
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      agent.active ? "text-gray-100" : "text-text-muted"
                    )}
                  >
                    {agent.name}
                  </span>
                  {agent.active && (
                    <Check className="w-3.5 h-3.5 text-accent-green ml-auto" />
                  )}
                  {!agent.active && (
                    <span className="text-xs text-text-muted ml-auto">inactive</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center overflow-y-auto py-8">
      <div className="max-w-2xl w-full mx-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-muted font-mono">
              Step {step} of {totalSteps}
            </span>
            <span className="text-xs text-text-muted font-mono">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-orange rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="card">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold font-mono text-gray-100 mb-1">
                Welcome to soloPreneurOS
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Tell us about yourself and your product
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Your name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Alex Chen"
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-gray-100 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Product name *
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, productName: e.target.value }))
                    }
                    placeholder="My SaaS Product"
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-gray-100 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Brief description
                  </label>
                  <textarea
                    value={formData.productDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        productDescription: e.target.value,
                      }))
                    }
                    placeholder="What does your product do?"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-gray-100 text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Team size
                  </label>
                  <div className="flex gap-2">
                    {TEAM_SIZES.map((size) => (
                      <button
                        key={size.value}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, teamSize: size.value }))
                        }
                        className={cn(
                          "flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                          formData.teamSize === size.value
                            ? "bg-accent-orange/10 border-accent-orange/30 text-accent-orange"
                            : "bg-surface-elevated border-border text-text-secondary hover:border-border-strong"
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold font-mono text-gray-100 mb-1">
                Your market
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Who are you building for?
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Customer type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {CUSTOMER_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, customerType: ct.value }))
                        }
                        className={cn(
                          "px-4 py-4 rounded-xl border text-center transition-all",
                          formData.customerType === ct.value
                            ? "bg-accent-orange/10 border-accent-orange/30"
                            : "bg-surface-elevated border-border hover:border-border-strong"
                        )}
                      >
                        <span
                          className={cn(
                            "block text-sm font-semibold mb-0.5",
                            formData.customerType === ct.value
                              ? "text-accent-orange"
                              : "text-gray-100"
                          )}
                        >
                          {ct.label}
                        </span>
                        <span className="block text-xs text-text-muted">{ct.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    User count
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {USER_COUNTS.map((uc) => (
                      <button
                        key={uc.value}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, userCount: uc.value }))
                        }
                        className={cn(
                          "px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                          formData.userCount === uc.value
                            ? "bg-accent-orange/10 border-accent-orange/30 text-accent-orange"
                            : "bg-surface-elevated border-border text-text-secondary hover:border-border-strong"
                        )}
                      >
                        {uc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Monthly revenue
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REVENUE_RANGES.map((rr) => (
                      <button
                        key={rr.value}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, revenue: rr.value }))
                        }
                        className={cn(
                          "px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                          formData.revenue === rr.value
                            ? "bg-accent-orange/10 border-accent-orange/30 text-accent-orange"
                            : "bg-surface-elevated border-border text-text-secondary hover:border-border-strong"
                        )}
                      >
                        {rr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold font-mono text-gray-100 mb-1">
                Growth channels
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Where do you reach your audience? Select all that apply.
              </p>

              <div className="space-y-5">
                {CHANNEL_GROUPS.map((group) => (
                  <div key={group.label}>
                    <span className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {group.channels.map((ch) => (
                        <button
                          key={ch}
                          onClick={() => toggleArrayItem("channels", ch)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-sm transition-all",
                            formData.channels.includes(ch)
                              ? "bg-accent-orange/10 border-accent-orange/30 text-accent-orange"
                              : "bg-surface-elevated border-border text-text-secondary hover:border-border-strong"
                          )}
                        >
                          {ch.replace(/-/g, " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold font-mono text-gray-100 mb-1">
                Pain points
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                What challenges keep you up at night? Pick up to 3.
                <span className="ml-2 text-accent-orange font-mono">
                  {formData.painPoints.length}/3
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PAIN_POINTS.map((pp) => {
                  const selected = formData.painPoints.includes(pp.id);
                  const disabled = !selected && formData.painPoints.length >= 3;
                  return (
                    <button
                      key={pp.id}
                      onClick={() => toggleArrayItem("painPoints", pp.id)}
                      disabled={disabled}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-left transition-all",
                        selected
                          ? "bg-accent-orange/10 border-accent-orange/30"
                          : disabled
                            ? "bg-surface-elevated/50 border-border opacity-40 cursor-not-allowed"
                            : "bg-surface-elevated border-border hover:border-border-strong"
                      )}
                    >
                      <span className="text-lg mb-1 block">{pp.icon}</span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          selected ? "text-accent-orange" : "text-gray-100"
                        )}
                      >
                        {pp.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold font-mono text-gray-100 mb-1">
                Your toolbox
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Which tools do you use? We&apos;ll optimize integrations.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TOOLS.map((tool) => {
                  const selected = formData.tools.includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleArrayItem("tools", tool.id)}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                        selected
                          ? "bg-accent-orange/10 border-accent-orange/30 text-accent-orange"
                          : "bg-surface-elevated border-border text-text-secondary hover:border-border-strong"
                      )}
                    >
                      {tool.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
            <button
              onClick={handleBack}
              className={cn(
                "flex items-center gap-1.5 text-sm text-text-secondary hover:text-gray-100 transition-colors",
                step === 1 && "invisible"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                canProceed()
                  ? "bg-accent-orange text-bg hover:bg-accent-orange/90"
                  : "bg-surface-elevated text-text-muted cursor-not-allowed"
              )}
            >
              {step === totalSteps ? "Launch" : "Next"}
              {step < totalSteps && <ArrowRight className="w-4 h-4" />}
              {step === totalSteps && <Sparkles className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
