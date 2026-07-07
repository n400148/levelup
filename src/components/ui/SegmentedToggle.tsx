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
    <div className="flex bg-[var(--bg-inset)] rounded-xl p-1 mb-4">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`tap-scale flex-1 rounded-lg py-2 text-[13px] font-semibold ${
            value === opt.value
              ? "bg-gradient-to-b from-[#7a6ff0] to-[#6153dd] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_8px_-3px_rgba(108,92,231,0.4)]"
              : "text-[var(--text-mute)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
