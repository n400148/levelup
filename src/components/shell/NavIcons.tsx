type IconProps = { className?: string };

const base = "w-[19px] h-[19px]";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function WeightIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} {...stroke}>
      <rect x="3" y="9" width="4" height="6" rx="1" />
      <rect x="17" y="9" width="4" height="6" rx="1" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <rect x="9.5" y="7" width="1.5" height="10" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="13" y="7" width="1.5" height="10" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TrainIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} {...stroke}>
      <path d="M6 8v8" />
      <path d="M3 10v4" />
      <path d="M18 8v8" />
      <path d="M21 10v4" />
      <path d="M6 12h12" />
    </svg>
  );
}

export function NutritionIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} {...stroke}>
      <path d="M7 3v6a2 2 0 0 0 2 2v10" />
      <path d="M7 3v6" />
      <path d="M10 3v6" />
      <path d="M17 3c-1.8 1.2-3 3.4-3 6.2 0 2.3 1.3 3.8 3 4.3V21" />
    </svg>
  );
}

export function BodyIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 9 9" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function StackIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} {...stroke}>
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

export function GoalsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InsightsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`} {...stroke}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7v.5h5.6v-.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z" />
    </svg>
  );
}
