import { createClient } from '@supabase/supabase-js';
import { settings } from '@/shared/config.js';
/** Supabase client for authentication and file storage */
export const supabase = createClient(
    settings.supabaseUrl,
    settings.supabaseServiceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

/** Supabase client with anon key for client-side operations */
export const supabaseAnon = createClient(
    settings.supabaseUrl,
    settings.supabaseAnonKey
);
