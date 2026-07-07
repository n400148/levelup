import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "teal" | "danger" | "ghost";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-[#7a6ff0] to-[#6153dd] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_2px_10px_-3px_rgba(108,92,231,0.45)]",
  secondary: "bg-[var(--bg-inset)] text-[var(--text)] border border-[var(--border)]",
  teal: "bg-[rgba(155,140,255,0.1)] text-[var(--accent-2)] border border-[rgba(155,140,255,0.3)]",
  danger: "bg-[rgba(248,113,113,0.1)] text-[var(--danger)] border border-[rgba(248,113,113,0.2)]",
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
