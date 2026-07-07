"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acknowledged) return;
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.replace("/weight");
      router.refresh();
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="relative z-10 w-full max-w-[380px] mx-5 card p-9 text-center">
        <div className="font-display text-[20px] font-semibold text-gradient mb-3">Check your email</div>
        <p className="text-[13px] text-[var(--text-dim)] leading-relaxed">
          Confirm your account via the link we sent to <b className="text-[var(--text)]">{email}</b>, then sign in.
        </p>
        <Link href="/login">
          <Button variant="secondary" full className="mt-6">
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-[380px] mx-5 card p-9">
      <div className="text-center mb-8">
        <div className="font-display text-[28px] font-semibold text-gradient">LiftCipher</div>
        <div className="text-[13px] text-[var(--text-mute)] mt-1.5">Decode your progress</div>
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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            required
            className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-[11.5px] text-[var(--text-mute)] leading-relaxed">
            I understand LiftCipher is a personal tracking tool. Nothing in this app — including training,
            nutrition, body-composition, or peptide/supplement information — is medical, dietary, or professional
            advice. I&apos;ll consult a licensed physician or healthcare provider before making health decisions or
            using any substance logged here.
          </span>
        </label>
        {error && <p className="text-[var(--danger)] text-[12px] mt-3">{error}</p>}
        <Button type="submit" variant="primary" full className="mt-5" disabled={loading || !acknowledged}>
          {loading ? "Creating Account…" : "Create Account"}
        </Button>
      </form>
      <p className="text-center text-[12px] text-[var(--text-mute)] mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent-2)] font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
