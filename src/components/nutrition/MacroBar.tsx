export function MacroBar({
  label,
  current,
  target,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const over = target > 0 && current > target;

  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-[var(--text-mute)] uppercase font-bold tracking-wide">{label}</span>
        <span className={over ? "text-[var(--danger)]" : "text-[var(--text-dim)]"}>
          {current}
          <span className="text-[var(--text-faint)]"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-[6px] rounded-full bg-[var(--bg-inset-2)] overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? "bg-[var(--danger)]" : "bg-gradient-to-r from-[#1e6bff] to-[#00c2ff]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
