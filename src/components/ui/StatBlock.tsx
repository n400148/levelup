export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-2.5 mb-1">{children}</div>;
}

export function StatBlock({
  label,
  value,
  unit,
  tone = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success" ? "text-[var(--success)]" : tone === "danger" ? "text-[var(--danger)]" : "text-[var(--text)]";
  return (
    <div className="bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-2xl px-3 py-3.5 text-center">
      <div className={`font-mono text-[20px] font-bold leading-none ${toneClass}`}>
        {value}
        {unit && <span className="text-[11px] text-[var(--text-mute)] ml-1 font-normal font-body">{unit}</span>}
      </div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  );
}
