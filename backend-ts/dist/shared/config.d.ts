/**
 * Environment Configuration with Zod Validation
 * Validates environment variables at startup
 */
import { z } from 'zod';
import 'dotenv/config';
/** Environment variable schema */
declare const EnvSchema: z.ZodObject<{
    SUPABASE_URL: z.ZodString;
    SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    DATABASE_URL: z.ZodString;
    APP_NAME: z.ZodDefault<z.ZodString>;
    APP_VERSION: z.ZodDefault<z.ZodString>;
    DEBUG: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
    ENVIRONMENT: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    FRONTEND_URL: z.ZodDefault<z.ZodString>;
    ALLOWED_ORIGINS: z.ZodDefault<z.ZodEffects<z.ZodString, string[], string>>;
    API_PREFIX: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    DATABASE_URL: string;
    APP_NAME: string;
    APP_VERSION: string;
    DEBUG: boolean;
    ENVIRONMENT: "development" | "staging" | "production";
    PORT: number;
    FRONTEND_URL: string;
    ALLOWED_ORIGINS: string[];
    API_PREFIX: string;
}, {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    DATABASE_URL: string;
    APP_NAME?: string | undefined;
    APP_VERSION?: string | undefined;
    DEBUG?: string | undefined;
    ENVIRONMENT?: "development" | "staging" | "production" | undefined;
    PORT?: string | undefined;
    FRONTEND_URL?: string | undefined;
    ALLOWED_ORIGINS?: string | undefined;
    API_PREFIX?: string | undefined;
}>;
/** Validated environment type */
export type Env = z.infer<typeof EnvSchema>;
/** Validated environment variables */
export declare const env: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    DATABASE_URL: string;
    APP_NAME: string;
    APP_VERSION: string;
    DEBUG: boolean;
    ENVIRONMENT: "development" | "staging" | "production";
    PORT: number;
    FRONTEND_URL: string;
    ALLOWED_ORIGINS: string[];
    API_PREFIX: string;
};
/** Application settings derived from environment */
export declare const settings: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;
    databaseUrl: string;
    appName: string;
    appVersion: string;
    debug: boolean;
    environment: "development" | "staging" | "production";
    port: number;
    frontendUrl: string;
    allowedOrigins: string[];
    apiPrefix: string;
};
export {};
//# sourceMappingURL=config.d.ts.map