import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { authConfigured, supabase } from "../lib/supabase";
import { AuthContext, type AuthState } from "./context";
import { normalizeUsername } from "./validation";

/** Turns Supabase's raw messages into something a person can act on. */
function friendlyError(message: string): Error {
  if (/invalid login credentials/i.test(message)) return new Error("Wrong email or password.");
  if (/email not confirmed/i.test(message)) return new Error("Confirm your email first: check your inbox for the link.");
  if (/already registered|already been registered/i.test(message)) return new Error("That email already has an account. Try logging in.");
  if (/rate limit/i.test(message)) return new Error("Too many attempts. Wait a minute and try again.");
  return new Error(message);
}

/** Owns the signed-in user for the whole app and exposes sign-up, login and logout. */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authConfigured);
  const [profile, setProfile] = useState<{ userId: string; username: string } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setProfile({ userId, username: data.username as string });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signUp = useCallback<AuthState["signUp"]>(async (email, password, rawUsername) => {
    if (!supabase) throw new Error("Accounts are not set up on this site yet.");
    const username = normalizeUsername(rawUsername);
    const { data: free, error: checkError } = await supabase.rpc("username_available", { name: username });
    if (checkError) throw friendlyError(checkError.message);
    if (!free) throw new Error("That username is taken.");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username } },
    });
    if (error) throw friendlyError(error.message);
    return { needsConfirmation: data.session === null };
  }, []);

  const signIn = useCallback<AuthState["signIn"]>(async (email, password) => {
    if (!supabase) throw new Error("Accounts are not set up on this site yet.");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw friendlyError(error.message);
  }, []);

  const signOut = useCallback<AuthState["signOut"]>(async () => {
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      configured: authConfigured,
      loading,
      user: session?.user ?? null,
      username: profile && profile.userId === userId ? profile.username : null,
      signUp,
      signIn,
      signOut,
    }),
    [loading, session, profile, userId, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
