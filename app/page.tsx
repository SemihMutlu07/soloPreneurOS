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

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Row 1: Morning Brief spans full width */}
        <div className="col-span-full opacity-0 animate-fade-in stagger-1">
          <MorningBrief />
        </div>

        {/* Row 2: Core modules */}
        <div className="opacity-0 animate-fade-in stagger-2 lg:row-span-2">
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
    </main>
  );
}
