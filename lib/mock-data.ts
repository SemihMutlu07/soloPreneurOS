export type Priority = "critical" | "important" | "can-wait";

export interface MindQueueItem {
  id: string;
  text: string;
  priority: Priority;
  category: string;
}

export interface Decision {
  id: string;
  question: string;
  options: string[];
  context: string;
  selectedOption?: number;
}

export interface ExternalSignal {
  id: string;
  source: "product-hunt" | "reddit" | "google-trends" | "twitter";
  title: string;
  summary: string;
  score: number;
  timestamp: string;
  url?: string;
}

export interface StudentMetric {
  label: string;
  value: number;
  change: number;
  unit: string;
}

export interface TeacherMetric {
  label: string;
  value: number;
  total: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: number; // minutes
  type: "meeting" | "focus" | "break" | "external";
}

export type LeadStage = "new" | "contacted" | "demo" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  school: string;
  value: number;
  stage: LeadStage;
  lastContact: string;
}

export interface FounderStory {
  id: string;
  quote: string;
  author: string;
  role: string;
  takeaway: string;
}

// --- Mock Data ---

export const companyInfo = {
  name: "LearnLoop",
  tagline: "AI-Powered K-12 Learning Platform",
  mrr: 4200,
  students: 1247,
  teachers: 89,
  schools: 12,
};

export const mindQueueItems: MindQueueItem[] = [
  {
    id: "mq-1",
    text: "AWS bill spiked 34% — investigate Lambda cold starts",
    priority: "critical",
    category: "Infrastructure",
  },
  {
    id: "mq-2",
    text: "Parent complaint: quiz results not syncing on iPad",
    priority: "critical",
    category: "Bug",
  },
  {
    id: "mq-3",
    text: "Prep demo deck for Jefferson County Schools (Thursday)",
    priority: "important",
    category: "Sales",
  },
  {
    id: "mq-4",
    text: "Review teacher onboarding flow — 40% drop-off at step 3",
    priority: "important",
    category: "Product",
  },
  {
    id: "mq-5",
    text: "Write changelog for v2.4 release",
    priority: "can-wait",
    category: "Marketing",
  },
  {
    id: "mq-6",
    text: "Explore partnership with Khan Academy content library",
    priority: "can-wait",
    category: "Strategy",
  },
];

export const todaysDecisions: Decision[] = [
  {
    id: "dec-1",
    question: "Should we offer a free tier for individual teachers?",
    options: ["Yes — growth flywheel", "No — protect margins"],
    context:
      "23 teachers signed up individually last month but churned when asked to pay. Could be a viral channel into schools.",
  },
  {
    id: "dec-2",
    question: "Hire a part-time support rep or use AI chatbot?",
    options: ["Hire human ($2k/mo)", "Ship AI chatbot (2 weeks eng)"],
    context:
      "Support tickets up 60% MoM. Current response time: 8 hours. Teachers expect < 2 hours.",
  },
  {
    id: "dec-3",
    question: "Priority for next sprint?",
    options: [
      "Real-time collaboration",
      "Advanced analytics dashboard",
      "Mobile app improvements",
    ],
    context:
      "Teachers requesting real-time collab (42 votes). Analytics asked by admins (28 votes). Mobile complaints growing.",
  },
];

export const externalSignals: ExternalSignal[] = [
  {
    id: "sig-1",
    source: "product-hunt",
    title: "EduAI Studio launched — direct competitor",
    summary:
      "New K-12 AI platform launched today. 340 upvotes in 6 hours. Similar positioning but focused on STEM only.",
    score: 340,
    timestamp: "6 hours ago",
  },
  {
    id: "sig-2",
    source: "reddit",
    title: "r/edtech: 'Best AI tools for classroom?' thread trending",
    summary:
      "180+ comments. LearnLoop mentioned 3 times positively. Top comment mentions pricing as a barrier for small schools.",
    score: 180,
    timestamp: "2 hours ago",
  },
  {
    id: "sig-3",
    source: "google-trends",
    title: "'AI tutoring' search volume +45% this week",
    summary:
      "Seasonal spike aligned with back-to-school prep. Opportunity for content marketing push.",
    score: 45,
    timestamp: "Today",
  },
  {
    id: "sig-4",
    source: "twitter",
    title: "EdTech influencer mentioned adaptive learning",
    summary:
      '@TeacherTech (42K followers): "The future of K-12 is adaptive AI. Which platforms are doing it right?"',
    score: 42,
    timestamp: "4 hours ago",
  },
];

export const studentMetrics: StudentMetric[] = [
  { label: "Active Students", value: 1247, change: 12, unit: "" },
  { label: "Avg. Session Time", value: 23, change: 8, unit: "min" },
  { label: "Quiz Completion Rate", value: 78, change: -3, unit: "%" },
  { label: "AI Tutor Interactions", value: 3420, change: 24, unit: "/day" },
];

export const studentInsightCommentary = [
  "Session times are up 8% — the new adaptive difficulty seems to be keeping students engaged longer.",
  "Quiz completion dipped slightly. Correlates with the new multi-step questions introduced last week. Consider adding hints.",
  "AI tutor usage surging in 4th-5th grade cohort. They're asking more open-ended questions than older students.",
];

export const teacherMetrics: TeacherMetric[] = [
  { label: "Weekly Active", value: 67, total: 89 },
  { label: "Content Created", value: 34, total: 50 },
  { label: "Using AI Features", value: 45, total: 89 },
  { label: "Completed Onboarding", value: 53, total: 89 },
];

export const teacherInsightCommentary = [
  "75% weekly active rate is solid. The 22 inactive teachers are mostly from Jefferson County — they onboarded but haven't gotten admin approval yet.",
  "AI feature adoption at 51%. Teachers who use AI grading save an average of 4.2 hours/week.",
];

export const calendarEvents: CalendarEvent[] = [
  { id: "cal-1", title: "Morning standup (just you)", time: "09:00", duration: 15, type: "meeting" },
  { id: "cal-2", title: "Deep work: iPad sync bug", time: "09:30", duration: 120, type: "focus" },
  { id: "cal-3", title: "Lunch break", time: "12:00", duration: 60, type: "break" },
  { id: "cal-4", title: "Sales call — Lincoln Elementary", time: "13:00", duration: 45, type: "external" },
  { id: "cal-5", title: "Deep work: Teacher onboarding flow", time: "14:00", duration: 90, type: "focus" },
  { id: "cal-6", title: "Investor update email", time: "16:00", duration: 30, type: "meeting" },
  { id: "cal-7", title: "Review support tickets", time: "16:30", duration: 30, type: "meeting" },
];

export const leads: Lead[] = [
  { id: "lead-1", name: "Sarah Chen", school: "Lincoln Elementary", value: 1200, stage: "demo", lastContact: "Yesterday" },
  { id: "lead-2", name: "Marcus Johnson", school: "Jefferson County SD", value: 8500, stage: "contacted", lastContact: "2 days ago" },
  { id: "lead-3", name: "Emily Rodriguez", school: "Westfield Academy", value: 3200, stage: "new", lastContact: "Today" },
  { id: "lead-4", name: "David Park", school: "Oak Ridge Middle", value: 2100, stage: "new", lastContact: "Today" },
  { id: "lead-5", name: "Lisa Thompson", school: "Riverside Prep", value: 4500, stage: "won", lastContact: "Last week" },
  { id: "lead-6", name: "James Wilson", school: "Metro Learning Center", value: 1800, stage: "contacted", lastContact: "3 days ago" },
  { id: "lead-7", name: "Ana Gutierrez", school: "Sunrise Charter", value: 950, stage: "lost", lastContact: "2 weeks ago" },
];

export const founderStories: FounderStory[] = [
  {
    id: "fs-1",
    quote: "The first 1,000 users are the hardest. After that, you stop guessing what to build — they tell you.",
    author: "Sal Khan",
    role: "Founder, Khan Academy",
    takeaway: "You're at 1,247 students. The inflection point is close.",
  },
  {
    id: "fs-2",
    quote: "We almost shut down three times before finding product-market fit. Each time, one teacher email kept us going.",
    author: "Luis von Ahn",
    role: "CEO, Duolingo",
    takeaway: "Save those teacher testimonials. They're fuel for the hard days.",
  },
  {
    id: "fs-3",
    quote: "Don't build for 10,000 schools. Build something one teacher can't live without.",
    author: "Naval Ravikant",
    role: "AngelList",
    takeaway: "Focus on making LearnLoop indispensable for your best 10 teachers.",
  },
];
