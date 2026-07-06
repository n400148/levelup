"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  WeightIcon,
  TrainIcon,
  NutritionIcon,
  BodyIcon,
  StackIcon,
  GoalsIcon,
  InsightsIcon,
} from "@/components/shell/NavIcons";

const TABS = [
  { href: "/weight", label: "Weight", Icon: WeightIcon },
  { href: "/train", label: "Train", Icon: TrainIcon },
  { href: "/nutrition", label: "Nutrition", Icon: NutritionIcon },
  { href: "/body", label: "Body", Icon: BodyIcon },
  { href: "/stack", label: "Stack", Icon: StackIcon },
  { href: "/goals", label: "Goals", Icon: GoalsIcon },
  { href: "/insights", label: "Insights", Icon: InsightsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex bg-[var(--bg)]/90 backdrop-blur-md border-t border-[var(--border-soft)] z-20 [padding-bottom:env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`tap-scale flex-1 flex flex-col items-center justify-center gap-1 py-2.5 pb-3.5 cursor-pointer ${
              active ? "text-[var(--text)]" : "text-[var(--text-faint)]"
            }`}
          >
            <Icon className={`transition-transform ${active ? "scale-110" : ""}`} />
            <span className="text-[9.5px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
