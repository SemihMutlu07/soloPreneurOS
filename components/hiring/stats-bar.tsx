import type { CandidateWithEvaluation } from "@/lib/hiring-types";

interface StatsBarProps {
  candidates: CandidateWithEvaluation[];
}

export function StatsBar({ candidates }: StatsBarProps) {
  const total = candidates.length;
  const pending = candidates.filter((c) => c.status === "pending").length;
  const gorus = candidates.filter(
    (c) => c.evaluation?.recommendation === "GÖRÜŞ",
  ).length;
  const gecme = candidates.filter(
    (c) => c.evaluation?.recommendation === "GEÇME",
  ).length;
  const beklet = candidates.filter(
    (c) => c.evaluation?.recommendation === "BEKLET",
  ).length;

  const stats = [
    { label: "Total", value: total, color: "text-text-primary" },
    { label: "Pending", value: pending, color: "text-accent-blue" },
    { label: "Interview", value: gorus, color: "text-accent-green" },
    { label: "Pass", value: gecme, color: "text-accent-red" },
    { label: "Hold", value: beklet, color: "text-accent-amber" },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card flex flex-col items-center px-5 py-3 min-w-[100px]"
        >
          <span className={`text-2xl font-semibold font-mono ${stat.color}`}>
            {stat.value}
          </span>
          <span className="text-xs text-text-secondary mt-1">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
