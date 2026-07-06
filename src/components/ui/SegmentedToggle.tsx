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
              ? "bg-gradient-to-br from-[#6c5ce7] to-[#5644d1] text-white shadow-[0_2px_10px_-2px_rgba(108,92,231,0.5)]"
              : "text-[var(--text-mute)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
