import type { Rating } from "@/lib/health-ranges";

const TONE_CLASSES: Record<Rating["tone"], string> = {
  low: "bg-[var(--bg-inset-2)] text-[var(--text-dim)]",
  optimal: "bg-[rgba(122,155,118,0.15)] text-[var(--success)]",
  high: "bg-[rgba(168,73,62,0.15)] text-[var(--danger)]",
};

export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full ${TONE_CLASSES[rating.tone]}`}
      title={rating.detail}
    >
      {rating.label}
    </span>
  );
}
