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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex bg-[var(--bg)]/90 backdrop-blur-md border-t border-[var(--border-soft)] z-20 [padding-bottom:env(safe-area-inset-bottom)]">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tap-scale flex-1 flex flex-col items-center justify-center gap-1 py-2.5 pb-3.5 ${
              active ? "text-[var(--text)]" : "text-[var(--text-faint)]"
            }`}
          >
            <span className={`text-[18px] leading-none transition-transform ${active ? "scale-110" : ""}`}>
              {tab.icon}
            </span>
            <span className="text-[9.5px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
