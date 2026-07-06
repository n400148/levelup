export function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-10 px-5 text-[var(--text-faint)] animate-rise">
      <div className="text-[34px] mb-3 opacity-40">{icon}</div>
      <div className="text-[13px] leading-relaxed max-w-[240px] mx-auto">{text}</div>
    </div>
  );
}
