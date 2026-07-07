"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const confirmationFailed = searchParams.get("error") === "confirmation_failed";

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
      <div className="text-center mb-8">
        <div className="font-display text-[28px] font-semibold text-gradient">LiftCipher</div>
        <div className="text-[13px] text-[var(--text-mute)] mt-1.5">Decode your progress</div>
      </div>
      {confirmationFailed && (
        <p className="text-[var(--danger)] text-[12px] text-center leading-relaxed mb-5 bg-[rgba(168,73,62,0.1)] border border-[rgba(168,73,62,0.25)] rounded-lg px-3 py-2.5">
          That confirmation link didn&apos;t work or has expired. Try signing up again, or sign in below if you&apos;ve
          already confirmed.
        </p>
      )}
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
