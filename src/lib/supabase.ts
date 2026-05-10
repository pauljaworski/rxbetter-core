import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

function readPublicEnv(nextKey: string, viteKey: string): string | undefined {
  if (typeof process !== "undefined" && process.env?.[nextKey]) {
    return process.env[nextKey];
  }
  try {
    return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[
      viteKey
    ];
  } catch {
    return undefined;
  }
}

const supabaseUrl =
  readPublicEnv("NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL") ?? "";
const supabaseAnonKey =
  readPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY") ??
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase URL/anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Next.js) or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Vite)."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
