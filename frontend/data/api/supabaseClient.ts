import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
  )
}

/**
 * SSR-safe storage adapter for Supabase auth.
 * Implements the required storage interface for PKCE flow.
 * In non-browser environments (SSR), provides no-op implementations.
 */
const createStorageAdapter = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  return {
    getItem: (key: string): string | null => {
      if (!isBrowser) return null
      return window.localStorage.getItem(key)
    },
    setItem: (key: string, value: string): void => {
      if (!isBrowser) return
      window.localStorage.setItem(key, value)
    },
    removeItem: (key: string): void => {
      if (!isBrowser) return
      window.localStorage.removeItem(key)
    },
  }
}

/**
 * Singleton instance of the Supabase client.
 * Configured with auto-refresh, persistent sessions, and PKCE flow.
 * Uses a custom storage adapter for SSR compatibility.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: createStorageAdapter(),
    flowType: "pkce",
  },
})

/**
 * Type alias for the specific Supabase client used in this application.
 */
export type SupabaseClientType = typeof supabase
