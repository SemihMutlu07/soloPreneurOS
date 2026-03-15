import { RotateCcw } from "lucide-react";

export function DuplicateBadge() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent-orange/10 text-accent-orange text-[10px] font-medium rounded">
      <RotateCcw size={10} />
      Re-applied
    </span>
  );
}
