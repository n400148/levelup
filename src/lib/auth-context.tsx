"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Only .id is ever read off this anywhere in the app, so there's no need to
// carry the full Supabase User shape here.
interface AuthUser {
  id: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getClaims() verifies the JWT locally against the project's cached
    // JWKS instead of round-tripping to the Auth server like getUser()
    // does — same guarantee, far less latency added to every page load
    // (the same tradeoff already made for the server-side middleware).
    supabase.auth.getClaims().then(({ data }) => {
      setUser(data?.claims ? { id: data.claims.sub } : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id } : null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
