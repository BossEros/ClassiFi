import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { settings } from '@/shared/config.js';
/** PostgreSQL connection client */
const connectionString = settings.databaseUrl;
/** Postgres.js client for queries */
export const sql = postgres(connectionString, {
    max: 10, // Connection pool size
    idle_timeout: 20,
    connect_timeout: 10,
});
/** Drizzle ORM instance */
export const db = drizzle(sql);
/** Close database connection */
export async function closeDatabase() {
    await sql.end();
}
//# sourceMappingURL=database.js.map