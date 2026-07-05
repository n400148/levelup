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
    <header className="px-4.5 pt-11 pb-3 sticky top-0 z-10 bg-black/93 border-b border-[var(--border)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-[24px] font-black tracking-[0.15em] text-gradient">LIFTCIPHER</div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-[9px] text-[var(--success)] tracking-wide uppercase font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_#00e5a0] animate-blink" />
            Live
          </span>
          <button
            onClick={handleSignOut}
            className="tap-scale bg-[rgba(255,61,107,0.1)] border border-[rgba(255,61,107,0.2)] text-[var(--danger)] rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
