export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] leading-relaxed text-[var(--text-mute)] border-t border-[var(--border-soft)] pt-2.5 mt-3">
      {children}
    </p>
  );
}
