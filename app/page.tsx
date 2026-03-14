"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard-header";
import ChiefOfStaff from "@/components/agents/chief-of-staff";
import DailyOps from "@/components/agents/daily-ops";
import MarketScout from "@/components/agents/market-scout";
import ComingSoonAgents from "@/components/agents/coming-soon-agents";
import CalendarView from "@/components/calendar-view";
import LeadPipeline from "@/components/lead-pipeline";
import FounderStories from "@/components/founder-stories";
import AskDashboard from "@/components/ask-dashboard";
import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { hasCompletedOnboarding, clearProfile } from "@/lib/profile-store";

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    setShowOnboarding(!hasCompletedOnboarding());
  }, []);

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
          {/* Chief of Staff — full width */}
          <div className="col-span-full opacity-0 animate-fade-in stagger-1">
            <ChiefOfStaff />
          </div>

          {/* 3-col: Daily Ops (tall) | Market Scout | Calendar */}
          <div className="opacity-0 animate-fade-in stagger-2 lg:row-span-2 flex">
            <DailyOps />
          </div>
          <div className="opacity-0 animate-fade-in stagger-3">
            <MarketScout />
          </div>
          <div className="opacity-0 animate-fade-in stagger-4">
            <CalendarView />
          </div>

          {/* Lead Pipeline + Founder Stories (fill row 3) */}
          <div className="opacity-0 animate-fade-in stagger-5">
            <LeadPipeline />
          </div>
          <div className="opacity-0 animate-fade-in stagger-6">
            <FounderStories />
          </div>

          {/* Coming Soon — full width, 2x2 grid inside */}
          <div className="col-span-full opacity-0 animate-fade-in stagger-7 mt-2">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
              More agents coming soon
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComingSoonAgents />
            </div>
          </div>
        </div>

        {!showOnboarding && <AskDashboard />}

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
