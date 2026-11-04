import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthState {
  /** False when the Supabase env vars are missing: guest-only mode. */
  configured: boolean;
  /** True until the stored session has been checked on first load. */
  loading: boolean;
  user: User | null;
  username: string | null;
  /** Resolves with `needsConfirmation: true` when the project requires email confirmation. */
  signUp: (email: string, password: string, username: string) => Promise<{ needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
