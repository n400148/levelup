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
              ? "bg-[var(--accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_8px_-3px_rgba(91,79,204,0.45)]"
              : "text-[var(--text-mute)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
