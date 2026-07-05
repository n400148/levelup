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
    <header className="px-5 pt-12 pb-4 sticky top-0 z-10 bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="font-display text-[19px] font-semibold text-gradient">LiftCipher</div>
        <button
          onClick={handleSignOut}
          className="tap-scale text-[var(--text-mute)] text-[12.5px] font-medium"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
