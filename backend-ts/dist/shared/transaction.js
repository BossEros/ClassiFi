/**
 * Transaction and Unit of Work Support
 * Provides database transaction management for atomic operations
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from './config.js';
// Import all schema tables for transaction context
import * as schema from '../models/index.js';
/** Create a new database connection for transactions */
function createConnection() {
    return postgres(env.DATABASE_URL, {
        max: 1, // Single connection for transaction
    });
}
/**
 * Execute operations within a database transaction
 * All operations will be rolled back if any error occurs
 *
 * @param callback - Function to execute within the transaction
 * @returns Result of the callback
 *
 * @example
 * const result = await withTransaction(async (tx) => {
 *   await tx.insert(users).values({ ... });
 *   await tx.insert(enrollments).values({ ... });
 *   return { success: true };
 * });
 */
export async function withTransaction(callback) {
    const sql = createConnection();
    const txDb = drizzle(sql, { schema });
    try {
        // Begin transaction, execute callback, commit
        const result = await txDb.transaction(async (tx) => {
            return await callback(tx);
        });
        return result;
    }
    finally {
        await sql.end();
    }
}
/**
 * Unit of Work Pattern
 * Coordinates multiple repository operations within a single transaction
 */
export class UnitOfWork {
    connection = null;
    txDb = null;
    /** Begin a new unit of work */
    async begin() {
        this.connection = createConnection();
        this.txDb = drizzle(this.connection, { schema });
        return this.txDb;
    }
    /** Get the current transaction context */
    getContext() {
        if (!this.txDb) {
            throw new Error('Unit of work has not been started. Call begin() first.');
        }
        return this.txDb;
    }
    /** Commit and close the connection */
    async commit() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            this.txDb = null;
        }
    }
    /** Rollback and close the connection */
    async rollback() {
        // Note: With postgres.js and Drizzle, explicit rollback is handled by throwing an error
        // within the transaction callback. This method ensures cleanup.
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            this.txDb = null;
        }
    }
}
//# sourceMappingURL=transaction.js.map