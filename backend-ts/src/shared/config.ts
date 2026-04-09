import { z } from "zod"
import "dotenv/config"
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("ConfigValidation")

const EnvSchema = z
  .object({
    SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
    SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

    // Database
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    // Application
    APP_NAME: z.string().default("ClassiFi"),
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

    // Semantic Similarity Service (GraphCodeBERT sidecar)
    SEMANTIC_SERVICE_URL: z.string().url().default("http://localhost:8002"),
    SEMANTIC_SIMILARITY_MAX_CONCURRENT_REQUESTS: z
      .string()
      .default("2")
      .transform(Number)
      .refine(
        (v) => Number.isInteger(v) && v > 0,
        "SEMANTIC_SIMILARITY_MAX_CONCURRENT_REQUESTS must be a positive integer",
      ),
    SEMANTIC_SIMILARITY_TIMEOUT_MS: z
      .string()
      .default("10000")
      .transform(Number)
      .refine(
        (v) => Number.isInteger(v) && v > 0,
        "SEMANTIC_SIMILARITY_TIMEOUT_MS must be a positive integer",
      ),
    SEMANTIC_SIMILARITY_MAX_RETRIES: z
      .string()
      .default("1")
      .transform(Number)
      .refine(
        (v) => Number.isInteger(v) && v >= 0,
        "SEMANTIC_SIMILARITY_MAX_RETRIES must be an integer >= 0",
      ),
    PLAGIARISM_STRUCTURAL_WEIGHT: z
      .string()
      .default("0.7")
      .transform(Number)
      .refine(
        (v) => Number.isFinite(v) && v >= 0 && v <= 1,
        "PLAGIARISM_STRUCTURAL_WEIGHT must be between 0 and 1",
      ),
    PLAGIARISM_SEMANTIC_WEIGHT: z
      .string()
      .default("0.3")
      .transform(Number)
      .refine(
        (v) => Number.isFinite(v) && v >= 0 && v <= 1,
        "PLAGIARISM_SEMANTIC_WEIGHT must be between 0 and 1",
      ),

    // Test Execution Timeout (in seconds)
    TEST_EXECUTION_TIMEOUT_SECONDS: z
      .string()
      .default("60")
      .transform(Number)
      .refine((v) => v > 0, "TEST_EXECUTION_TIMEOUT_SECONDS must be positive"),
    AUTO_SIMILARITY_ENABLED: z
      .string()
      .default("true")
      .transform((v) => v === "true" || v === "True"),
    AUTO_SIMILARITY_DEBOUNCE_MS: z
      .string()
      .default("45000")
      .transform(Number)
      .refine((v) => v >= 0, "AUTO_SIMILARITY_DEBOUNCE_MS must be >= 0"),
    AUTO_SIMILARITY_RECONCILIATION_INTERVAL_MS: z
      .string()
      .default("180000")
      .transform(Number)
      .refine(
        (v) => v > 0,
        "AUTO_SIMILARITY_RECONCILIATION_INTERVAL_MS must be positive",
      ),
    AUTO_SIMILARITY_MIN_LATEST_SUBMISSIONS: z
      .string()
      .default("2")
      .transform(Number)
      .refine(
        (v) => Number.isInteger(v) && v >= 2,
        "AUTO_SIMILARITY_MIN_LATEST_SUBMISSIONS must be an integer >= 2",
      ),

    // Email Configuration (SendGrid - Primary)
    SENDGRID_API_KEY: z
      .string()
      .min(1, "SENDGRID_API_KEY is required for primary email service"),
    EMAIL_FROM: z.string().email().default("noreply@classifi.app"),
    EMAIL_FROM_NAME: z.string().default("ClassiFi"),

    // Email Configuration (SMTP - Backup/Fallback)
    SMTP_HOST: z
      .string()
      .min(1, "SMTP_HOST is required for backup email service"),
    SMTP_PORT: z
      .string()
      .min(1, "SMTP_PORT is required for backup email service")
      .transform(Number),
    SMTP_USER: z
      .string()
      .min(1, "SMTP_USER is required for backup email service"),
    SMTP_PASSWORD: z
      .string()
      .min(1, "SMTP_PASSWORD is required for backup email service"),
  })
  .superRefine((data, ctx) => {
    const port = data.SMTP_PORT
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SMTP_PORT"],
        message: "SMTP_PORT must be an integer between 1 and 65535",
      })
    }

    const totalPlagiarismWeight =
      data.PLAGIARISM_STRUCTURAL_WEIGHT + data.PLAGIARISM_SEMANTIC_WEIGHT

    if (Math.abs(totalPlagiarismWeight - 1) > 0.000001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PLAGIARISM_STRUCTURAL_WEIGHT"],
        message:
          "PLAGIARISM_STRUCTURAL_WEIGHT and PLAGIARISM_SEMANTIC_WEIGHT must sum to 1",
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PLAGIARISM_SEMANTIC_WEIGHT"],
        message:
          "PLAGIARISM_STRUCTURAL_WEIGHT and PLAGIARISM_SEMANTIC_WEIGHT must sum to 1",
      })
    }
  })

/** Validated environment type */
export type Env = z.infer<typeof EnvSchema>

/** Parse and validate environment variables */
function validateEnv(): Env {
  const result = EnvSchema.safeParse(process.env)

  if (!result.success) {
    logger.error("Invalid environment variables")

    for (const error of result.error.issues) {
      logger.error("Environment variable validation failure", {
        path: error.path.join("."),
        message: error.message,
      })
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

  // Semantic Similarity Service
  semanticServiceUrl: env.SEMANTIC_SERVICE_URL,
  semanticSimilarityMaxConcurrentRequests:
    env.SEMANTIC_SIMILARITY_MAX_CONCURRENT_REQUESTS,
  semanticSimilarityTimeoutMs: env.SEMANTIC_SIMILARITY_TIMEOUT_MS,
  semanticSimilarityMaxRetries: env.SEMANTIC_SIMILARITY_MAX_RETRIES,
  plagiarismStructuralWeight: env.PLAGIARISM_STRUCTURAL_WEIGHT,
  plagiarismSemanticWeight: env.PLAGIARISM_SEMANTIC_WEIGHT,

  // Test Execution
  testExecutionTimeoutSeconds: env.TEST_EXECUTION_TIMEOUT_SECONDS,
  autoSimilarityEnabled: env.AUTO_SIMILARITY_ENABLED,
  autoSimilarityDebounceMs: env.AUTO_SIMILARITY_DEBOUNCE_MS,
  autoSimilarityReconciliationIntervalMs:
    env.AUTO_SIMILARITY_RECONCILIATION_INTERVAL_MS,
  autoSimilarityMinLatestSubmissions:
    env.AUTO_SIMILARITY_MIN_LATEST_SUBMISSIONS,

  // Email (SendGrid - Primary)
  sendgridApiKey: env.SENDGRID_API_KEY,
  emailFrom: env.EMAIL_FROM,
  emailFromName: env.EMAIL_FROM_NAME,

  // Email (SMTP - Backup/Fallback)
  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpUser: env.SMTP_USER,
  smtpPassword: env.SMTP_PASSWORD,
}
