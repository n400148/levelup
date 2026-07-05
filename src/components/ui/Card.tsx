import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card p-4 mb-3 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2
      className={`font-display text-[11px] tracking-[0.2em] text-[var(--accent-2)] uppercase mb-3.5 flex items-center gap-2 ${className}`}
    >
      {children}
    </h2>
  );
}
