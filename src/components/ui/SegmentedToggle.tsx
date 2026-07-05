export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-[var(--bg-inset)] border border-[var(--border)] rounded-lg p-1 mb-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`tap-scale flex-1 rounded-md py-2 text-[12px] font-bold uppercase tracking-wide ${
            value === opt.value
              ? "bg-gradient-to-br from-[#1e6bff] to-[#0050dd] text-white shadow-[0_0_14px_rgba(30,107,255,0.35)]"
              : "text-[var(--text-mute)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
