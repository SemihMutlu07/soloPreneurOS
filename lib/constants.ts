export const CANDIDATE_STATUS = {
  PENDING: "pending",
  ANALYZED: "analyzed",
  REVIEWED: "reviewed",
} as const;

export const RECOMMENDATION = {
  GORUS: "GÖRÜŞ",
  GECME: "GEÇME",
  BEKLET: "BEKLET",
} as const;

export const EVAL_BATCH_SIZE = parseInt(
  process.env.EVAL_BATCH_SIZE || "10",
  10,
);

export const RECOMMENDATION_LABELS: Record<string, string> = {
  GÖRÜŞ: "Interview",
  GEÇME: "Pass",
  BEKLET: "Hold",
};

export const RECOMMENDATION_COLORS: Record<string, string> = {
  GÖRÜŞ: "text-accent-green",
  GEÇME: "text-accent-red",
  BEKLET: "text-accent-amber",
};

// --- Sales OS Constants ---

export const LEAD_STATUSES = {
  new: {
    label: "Yeni",
    color: "bg-green-900/30 text-green-400",
    description: "Yeni gelen, henüz değerlendirilmemiş lead",
  },
  qualified: {
    label: "Nitelikli",
    color: "bg-blue-900/30 text-blue-400",
    description: "Kriterleri karşılayan nitelikli lead",
  },
  contacted: {
    label: "İletişime Geçildi",
    color: "bg-amber-900/30 text-amber-400",
    description: "İlk iletişim kuruldu",
  },
  demo: {
    label: "Demo Planlandı",
    color: "bg-purple-900/30 text-purple-400",
    description: "Demo toplantısı planlandı",
  },
  proposal: {
    label: "Teklif Gönderildi",
    color: "bg-orange-900/30 text-orange-400",
    description: "Teklif gönderildi, yanıt bekleniyor",
  },
  negotiation: {
    label: "Müzakere",
    color: "bg-amber-900/30 text-amber-300",
    description: "Fiyat ve koşullar müzakere ediliyor",
  },
  won: {
    label: "Kazanıldı",
    color: "bg-green-900/30 text-green-300",
    description: "Anlaşma kapandı, müşteri kazanıldı",
  },
  lost: {
    label: "Kaybedildi",
    color: "bg-red-900/30 text-red-400",
    description: "Fırsat kaybedildi",
  },
  nurture: {
    label: "Besleniyor",
    color: "bg-cyan-900/30 text-cyan-400",
    description: "Uzun vadeli takip — potansiyel müşteri besleniyor",
  },
} as const;

export type SalesLeadStage = keyof typeof LEAD_STATUSES;

export const LEAD_SCORE_THRESHOLDS = { hot: 70, warm: 40, cold: 0 } as const;

export const SUGGESTED_ACTIONS = {
  send_demo: "Demo Gönder",
  follow_up: "Takip Et",
  nurture: "Besle",
  disqualify: "Diskalifiye Et",
} as const;

export const SALES_TEMPLATE_NAMES = [
  "ilk_yanit",
  "demo_daveti",
  "takip",
  "teklif_gonderimi",
] as const;
