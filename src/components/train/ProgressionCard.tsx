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
  return (
    <div
      className={`rounded-lg px-3 py-2.5 mb-2 border ${
        isAdd
          ? "bg-[rgba(0,229,160,0.08)] border-[rgba(0,229,160,0.3)]"
          : "bg-[rgba(30,107,255,0.08)] border-[rgba(30,107,255,0.25)]"
      }`}
    >
      <div
        className={`text-[9px] font-bold tracking-widest uppercase mb-1 ${
          isAdd ? "text-[var(--success)]" : "text-[#3d8bff]"
        }`}
      >
        {isAdd ? "▲ Add Weight" : "● Beat Your Reps"} · {result.repRangeLabel}
      </div>
      <div className="text-[12.5px] text-[var(--text-dim)] leading-snug">{result.message}</div>
    </div>
  );
}
