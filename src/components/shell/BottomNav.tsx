"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/weight", label: "Weight", icon: "⚖" },
  { href: "/train", label: "Train", icon: "🏋" },
  { href: "/nutrition", label: "Nutrition", icon: "🍽" },
  { href: "/body", label: "Body", icon: "📊" },
  { href: "/stack", label: "Stack", icon: "💉" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/insights", label: "Insights", icon: "💡" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex bg-black/95 border-t border-[var(--border)] z-20 [padding-bottom:env(safe-area-inset-bottom)]">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tap-scale flex-1 flex flex-col items-center justify-center gap-0.5 py-2 pb-3 ${
              active ? "text-[#3d8bff]" : "text-[var(--text-faint)]"
            }`}
          >
            <span className="text-[17px] leading-none">{tab.icon}</span>
            <span className="text-[8px] tracking-wide uppercase font-bold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
