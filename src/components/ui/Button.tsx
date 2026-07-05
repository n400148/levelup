import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "teal" | "danger" | "ghost";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary: "bg-gradient-to-br from-[#1e6bff] to-[#0050dd] text-white glow-btn",
  secondary: "bg-[var(--bg-inset)] text-[var(--text)] border border-[var(--border)]",
  teal: "bg-[rgba(0,194,255,0.1)] text-[var(--accent-2)] border border-[rgba(0,194,255,0.3)]",
  danger: "bg-[rgba(255,61,107,0.1)] text-[var(--danger)] border border-[rgba(255,61,107,0.2)]",
  ghost: "bg-transparent text-[var(--accent)]",
};

const sizeClasses: Record<Size, string> = {
  md: "px-4.5 py-2.5 text-[13px]",
  sm: "px-3 py-1.5 text-[11px]",
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
      className={`tap-scale rounded-lg font-semibold tracking-wide uppercase font-[family-name:var(--font-rajdhani)] disabled:opacity-40 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
