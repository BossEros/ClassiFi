import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { settings } from "@/shared/config.js"
/** PostgreSQL connection client */
const connectionString = settings.databaseUrl

/** Postgres.js client for queries */
export const sql = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 60, // Increased to 60s to handle cold starts
  prepare: false, // Required for Supabase Transaction Pooler (port 6543)
})

/** Drizzle ORM instance */
export const db = drizzle(sql)

/** Close database connection */
export async function closeDatabase(): Promise<void> {
  await sql.end()
}
