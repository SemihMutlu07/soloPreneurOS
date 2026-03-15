import type { Invoice, Expense, KDVSummary, RunwayData, TaxDeadline, TaxProvision } from "./finance-types";
import type { SalesLead, SalesActivity, SalesTemplate } from "./sales-types";

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
  company: string;
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
  tagline: "AI-Powered Learning Platform",
  mrr: 4200,
  users: 1247,
  proUsers: 89,
  teams: 12,
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
    text: "User complaint: dashboard data not syncing on iPad",
    priority: "critical",
    category: "Bug",
  },
  {
    id: "mq-3",
    text: "Prep demo deck for Jefferson Holdings (Thursday)",
    priority: "important",
    category: "Sales",
  },
  {
    id: "mq-4",
    text: "Review user onboarding flow — 40% drop-off at step 3",
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
    text: "Explore partnership with a complementary SaaS for co-marketing",
    priority: "can-wait",
    category: "Strategy",
  },
];

export const todaysDecisions: Decision[] = [
  {
    id: "dec-1",
    question: "Should we offer a free tier for individual users?",
    options: ["Yes — growth flywheel", "No — protect margins"],
    context:
      "23 users signed up individually last month but churned when asked to pay. Could be a viral acquisition channel.",
  },
  {
    id: "dec-2",
    question: "Hire a part-time support rep or use AI chatbot?",
    options: ["Hire human ($2k/mo)", "Ship AI chatbot (2 weeks eng)"],
    context:
      "Support tickets up 60% MoM. Current response time: 8 hours. Users expect < 2 hours.",
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
      "Users requesting real-time collab (42 votes). Analytics asked by power users (28 votes). Mobile complaints growing.",
  },
];

export const externalSignals: ExternalSignal[] = [
  {
    id: "sig-1",
    source: "product-hunt",
    title: "AI Studio Pro launched — direct competitor",
    summary:
      "New AI-powered SaaS launched today. 340 upvotes in 6 hours. Similar positioning but focused on enterprise only.",
    score: 340,
    timestamp: "6 hours ago",
  },
  {
    id: "sig-2",
    source: "reddit",
    title: "r/SaaS: 'Best AI tools for solopreneurs?' thread trending",
    summary:
      "180+ comments. LearnLoop mentioned 3 times positively. Top comment mentions pricing as a barrier for small teams.",
    score: 180,
    timestamp: "2 hours ago",
  },
  {
    id: "sig-3",
    source: "google-trends",
    title: "'AI productivity tools' search volume +45% this week",
    summary:
      "Consistent uptrend since Q4. Opportunity for content marketing push.",
    score: 45,
    timestamp: "Today",
  },
  {
    id: "sig-4",
    source: "twitter",
    title: "SaaS influencer mentioned AI-first tools",
    summary:
      '@IndieHackerDaily (42K followers): "The future of solo businesses is AI-first tooling. Which platforms are doing it right?"',
    score: 42,
    timestamp: "4 hours ago",
  },
];

export const studentMetrics: StudentMetric[] = [
  { label: "Active Users", value: 1247, change: 12, unit: "" },
  { label: "Avg. Session Time", value: 23, change: 8, unit: "min" },
  { label: "Task Completion Rate", value: 78, change: -3, unit: "%" },
  { label: "AI Feature Usage", value: 3420, change: 24, unit: "/day" },
];

export const studentInsightCommentary = [
  "Session times are up 8% — the new onboarding flow seems to be keeping users engaged longer.",
  "Task completion dipped slightly. Correlates with the new multi-step workflow introduced last week. Consider simplifying.",
  "AI feature usage surging in the SMB segment. They're using more advanced queries than enterprise users.",
];

export const teacherMetrics: TeacherMetric[] = [
  { label: "Weekly Active", value: 67, total: 89 },
  { label: "Projects Created", value: 34, total: 50 },
  { label: "Using AI Features", value: 45, total: 89 },
  { label: "Completed Onboarding", value: 53, total: 89 },
];

export const teacherInsightCommentary = [
  "75% weekly active rate is solid. The 22 inactive pro users are mostly from Jefferson Holdings — they onboarded but haven't gotten team admin approval yet.",
  "AI feature adoption at 51%. Pro users who use AI automation save an average of 4.2 hours/week.",
];

export const calendarEvents: CalendarEvent[] = [
  { id: "cal-1", title: "Morning standup (just you)", time: "09:00", duration: 15, type: "meeting" },
  { id: "cal-2", title: "Deep work: sync bug fix", time: "09:30", duration: 120, type: "focus" },
  { id: "cal-3", title: "Lunch break", time: "12:00", duration: 60, type: "break" },
  { id: "cal-4", title: "Sales call — Acme Corp", time: "13:00", duration: 45, type: "external" },
  { id: "cal-5", title: "Deep work: onboarding flow v2", time: "14:00", duration: 90, type: "focus" },
  { id: "cal-6", title: "Investor update email", time: "16:00", duration: 30, type: "meeting" },
  { id: "cal-7", title: "Review support tickets", time: "16:30", duration: 30, type: "meeting" },
];

export const leads: Lead[] = [
  { id: "lead-1", name: "Sarah Chen", company: "Acme Corp", value: 1200, stage: "demo", lastContact: "Yesterday" },
  { id: "lead-2", name: "Marcus Johnson", company: "Jefferson Holdings", value: 8500, stage: "contacted", lastContact: "2 days ago" },
  { id: "lead-3", name: "Emily Rodriguez", company: "Westfield Digital", value: 3200, stage: "new", lastContact: "Today" },
  { id: "lead-4", name: "David Park", company: "Oak Ridge Labs", value: 2100, stage: "new", lastContact: "Today" },
  { id: "lead-5", name: "Lisa Thompson", company: "Riverside Ventures", value: 4500, stage: "won", lastContact: "Last week" },
  { id: "lead-6", name: "James Wilson", company: "Metro Studio", value: 1800, stage: "contacted", lastContact: "3 days ago" },
  { id: "lead-7", name: "Ana Gutierrez", company: "Sunrise Co", value: 950, stage: "lost", lastContact: "2 weeks ago" },
];

export const founderStories: FounderStory[] = [
  {
    id: "fs-1",
    quote: "The first 1,000 users are the hardest. After that, you stop guessing what to build — they tell you.",
    author: "Sal Khan",
    role: "Founder, Khan Academy",
    takeaway: "You're at 1,247 users. The inflection point is close.",
  },
  {
    id: "fs-2",
    quote: "We almost shut down three times before finding product-market fit. Each time, one user email kept us going.",
    author: "Luis von Ahn",
    role: "CEO, Duolingo",
    takeaway: "Save those user testimonials. They're fuel for the hard days.",
  },
  {
    id: "fs-3",
    quote: "Don't build for 10,000 companies. Build something one user can't live without.",
    author: "Naval Ravikant",
    role: "AngelList",
    takeaway: "Focus on making LearnLoop indispensable for your best 10 power users.",
  },
];

// --- Finance OS Mock Data ---

export const TCMB_USD_RATE = 32.5;

export const financeInvoices: Invoice[] = [
  {
    id: "inv-1",
    user_id: "user-1",
    client_name: "Teknoloji A.Ş.",
    client_vkn: "1234567890",
    description: "Yazılım danışmanlık hizmeti - Mart 2026",
    gross_amount: 50000,
    kdv_rate: 20,
    kdv_amount: 10000,
    stopaj_rate: 20,
    stopaj_amount: 10000,
    net_amount: 50000,
    invoice_type: "e-smm",
    status: "odendi",
    created_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "inv-2",
    user_id: "user-1",
    client_name: "Teknoloji A.Ş.",
    client_vkn: "1234567890",
    description: "API entegrasyon projesi - Mart 2026",
    gross_amount: 35000,
    kdv_rate: 20,
    kdv_amount: 7000,
    stopaj_rate: 20,
    stopaj_amount: 7000,
    net_amount: 35000,
    invoice_type: "e-smm",
    status: "beklemede",
    created_at: "2026-03-05T14:00:00Z",
  },
  {
    id: "inv-3",
    user_id: "user-1",
    client_name: "StartupXYZ Ltd",
    client_vkn: null,
    description: "Full-stack geliştirme - Şubat 2026",
    gross_amount: 25000,
    kdv_rate: 20,
    kdv_amount: 5000,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: 30000,
    invoice_type: "e-arsiv",
    status: "odendi",
    created_at: "2026-02-20T09:00:00Z",
  },
  {
    id: "inv-4",
    user_id: "user-1",
    client_name: "Dijital Ajans",
    client_vkn: "9876543210",
    description: "UI/UX danışmanlık - Şubat 2026",
    gross_amount: 12000,
    kdv_rate: 20,
    kdv_amount: 2400,
    stopaj_rate: 20,
    stopaj_amount: 2400,
    net_amount: 12000,
    invoice_type: "e-smm",
    status: "odendi",
    created_at: "2026-02-15T11:00:00Z",
  },
  {
    id: "inv-5",
    user_id: "user-1",
    client_name: "StartupXYZ Ltd",
    client_vkn: null,
    description: "Mobil uygulama geliştirme - Mart 2026",
    gross_amount: 18000,
    kdv_rate: 20,
    kdv_amount: 3600,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: 21600,
    invoice_type: "e-arsiv",
    status: "beklemede",
    created_at: "2026-03-10T16:00:00Z",
  },
  {
    id: "inv-6",
    user_id: "user-1",
    client_name: "Freelance Proje",
    client_vkn: null,
    description: "Landing page tasarım ve geliştirme",
    gross_amount: 8000,
    kdv_rate: 1,
    kdv_amount: 80,
    stopaj_rate: null,
    stopaj_amount: null,
    net_amount: 8080,
    invoice_type: "e-arsiv",
    status: "gecmis",
    created_at: "2026-01-25T08:00:00Z",
  },
];

export const financeExpenses: Expense[] = [
  {
    id: "exp-1",
    user_id: "user-1",
    description: "Vercel Pro",
    amount: 2200,
    kdv_paid: 440,
    category: "Altyapı",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exp-2",
    user_id: "user-1",
    description: "AWS Hizmetleri",
    amount: 4500,
    kdv_paid: 900,
    category: "Altyapı",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exp-3",
    user_id: "user-1",
    description: "Figma Pro",
    amount: 800,
    kdv_paid: 160,
    category: "Araçlar",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exp-4",
    user_id: "user-1",
    description: "Coworking Alanı",
    amount: 3500,
    kdv_paid: 700,
    category: "Ofis",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exp-5",
    user_id: "user-1",
    description: "Domain & Hosting",
    amount: 1200,
    kdv_paid: 240,
    category: "Altyapı",
    date: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
];

export const financeKDVSummary: KDVSummary = {
  collected: 28080,
  paid: 2440 + 4200,
  payable: 28080 - (2440 + 4200),
};

export const financeRunway: RunwayData = {
  cash_tl: 245000,
  cash_usd: Math.round(245000 / TCMB_USD_RATE),
  monthly_burn: 22000,
  runway_months: Math.round(245000 / 22000),
};

export const financeTaxDeadlines: TaxDeadline[] = [
  {
    id: "td-1",
    name: "KDV Beyannamesi",
    type: "KDV",
    due_date: "2026-03-26",
    estimated_amount: 21440,
    status: "hazirlaniyor",
    description: "Mart ayı KDV beyannamesi",
  },
  {
    id: "td-2",
    name: "Geçici Vergi (Q1)",
    type: "Geçici Vergi",
    due_date: "2026-05-17",
    estimated_amount: 8400,
    status: "bekliyor",
    description: "2026 Q1 geçici vergi beyannamesi",
  },
  {
    id: "td-3",
    name: "KDV Beyannamesi",
    type: "KDV",
    due_date: "2026-04-26",
    estimated_amount: 21440,
    status: "bekliyor",
    description: "Nisan ayı KDV beyannamesi",
  },
  {
    id: "td-4",
    name: "SGK (Bağ-Kur) Primi",
    type: "SGK",
    due_date: "2026-03-31",
    estimated_amount: 2800,
    status: "bekliyor",
    description: "Mart ayı Bağ-Kur primi",
  },
  {
    id: "td-5",
    name: "KDV Beyannamesi",
    type: "KDV",
    due_date: "2026-05-26",
    estimated_amount: 21440,
    status: "bekliyor",
    description: "Mayıs ayı KDV beyannamesi",
  },
];

export const financeTaxProvisions: TaxProvision[] = [
  {
    id: "tp-1",
    user_id: "user-1",
    period: "2026-Q1",
    kdv_payable: 3200,
    gecici_vergi_estimate: 8400,
    sgk_amount: 2800,
    total_provision: 14400,
    created_at: "2026-03-01T00:00:00Z",
  },
];

// --- Sales OS Mock Data ---

export const salesLeads: SalesLead[] = [
  // 3 new (unqualified)
  {
    id: "sl-1",
    name: "Elif Yılmaz",
    email: "elif@ogrenio.com",
    company: "ÖğrenIO",
    role: "Kurucu",
    stage: "new",
    deal_value: 75000,
    ai_score: 25,
    ai_summary: "EdTech alanında yeni kurulmuş startup. Bütçe ve karar süreci belirsiz.",
    ai_signals: {
      positive: ["EdTech sektöründe aktif"],
      negative: ["Bütçe belirsiz", "Karar verici net değil"],
      questions: ["Bütçe aralığı nedir?", "Karar verici kim?"],
    },
    ai_suggested_action: "follow_up",
    ai_draft_response: null,
    source: "website",
    created_at: "2026-03-14T09:00:00Z",
    last_contact_at: "2026-03-14T09:00:00Z",
    notes: "Web sitesinden demo formu doldurdu.",
  },
  {
    id: "sl-2",
    name: "Burak Demir",
    email: "burak@kodlab.io",
    company: "KodLab",
    role: "CTO",
    stage: "new",
    deal_value: 50000,
    ai_score: 30,
    ai_summary: "Teknik karar verici ancak küçük ekip. İlk iletişim henüz kurulmadı.",
    ai_signals: {
      positive: ["Teknik karar verici"],
      negative: ["Küçük ekip", "Henüz iletişim yok"],
      questions: ["Ekip büyüklüğü?", "Mevcut araç kullanımı?"],
    },
    ai_suggested_action: "follow_up",
    ai_draft_response: null,
    source: "linkedin",
    created_at: "2026-03-13T15:00:00Z",
    last_contact_at: "2026-03-13T15:00:00Z",
    notes: "LinkedIn'den bağlantı isteği geldi.",
  },
  {
    id: "sl-3",
    name: "Selin Arslan",
    email: "selin@dijitalsinif.com",
    company: "DijitalSınıf",
    role: "Ürün Müdürü",
    stage: "new",
    deal_value: 120000,
    ai_score: 35,
    ai_summary: "Büyük eğitim kurumu, referansla geldi. Rakip ürün kullanıyor — geçiş maliyeti yüksek olabilir.",
    ai_signals: {
      positive: ["Büyük kurum", "Eğitim sektörü"],
      negative: ["Rakip ürün kullanıyor"],
      questions: ["Mevcut çözümden memnuniyet?", "Geçiş takvimi?"],
    },
    ai_suggested_action: "nurture",
    ai_draft_response: null,
    source: "referral",
    created_at: "2026-03-12T11:00:00Z",
    last_contact_at: "2026-03-12T11:00:00Z",
    notes: "Mevcut müşteriden referans.",
  },
  // 2 mql/sql (qualified, scored)
  {
    id: "sl-4",
    name: "Ahmet Kaya",
    email: "ahmet@egitimplus.com",
    company: "EğitimPlus",
    role: "Genel Müdür",
    stage: "mql",
    deal_value: 200000,
    ai_score: 55,
    ai_summary: "Webinar'a katıldı, içerik indirdi. Bütçe onayı var ama karar süreci uzun.",
    ai_signals: {
      positive: ["Bütçe onayı var", "Aktif araştırma yapıyor"],
      negative: ["Uzun karar süreci"],
      questions: ["Karar süreci takvimi?", "Diğer paydaşlar kimler?"],
    },
    ai_suggested_action: "send_demo",
    ai_draft_response: "Merhaba Ahmet, webinar'a katılımınız için teşekkürler. Size özel bir demo hazırlamak isteriz.",
    source: "webinar",
    created_at: "2026-03-05T10:00:00Z",
    last_contact_at: "2026-03-10T14:00:00Z",
    notes: "Webinar'a katıldı, içerik indirdi.",
  },
  {
    id: "sl-5",
    name: "Zeynep Çelik",
    email: "zeynep@akilliders.com",
    company: "AkıllıDers",
    role: "CEO",
    stage: "sql",
    deal_value: 350000,
    ai_score: 65,
    ai_summary: "Karar verici, bütçe uygun, hızlı yanıt veriyor. Q2 bütçe dönemine bağlı.",
    ai_signals: {
      positive: ["Karar verici", "Bütçe uygun", "Hızlı yanıt veriyor"],
      negative: ["Q2 bütçe dönemine bağlı"],
      questions: ["Q2 bütçe onayı ne zaman?"],
    },
    ai_suggested_action: "send_demo",
    ai_draft_response: "Merhaba Zeynep, ihtiyaç analizimiz tamamlandı. Canlı demo için uygun zamanınızı paylaşır mısınız?",
    source: "website",
    created_at: "2026-03-01T08:00:00Z",
    last_contact_at: "2026-03-11T16:00:00Z",
    notes: "İhtiyaç analizi tamamlandı.",
  },
  // 2 contacted
  {
    id: "sl-6",
    name: "Mert Özkan",
    email: "mert@kampusai.com",
    company: "KampüsAI",
    role: "VP Engineering",
    stage: "contacted",
    deal_value: 180000,
    ai_score: 50,
    ai_summary: "Teknik uyum yüksek, AI odaklı vizyon. Ancak alternatif çözümleri değerlendiriyor.",
    ai_signals: {
      positive: ["Teknik uyum yüksek", "AI odaklı vizyon"],
      negative: ["Başka çözümleri de değerlendiriyor"],
      questions: ["Hangi alternatifleri değerlendiriyor?", "Karar kriterleri?"],
    },
    ai_suggested_action: "send_demo",
    ai_draft_response: null,
    source: "conference",
    created_at: "2026-02-25T12:00:00Z",
    last_contact_at: "2026-03-08T10:00:00Z",
    notes: "Konferansta tanıştık, ilk görüşme yapıldı.",
  },
  {
    id: "sl-7",
    name: "Ayşe Polat",
    email: "ayse@stemturkiye.org",
    company: "STEM Türkiye",
    role: "Program Direktörü",
    stage: "contacted",
    deal_value: 95000,
    ai_score: 42,
    ai_summary: "Kamu projesi potansiyeli var ama bürokratik süreç yavaş.",
    ai_signals: {
      positive: ["Kamu projesi potansiyeli"],
      negative: ["Bürokratik süreç", "Yavaş karar alma"],
      questions: ["İhale süreci var mı?", "Proje takvimi?"],
    },
    ai_suggested_action: "nurture",
    ai_draft_response: null,
    source: "email",
    created_at: "2026-02-20T09:00:00Z",
    last_contact_at: "2026-03-07T15:00:00Z",
    notes: "İlk bilgi maili gönderildi, olumlu dönüş aldık.",
  },
  // 1 demo_scheduled
  {
    id: "sl-8",
    name: "Can Başaran",
    email: "can@eduvizyon.com",
    company: "EduVizyon",
    role: "Kurucu Ortak",
    stage: "demo_scheduled",
    deal_value: 280000,
    ai_score: 72,
    ai_summary: "Demo planlandı, teknik ekip katılacak, bütçe ayrılmış. Rakip teklif almış — demo'da fark yaratmalı.",
    ai_signals: {
      positive: ["Demo planlandı", "Teknik ekip katılacak", "Bütçe ayrılmış"],
      negative: ["Rakip teklif almış"],
      questions: ["Rakip teklif detayları?", "Teknik gereksinimler?"],
    },
    ai_suggested_action: "follow_up",
    ai_draft_response: "Merhaba Can, 18 Mart demo'muz için hazırlıklar tamam. Öncesinde teknik gereksinimleri paylaşır mısınız?",
    source: "referral",
    created_at: "2026-02-15T14:00:00Z",
    last_contact_at: "2026-03-12T11:00:00Z",
    notes: "18 Mart'ta demo planlandı. 5 kişilik ekip katılacak.",
  },
  // 1 proposal_sent
  {
    id: "sl-9",
    name: "Deniz Tuncer",
    email: "deniz@okultech.com",
    company: "OkulTech",
    role: "COO",
    stage: "proposal_sent",
    deal_value: 420000,
    ai_score: 78,
    ai_summary: "Teklif inceleniyor, olumlu geri bildirim var. YK onayı bekleniyor.",
    ai_signals: {
      positive: ["Teklif inceleniyor", "Olumlu geri bildirim", "Referans istedi"],
      negative: ["Yönetim kurulu onayı gerekli"],
      questions: ["YK toplantısı ne zaman?", "Referans paylaşıldı mı?"],
    },
    ai_suggested_action: "follow_up",
    ai_draft_response: "Merhaba Deniz, teklifimizle ilgili sorularınız varsa yardımcı olmaktan memnuniyet duyarım. Referanslarımızı da paylaşabilirim.",
    source: "website",
    created_at: "2026-02-01T10:00:00Z",
    last_contact_at: "2026-03-10T09:00:00Z",
    notes: "Detaylı teklif gönderildi. YK toplantısı 20 Mart.",
  },
  // 1 negotiation
  {
    id: "sl-10",
    name: "Hakan Erdoğan",
    email: "hakan@bilgiplatform.com",
    company: "BilgiPlatform",
    role: "CEO",
    stage: "negotiation",
    deal_value: 500000,
    ai_score: 85,
    ai_summary: "Teknik onay alındı, fiyat müzakeresi aktif. %10 indirim talebi var — karşı teklif hazırlanıyor.",
    ai_signals: {
      positive: ["Fiyat müzakeresi aktif", "Teknik onay alındı", "Ödeme planı tartışılıyor"],
      negative: ["İndirim talebi var"],
      questions: ["Kabul edilebilir indirim oranı?", "Ödeme planı tercihi?"],
    },
    ai_suggested_action: "follow_up",
    ai_draft_response: "Merhaba Hakan, yıllık plan için %7 indirim ve ek özellikler içeren karşı teklifimizi değerlendirmenizi rica ederiz.",
    source: "referral",
    created_at: "2026-01-15T08:00:00Z",
    last_contact_at: "2026-03-13T17:00:00Z",
    notes: "Yıllık plan için %10 indirim talebi var. Karşı teklif hazırlanıyor.",
  },
  // 1 won
  {
    id: "sl-11",
    name: "Fatma Şahin",
    email: "fatma@sinifici.com",
    company: "Sınıfİçi",
    role: "Kurucu",
    stage: "won",
    deal_value: 150000,
    ai_score: 95,
    ai_summary: "Sözleşme imzalandı, ödeme alındı. Onboarding süreci devam ediyor.",
    ai_signals: {
      positive: ["Sözleşme imzalandı", "Ödeme alındı", "Onboarding başladı"],
      negative: [],
      questions: [],
    },
    ai_suggested_action: "follow_up",
    ai_draft_response: null,
    source: "website",
    created_at: "2026-01-10T10:00:00Z",
    last_contact_at: "2026-03-05T14:00:00Z",
    notes: "Yıllık sözleşme imzalandı. Onboarding süreci devam ediyor.",
  },
  // 1 lost
  {
    id: "sl-12",
    name: "Oğuz Yıldırım",
    email: "oguz@dersmarket.com",
    company: "DersMarket",
    role: "CTO",
    stage: "lost",
    deal_value: 90000,
    ai_score: 15,
    ai_summary: "Rakibi tercih etti. Fiyat uyumsuzluğu ve teknik gereksinim eksiklikleri ana sebepler.",
    ai_signals: {
      positive: [],
      negative: ["Rakibi tercih etti", "Fiyat uyumsuzluğu", "Teknik gereksinimler karşılanmadı"],
      questions: [],
    },
    ai_suggested_action: "disqualify",
    ai_draft_response: null,
    source: "linkedin",
    created_at: "2026-01-20T11:00:00Z",
    last_contact_at: "2026-02-28T16:00:00Z",
    notes: "Rakip ürünü tercih etti. Fiyat ve entegrasyon eksiklikleri sebep gösterildi.",
  },
];

export const salesActivities: SalesActivity[] = [
  { id: "sa-1", lead_id: "sl-1", type: "email_received", subject: "Demo talebi", body: "Merhaba, ürününüzü inceledim. Demo görmek istiyorum.", created_at: "2026-03-14T09:00:00Z", created_by: "user" },
  { id: "sa-2", lead_id: "sl-2", type: "note", subject: "LinkedIn bağlantısı", body: "LinkedIn'den bağlantı isteği kabul edildi. Profili incelendi.", created_at: "2026-03-13T15:30:00Z", created_by: "user" },
  { id: "sa-3", lead_id: "sl-4", type: "email_sent", subject: "Webinar takip", body: "Webinar'a katılımınız için teşekkürler. Detaylı bilgi ekte.", created_at: "2026-03-06T10:00:00Z", created_by: "ai" },
  { id: "sa-4", lead_id: "sl-4", type: "email_received", subject: "Re: Webinar takip", body: "Teşekkürler, inceleyeceğim. Hafta sonu dönüş yaparım.", created_at: "2026-03-07T14:00:00Z", created_by: "system" },
  { id: "sa-5", lead_id: "sl-4", type: "status_change", subject: "MQL olarak işaretlendi", body: "İçerik indirme ve webinar katılımı sonrası MQL olarak değerlendirildi.", created_at: "2026-03-10T14:00:00Z", created_by: "ai" },
  { id: "sa-6", lead_id: "sl-5", type: "email_sent", subject: "İhtiyaç analizi", body: "İhtiyaçlarınızı daha iyi anlamamız için kısa bir görüşme yapalım.", created_at: "2026-03-02T09:00:00Z", created_by: "user" },
  { id: "sa-7", lead_id: "sl-5", type: "meeting", subject: "İhtiyaç analizi görüşmesi", body: "45 dakika süren görüşme. Temel ihtiyaçlar: raporlama, AI asistan, entegrasyon.", created_at: "2026-03-05T14:00:00Z", created_by: "user" },
  { id: "sa-8", lead_id: "sl-5", type: "status_change", subject: "SQL olarak işaretlendi", body: "İhtiyaç analizi sonrası SQL olarak değerlendirildi. Bütçe uygun.", created_at: "2026-03-11T16:00:00Z", created_by: "ai" },
  { id: "sa-9", lead_id: "sl-6", type: "note", subject: "Konferans notu", body: "EdTech Summit'te tanıştık. AI entegrasyonlarına çok ilgili.", created_at: "2026-02-25T18:00:00Z", created_by: "user" },
  { id: "sa-10", lead_id: "sl-6", type: "email_sent", subject: "Tanışma takibi", body: "Konferansta tanışmamızın ardından detaylı bilgi paylaşıyorum.", created_at: "2026-02-27T10:00:00Z", created_by: "user" },
  { id: "sa-11", lead_id: "sl-6", type: "email_received", subject: "Re: Tanışma takibi", body: "Teşekkürler, ekibimle paylaşacağım.", created_at: "2026-03-08T10:00:00Z", created_by: "system" },
  { id: "sa-12", lead_id: "sl-8", type: "email_sent", subject: "Demo daveti", body: "Ekibinizle birlikte canlı demo planlamak isteriz.", created_at: "2026-03-01T10:00:00Z", created_by: "ai" },
  { id: "sa-13", lead_id: "sl-8", type: "email_received", subject: "Re: Demo daveti", body: "18 Mart Çarşamba 14:00 uygun. 5 kişi katılacak.", created_at: "2026-03-03T11:00:00Z", created_by: "system" },
  { id: "sa-14", lead_id: "sl-8", type: "status_change", subject: "Demo planlandı", body: "18 Mart 14:00 — Zoom demo. Katılımcılar: Can, CTO, 3 developer.", created_at: "2026-03-12T11:00:00Z", created_by: "user" },
  { id: "sa-15", lead_id: "sl-9", type: "meeting", subject: "Teklif sunumu", body: "Detaylı teklif sunuldu. Yönetim kurulu onayı beklenecek.", created_at: "2026-03-05T14:00:00Z", created_by: "user" },
  { id: "sa-16", lead_id: "sl-9", type: "email_sent", subject: "Teklif dokümanı", body: "Görüşmemiz doğrultusunda hazırlanan teklif ekte.", created_at: "2026-03-06T09:00:00Z", created_by: "ai" },
  { id: "sa-17", lead_id: "sl-9", type: "status_change", subject: "Teklif gönderildi", body: "Resmi teklif gönderildi. YK toplantısı 20 Mart.", created_at: "2026-03-10T09:00:00Z", created_by: "system" },
  { id: "sa-18", lead_id: "sl-10", type: "meeting", subject: "Fiyat müzakeresi", body: "Yıllık plan için %10 indirim talep edildi. Karşı teklif hazırlanacak.", created_at: "2026-03-10T15:00:00Z", created_by: "user" },
  { id: "sa-19", lead_id: "sl-10", type: "email_sent", subject: "Karşı teklif", body: "Yıllık plan için %7 indirim ve ek özellikler içeren karşı teklif.", created_at: "2026-03-13T17:00:00Z", created_by: "ai" },
  { id: "sa-20", lead_id: "sl-11", type: "status_change", subject: "Kazanıldı!", body: "Yıllık sözleşme imzalandı. 150.000 TL. Onboarding başlıyor.", created_at: "2026-03-01T10:00:00Z", created_by: "system" },
  { id: "sa-21", lead_id: "sl-11", type: "note", subject: "Onboarding notu", body: "Teknik ekiple onboarding görüşmesi yapıldı. Entegrasyon 2 hafta sürecek.", created_at: "2026-03-05T14:00:00Z", created_by: "user" },
  { id: "sa-22", lead_id: "sl-12", type: "status_change", subject: "Kaybedildi", body: "Rakip ürünü tercih etti. Fiyat ve entegrasyon eksiklikleri ana sebepler.", created_at: "2026-02-28T16:00:00Z", created_by: "system" },
];

export const salesTemplates: SalesTemplate[] = [
  {
    id: "st-1",
    name: "ilk_yanit",
    subject_template: "LearnLoop — {{company}} için çözüm önerimiz",
    body_template: "Merhaba {{name}},\n\nLearnLoop'a gösterdiğiniz ilgi için teşekkürler. {{company}} için özelleştirilmiş bir demo hazırlamak isteriz.\n\nSize uygun bir zaman dilimi belirleyebilir miyiz?\n\nSaygılarımla",
  },
  {
    id: "st-2",
    name: "demo_daveti",
    subject_template: "{{company}} için canlı demo daveti",
    body_template: "Merhaba {{name}},\n\n{{company}} ekibinizle birlikte LearnLoop'un canlı demosunu görmek ister misiniz?\n\nDemo süresince:\n- Platform özellikleri\n- AI asistan entegrasyonu\n- Raporlama araçları\n\nkonularını detaylı inceleyeceğiz.\n\nUygun zamanınızı paylaşır mısınız?",
  },
  {
    id: "st-3",
    name: "takip",
    subject_template: "Takip: {{company}} — LearnLoop",
    body_template: "Merhaba {{name}},\n\nGeçtiğimiz görüşmemizin ardından durumu kontrol etmek istedim. {{company}} için LearnLoop hakkında sorularınız varsa yardımcı olmaktan mutluluk duyarım.\n\nİyi çalışmalar",
  },
  {
    id: "st-4",
    name: "teklif_gonderimi",
    subject_template: "{{company}} için LearnLoop teklifi",
    body_template: "Merhaba {{name}},\n\n{{company}} ihtiyaçlarınız doğrultusunda hazırladığımız teklifi ekte bulabilirsiniz.\n\nTeklif içeriği:\n- Lisans detayları\n- Fiyatlandırma\n- Uygulama takvimi\n- Destek kapsamı\n\nSorularınız için her zaman ulaşabilirsiniz.\n\nSaygılarımla",
  },
];
