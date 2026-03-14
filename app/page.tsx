"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard-header";
import MorningBrief from "@/components/morning-brief";
import MindQueue from "@/components/mind-queue";
import TodaysDecisions from "@/components/todays-decisions";
import ExternalSignals from "@/components/external-signals";
import StudentInsights from "@/components/student-insights";
import TeacherInsights from "@/components/teacher-insights";
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
          {/* Row 1: Morning Brief spans full width */}
          <div className="col-span-full opacity-0 animate-fade-in stagger-1">
            <MorningBrief />
          </div>

          {/* Row 2: Core modules */}
          <div className="opacity-0 animate-fade-in stagger-2 lg:row-span-2 flex">
            <MindQueue />
          </div>
          <div className="opacity-0 animate-fade-in stagger-3">
            <TodaysDecisions />
          </div>
          <div className="opacity-0 animate-fade-in stagger-4">
            <ExternalSignals />
          </div>

          {/* Row 3: Insights */}
          <div className="opacity-0 animate-fade-in stagger-5">
            <StudentInsights />
          </div>
          <div className="opacity-0 animate-fade-in stagger-6">
            <TeacherInsights />
          </div>

          {/* Row 4: Calendar + Pipeline + Stories */}
          <div className="opacity-0 animate-fade-in stagger-7">
            <CalendarView />
          </div>
          <div className="opacity-0 animate-fade-in stagger-8">
            <LeadPipeline />
          </div>
          <div className="opacity-0 animate-fade-in stagger-9">
            <FounderStories />
          </div>
        </div>

        <AskDashboard />

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
