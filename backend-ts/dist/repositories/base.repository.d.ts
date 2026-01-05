import type { PgTable } from 'drizzle-orm/pg-core';
import type { TransactionContext } from '../shared/transaction.js';
/**
 * Base repository with common CRUD operations.
 * All repositories should extend this class.
 * Supports dependency injection via tsyringe.
 */
export declare class BaseRepository<TTable extends PgTable, TSelect = TTable['$inferSelect'], TInsert = TTable['$inferInsert']> {
    protected db: import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, never>> & {
        $client: import("postgres").Sql<{}>;
    };
    protected table: TTable;
    constructor(table: TTable);
    /** Use a specific database context (for transactions) */
    withContext(context: TransactionContext): this;
    /** Get all records from the table */
    findAll(): Promise<TSelect[]>;
    /** Find record by ID */
    findById(id: number): Promise<TSelect | undefined>;
    /** Create a new record */
    create(data: TInsert): Promise<TSelect>;
    /** Update a record by ID */
    update(id: number, data: Partial<TInsert>): Promise<TSelect | undefined>;
    /** Delete a record by ID */
    delete(id: number): Promise<boolean>;
    /** Count all records */
    count(): Promise<number>;
}
//# sourceMappingURL=base.repository.d.ts.map