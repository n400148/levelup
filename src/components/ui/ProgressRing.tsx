export function ProgressRing({
  pct,
  label,
  sublabel,
}: {
  pct: number;
  label: string;
  sublabel: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-inset-2)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e6bff" />
            <stop offset="100%" stopColor="#00c2ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-16 text-center">
        <div className="font-display text-[20px] font-bold text-[#3d8bff]">{label}</div>
      </div>
      <div className="text-[10px] text-[var(--text-mute)] uppercase tracking-wide mt-2 font-bold text-center">
        {sublabel}
      </div>
    </div>
  );
}
