import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "teal" | "danger" | "ghost";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_10px_-3px_rgba(4,55,242,0.5)]",
  secondary: "bg-[var(--bg-inset)] text-[var(--text)] border border-[var(--border)]",
  teal: "bg-[rgba(111,141,255,0.1)] text-[var(--accent-2)] border border-[rgba(111,141,255,0.3)]",
  danger: "bg-[rgba(239,107,100,0.12)] text-[var(--danger)] border border-[rgba(239,107,100,0.25)]",
  ghost: "bg-transparent text-[var(--accent-2)]",
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-3 text-[14px]",
  sm: "px-3.5 py-2 text-[12.5px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  full = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`tap-scale rounded-xl font-semibold disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
