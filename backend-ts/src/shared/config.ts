import { z } from "zod"
import "dotenv/config"

/** Environment variable schema */
const EnvSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Application
  APP_NAME: z.string().default("ClassiFi API"),
  APP_VERSION: z.string().default("1.0.0"),
  DEBUG: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "True"),
  ENVIRONMENT: z
    .enum(["development", "staging", "production"])
    .default("development"),
  PORT: z.string().default("8001").transform(Number),

  // CORS
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((v) => v.split(",")),

  // API
  API_PREFIX: z.string().default("/api"),

  // Judge0 (Code Execution)
  JUDGE0_URL: z.string().url().default("http://localhost:2358"),

  // Test Execution Timeout (in seconds)
  TEST_EXECUTION_TIMEOUT_SECONDS: z
    .string()
    .default("60")
    .transform(Number)
    .refine((v) => v > 0, "TEST_EXECUTION_TIMEOUT_SECONDS must be positive"),

  // Email Configuration (SendGrid - Primary)
  SENDGRID_API_KEY: z.string().min(1, "SENDGRID_API_KEY is required"),
  EMAIL_FROM: z.string().email().default("noreply@classifi.app"),
  EMAIL_FROM_NAME: z.string().default("ClassiFi"),

  // Email Configuration (Gmail SMTP - Backup)
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().default("587").transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
})

/** Validated environment type */
export type Env = z.infer<typeof EnvSchema>

/** Parse and validate environment variables */
function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env)

  if (!result.success) {
    console.error("❌ Invalid environment variables:")
    for (const error of result.error.issues) {
      console.error(`   - ${error.path.join(".")}: ${error.message}`)
    }
    process.exit(1)
  }

  return result.data
}

/** Validated environment variables */
export const env = validateEnv()

/** Application settings derived from environment */
export const settings = {
  // Supabase
  supabaseUrl: env.SUPABASE_URL,
  supabaseAnonKey: env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,

  // Database
  databaseUrl: env.DATABASE_URL,

  // Application
  appName: env.APP_NAME,
  appVersion: env.APP_VERSION,
  debug: env.DEBUG,
  environment: env.ENVIRONMENT,
  port: env.PORT,

  // CORS
  frontendUrl: env.FRONTEND_URL,
  allowedOrigins: env.ALLOWED_ORIGINS,

  // API
  apiPrefix: env.API_PREFIX,

  // Judge0 (Code Execution)
  judge0Url: env.JUDGE0_URL,

  // Test Execution
  testExecutionTimeoutSeconds: env.TEST_EXECUTION_TIMEOUT_SECONDS,

  // Email (SendGrid - Primary)
  sendgridApiKey: env.SENDGRID_API_KEY,
  emailFrom: env.EMAIL_FROM,
  emailFromName: env.EMAIL_FROM_NAME,

  // Email (Gmail SMTP - Backup)
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpUser: env.SMTP_USER,
  smtpPassword: env.SMTP_PASSWORD,
}
