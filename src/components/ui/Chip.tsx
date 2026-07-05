export function Chip({
  selected = false,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-scale inline-flex items-center rounded-md border px-2.5 py-1.5 m-0.5 text-[12px] font-medium ${
        selected
          ? "bg-[rgba(30,107,255,0.15)] border-[var(--accent)] text-[#3d8bff]"
          : "bg-[var(--bg-inset-2)] border-[var(--border)] text-[var(--text-dim)]"
      }`}
    >
      {children}
    </button>
  );
}

export function Tag({
  tone = "blue",
  children,
}: {
  tone?: "blue" | "teal" | "red" | "green";
  children: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    blue: "bg-[rgba(30,107,255,0.12)] text-[#3d8bff]",
    teal: "bg-[rgba(0,194,255,0.12)] text-[var(--accent-2)]",
    red: "bg-[rgba(255,61,107,0.12)] text-[var(--danger)]",
    green: "bg-[rgba(0,229,160,0.12)] text-[var(--success)]",
  };
  return (
    <span
      className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold tracking-wide uppercase ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function DeltaPill({ value, suffix = "" }: { value: number; suffix?: string }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const tone = isFlat ? "bg-[rgba(74,96,128,0.2)] text-[var(--text-mute)]" : isUp ? "bg-[rgba(255,61,107,0.15)] text-[var(--danger)]" : "bg-[rgba(0,229,160,0.15)] text-[var(--success)]";
  const sign = isFlat ? "" : isUp ? "+" : "";
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded ${tone}`}>
      {sign}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}
