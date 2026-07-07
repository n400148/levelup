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
            <stop offset="0%" stopColor="#5b4fcc" />
            <stop offset="100%" stopColor="#8a7ee8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-16 text-center">
        <div className="font-mono text-[19px] font-bold text-[var(--text)]">{label}</div>
      </div>
      <div className="eyebrow mt-2 text-center">{sublabel}</div>
    </div>
  );
}
