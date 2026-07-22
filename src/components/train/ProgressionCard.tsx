import type { ProgressionResult } from "@/lib/progression";

export function ProgressionCard({ result }: { result: ProgressionResult }) {
  if (result.status === "no_data") {
    return (
      <div className="text-[11px] text-[var(--text-faint)] bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-lg px-3 py-2 mb-2">
        {result.message} Target: {result.repRangeLabel}.
      </div>
    );
  }

  const isAdd = result.status === "add_weight";
  const isOnTrack = result.status === "on_track";
  return (
    <div
      className={`rounded-lg px-3 py-2.5 mb-2 border ${
        isOnTrack
          ? "bg-[var(--bg-inset-2)] border-[var(--border)]"
          : isAdd
            ? "bg-[rgba(79,209,174,0.1)] border-[rgba(79,209,174,0.3)]"
            : "bg-[rgba(4,55,242,0.1)] border-[rgba(4,55,242,0.3)]"
      }`}
    >
      <div
        className={`text-[9px] font-bold tracking-widest uppercase mb-1 ${
          isOnTrack ? "text-[var(--text-mute)]" : isAdd ? "text-[var(--success)]" : "text-[#6f8dff]"
        }`}
      >
        {isOnTrack ? "✓ On Track" : isAdd ? "▲ Add Weight" : "● Beat Your Reps"} · {result.repRangeLabel}
      </div>
      <div className="text-[12.5px] text-[var(--text-dim)] leading-snug">{result.message}</div>
    </div>
  );
}
