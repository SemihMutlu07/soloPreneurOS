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
