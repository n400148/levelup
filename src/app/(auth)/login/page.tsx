"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/weight");
    router.refresh();
  }

  return (
    <div className="relative z-10 w-full max-w-[380px] mx-5 card p-9">
      <div className="text-center mb-7">
        <div className="font-display text-[26px] font-black tracking-[0.15em] text-gradient">LIFTCIPHER</div>
        <div className="text-[10px] tracking-[0.25em] text-[var(--text-faint)] uppercase mt-1 font-bold">
          Decode Your Progress
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <Label>Email</Label>
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Label>Password</Label>
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {error && <p className="text-[var(--danger)] text-[12px] mt-3">{error}</p>}
        <Button type="submit" variant="primary" full className="mt-6" disabled={loading}>
          {loading ? "Signing In…" : "Sign In"}
        </Button>
      </form>
      <p className="text-center text-[12px] text-[var(--text-mute)] mt-5">
        New here?{" "}
        <Link href="/signup" className="text-[var(--accent-2)] font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
