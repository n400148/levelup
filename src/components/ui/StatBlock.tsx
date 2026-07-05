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
    <div className="bg-[var(--bg-inset)] rounded-2xl px-3 py-3.5 text-center">
      <div className={`font-display text-[21px] font-semibold leading-none ${toneClass}`}>
        {value}
        {unit && <span className="text-[12px] text-[var(--text-mute)] ml-0.5 font-normal">{unit}</span>}
      </div>
      <div className="text-[10.5px] text-[var(--text-mute)] mt-1.5 font-medium">{label}</div>
    </div>
  );
}
