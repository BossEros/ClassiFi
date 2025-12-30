var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { db } from '../shared/database.js';
import { eq, sql } from 'drizzle-orm';
import { injectable } from 'tsyringe';
/**
 * Base repository with common CRUD operations.
 * All repositories should extend this class.
 * Supports dependency injection via tsyringe.
 */
let BaseRepository = class BaseRepository {
    db = db;
    table;
    constructor(table) {
        this.table = table;
    }
    /** Use a specific database context (for transactions) */
    withContext(context) {
        const clone = Object.create(Object.getPrototypeOf(this));
        Object.assign(clone, this);
        clone.db = context;
        return clone;
    }
    /** Get all records from the table */
    async findAll() {
        return await this.db.select().from(this.table);
    }
    /** Find record by ID */
    async findById(id) {
        const idColumn = this.table.id;
        if (!idColumn) {
            throw new Error('Table does not have an id column');
        }
        const results = await this.db
            .select()
            .from(this.table)
            .where(eq(idColumn, id))
            .limit(1);
        return results[0];
    }
    /** Create a new record */
    async create(data) {
        const results = await this.db
            .insert(this.table)
            .values(data)
            .returning();
        return results[0];
    }
    /** Update a record by ID */
    async update(id, data) {
        const idColumn = this.table.id;
        if (!idColumn) {
            throw new Error('Table does not have an id column');
        }
        const results = await this.db
            .update(this.table)
            .set(data)
            .where(eq(idColumn, id))
            .returning();
        return results[0];
    }
    /** Delete a record by ID */
    async delete(id) {
        const idColumn = this.table.id;
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
    async count() {
        const result = await this.db
            .select({ count: sql `count(*)` })
            .from(this.table);
        return Number(result[0]?.count ?? 0);
    }
};
BaseRepository = __decorate([
    injectable(),
    __metadata("design:paramtypes", [Object])
], BaseRepository);
export { BaseRepository };
//# sourceMappingURL=base.repository.js.map