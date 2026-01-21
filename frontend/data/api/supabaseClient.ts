import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  );
}

/**
 * Singleton instance of the Supabase client.
 * Configured with auto-refresh, persistent sessions, and PKCE flow.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    flowType: "pkce",
  },
});

/**
 * Type alias for the specific Supabase client used in this application.
 */
export type SupabaseClientType = typeof supabase;
