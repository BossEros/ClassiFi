import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../models/index.js';
/** Transaction context type */
export type TransactionContext = PostgresJsDatabase<typeof schema>;
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
export declare function withTransaction<T>(callback: (tx: TransactionContext) => Promise<T>): Promise<T>;
/**
 * Unit of Work Pattern
 * Coordinates multiple repository operations within a single transaction
 */
export declare class UnitOfWork {
    private connection;
    private txDb;
    /** Begin a new unit of work */
    begin(): Promise<TransactionContext>;
    /** Get the current transaction context */
    getContext(): TransactionContext;
    /** Commit and close the connection */
    commit(): Promise<void>;
    /** Rollback and close the connection */
    rollback(): Promise<void>;
}
//# sourceMappingURL=transaction.d.ts.map