import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type SignUpMetadata = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

/**
 * Email/password sign-up. The DB trigger `handle_new_user` creates
 * `contact` (master record) and `profiles` for the new `auth.users` row.
 * Pass `metadata` so names land in `raw_user_meta_data` for the trigger.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: SignUpMetadata
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata ?? {},
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}
