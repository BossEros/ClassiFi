import postgres from 'postgres';
/** Postgres.js client for queries */
export declare const sql: postgres.Sql<{}>;
/** Drizzle ORM instance */
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, never>> & {
    $client: postgres.Sql<{}>;
};
/** Close database connection */
export declare function closeDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map