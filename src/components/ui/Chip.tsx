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
      className={`tap-scale inline-flex items-center rounded-full border px-3 py-1.5 m-0.5 text-[12.5px] font-medium ${
        selected
          ? "bg-[rgba(201,124,74,0.15)] border-[var(--accent)] text-[#dda06b]"
          : "bg-[var(--bg-inset-2)] border-transparent text-[var(--text-dim)]"
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
    blue: "bg-[rgba(201,124,74,0.12)] text-[#dda06b]",
    teal: "bg-[rgba(221,160,107,0.12)] text-[var(--accent-2)]",
    red: "bg-[rgba(168,73,62,0.15)] text-[var(--danger)]",
    green: "bg-[rgba(122,155,118,0.15)] text-[var(--success)]",
  };
  return (
    <span className={`inline-block text-[10.5px] px-2.5 py-1 rounded-full font-semibold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export function DeltaPill({ value, suffix = "" }: { value: number; suffix?: string }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const tone = isFlat ? "bg-[rgba(134,134,143,0.15)] text-[var(--text-mute)]" : isUp ? "bg-[rgba(168,73,62,0.15)] text-[var(--danger)]" : "bg-[rgba(122,155,118,0.15)] text-[var(--success)]";
  const sign = isFlat ? "" : isUp ? "+" : "";
  return (
    <span className={`inline-flex items-center font-mono text-[11.5px] font-bold px-2.5 py-1 rounded-full ${tone}`}>
      {sign}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}
