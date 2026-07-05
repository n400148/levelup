export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-2 mb-3">{children}</div>;
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
    tone === "success" ? "text-[var(--success)]" : tone === "danger" ? "text-[var(--danger)]" : "text-[#3d8bff]";
  return (
    <div className="relative bg-[var(--bg-inset)] border border-[var(--border-soft)] rounded-[10px] px-2 py-3 text-center overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />
      <div className={`font-display text-[20px] font-bold leading-none ${toneClass}`}>
        {value}
        {unit && <span className="text-[12px] text-[var(--text-mute)] ml-0.5">{unit}</span>}
      </div>
      <div className="text-[9px] text-[var(--text-mute)] uppercase tracking-wide mt-1 font-bold">{label}</div>
    </div>
  );
}
