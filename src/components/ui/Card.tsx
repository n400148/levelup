import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card p-5 mb-3.5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={`font-display text-[15px] font-semibold text-[var(--text)] mb-4 flex items-center gap-2 ${className}`}>
      {children}
    </h2>
  );
}
