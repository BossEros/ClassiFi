import { db } from '../shared/database.js';
import { eq, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { injectable } from 'tsyringe';
import type { TransactionContext } from '../shared/transaction.js';

/**
 * Base repository with common CRUD operations.
 * All repositories should extend this class.
 * Supports dependency injection via tsyringe.
 */
@injectable()
export class BaseRepository<
    TTable extends PgTable,
    TSelect = TTable['$inferSelect'],
    TInsert = TTable['$inferInsert']
> {
    protected db = db;
    protected table: TTable;

    constructor(table: TTable) {
        this.table = table;
    }

    /** Use a specific database context (for transactions) */
    withContext(context: TransactionContext): this {
        const clone = Object.create(Object.getPrototypeOf(this));
        Object.assign(clone, this);
        clone.db = context;
        return clone;
    }

    /** Get all records from the table */
    async findAll(): Promise<TSelect[]> {
        return await this.db.select().from(this.table) as TSelect[];
    }

    /** Find record by ID */
    async findById(id: number): Promise<TSelect | undefined> {
        const idColumn = (this.table as any).id;
        if (!idColumn) {
            throw new Error('Table does not have an id column');
        }

        const results = await this.db
            .select()
            .from(this.table)
            .where(eq(idColumn, id))
            .limit(1);

        return results[0] as TSelect | undefined;
    }

    /** Create a new record */
    async create(data: TInsert): Promise<TSelect> {
        const results = await this.db
            .insert(this.table)
            .values(data as any)
            .returning();

        return results[0] as TSelect;
    }

    /** Update a record by ID */
    async update(id: number, data: Partial<TInsert>): Promise<TSelect | undefined> {
        const idColumn = (this.table as any).id;
        if (!idColumn) {
            throw new Error('Table does not have an id column');
        }

        const results = await this.db
            .update(this.table)
            .set(data as any)
            .where(eq(idColumn, id))
            .returning();

        return results[0] as TSelect | undefined;
    }

    /** Delete a record by ID */
    async delete(id: number): Promise<boolean> {
        const idColumn = (this.table as any).id;
        if (!idColumn) {
            throw new Error('Table does not have an id column');
        }

        const results = await this.db
            .delete(this.table)
            .where(eq(idColumn, id))
            .returning();

        return results.length > 0;
    }

    /** Count all records */
    async count(): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(this.table);

        return Number(result[0]?.count ?? 0);
    }
}
