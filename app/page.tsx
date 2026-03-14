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

  // Don't render anything until we've checked localStorage
  if (showOnboarding === null) {
    return null;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      )}

      <main className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10 pb-28">
        <DashboardHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {/* Row 1: Chief of Staff spans full width */}
          <div className="col-span-full opacity-0 animate-fade-in stagger-1">
            <ChiefOfStaff />
          </div>

          {/* Row 2: Daily Ops (tall left) | Market Scout (center) | Calendar (right) */}
          <div className="opacity-0 animate-fade-in stagger-2 lg:row-span-2 flex">
            <DailyOps />
          </div>
          <div className="opacity-0 animate-fade-in stagger-3">
            <MarketScout />
          </div>
          <div className="opacity-0 animate-fade-in stagger-4">
            <CalendarView />
          </div>

          {/* Row 3: Lead Pipeline + Founder Stories */}
          <div className="opacity-0 animate-fade-in stagger-5">
            <LeadPipeline />
          </div>
          <div className="opacity-0 animate-fade-in stagger-6">
            <FounderStories />
          </div>

          {/* Coming Soon section */}
          <div className="col-span-full opacity-0 animate-fade-in stagger-7">
            <h2 className="text-sm font-semibold font-mono text-text-secondary mb-4">
              More agents coming soon
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              <ComingSoonAgents />
            </div>
          </div>
        </div>

        {!showOnboarding && <AskDashboard />}

        {/* Reset onboarding */}
        <div className="text-center mt-16">
          <button
            onClick={() => {
              clearProfile();
              setShowOnboarding(true);
            }}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Reset Onboarding
          </button>
        </div>
      </main>
    </>
  );
}
