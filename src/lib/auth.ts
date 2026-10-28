import { supabase, supabaseConfigured } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";

export type AuthStatus = "loading" | "signedIn" | "signedOut";

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
}

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured || !supabase) {
    return { ok: false, error: "not-configured" };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getInitialSession(): Promise<AuthState> {
  if (!supabaseConfigured || !supabase) {
    return { status: "signedOut", user: null, session: null };
  }
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    return { status: "signedIn", user: data.session.user, session: data.session };
  }
  return { status: "signedOut", user: null, session: null };
}

export async function signOut(): Promise<void> {
  if (!supabaseConfigured || !supabase) return;
  await supabase.auth.signOut();
}
