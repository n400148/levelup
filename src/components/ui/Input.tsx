import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full bg-[var(--bg-inset)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--text)] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(30,107,255,0.18)] transition-shadow";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] tracking-wide uppercase text-[var(--text-mute)] font-bold mb-1.5 mt-3 first:mt-0">
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} resize-none min-h-[80px] leading-relaxed ${props.className ?? ""}`} />;
}
