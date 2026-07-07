"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="px-5 pt-12 pb-4 sticky top-0 z-10 bg-[var(--bg)]/85 backdrop-blur-md border-b border-[var(--border-soft)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-2)] shadow-[0_0_6px_1px_rgba(155,140,255,0.6)]" />
          <div className="font-display text-[18px] font-semibold text-gradient tracking-tight">LiftCipher</div>
        </div>
        <button
          onClick={handleSignOut}
          className="tap-scale text-[var(--text-faint)] text-[11px] font-semibold uppercase tracking-wide"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
