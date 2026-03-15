"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import DashboardHeader from "@/components/dashboard-header";
import ChiefOfStaff from "@/components/agents/chief-of-staff";
import DailyOps from "@/components/agents/daily-ops";
import MarketScout from "@/components/agents/market-scout";
import IntelligenceFeed from "@/components/intelligence/intelligence-feed";
import CalendarView from "@/components/calendar-view";
import LeadPipeline from "@/components/lead-pipeline";
import FounderStories from "@/components/founder-stories";
import AiAssistantBar from "@/components/shared/ai-assistant-bar";
import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { hasCompletedOnboarding, clearProfile } from "@/lib/profile-store";

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [chiefOpen, setChiefOpen] = useState<boolean>(false);

  useEffect(() => {
    setShowOnboarding(!hasCompletedOnboarding());
    const stored = localStorage.getItem("chief-of-staff-open");
    setChiefOpen(stored === null ? false : stored === "true");
  }, []);

  const toggleChief = () => {
    setChiefOpen((prev) => {
      localStorage.setItem("chief-of-staff-open", String(!prev));
      return !prev;
    });
  };

  if (showOnboarding === null) {
    return null;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <DashboardHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Chief of Staff — collapsible full width */}
          <div className="col-span-full opacity-0 animate-fade-in stagger-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Chief of Staff
              </span>
              <button
                onClick={toggleChief}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              >
                {chiefOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {chiefOpen ? "Collapse" : "Expand"}
              </button>
            </div>
            {chiefOpen && <ChiefOfStaff />}
          </div>

          {/* 3-col: Daily Ops (tall) | Market Scout | Calendar */}
          <div className="opacity-0 animate-fade-in stagger-2 lg:row-span-2 flex">
            <DailyOps />
          </div>
          <div className="opacity-0 animate-fade-in stagger-3 flex">
            <MarketScout />
          </div>
          <div className="opacity-0 animate-fade-in stagger-4 flex">
            <CalendarView />
          </div>

          {/* Lead Pipeline + Founder Stories (fill row 3) */}
          <div className="opacity-0 animate-fade-in stagger-5 flex">
            <LeadPipeline />
          </div>
          <div className="opacity-0 animate-fade-in stagger-6 flex">
            <FounderStories />
          </div>

          {/* Intelligence Feed — full width */}
          <div className="col-span-full opacity-0 animate-fade-in stagger-7 mt-2">
            <IntelligenceFeed />
          </div>
        </div>

        {!showOnboarding && <AiAssistantBar context="dashboard" />}

        <div className="text-center mt-12">
          <button
            onClick={() => {
              clearProfile();
              setShowOnboarding(true);
            }}
            className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
          >
            Reset Onboarding
          </button>
        </div>
      </main>
    </>
  );
}
