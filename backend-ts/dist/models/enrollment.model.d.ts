/** Enrollments table - links students to classes (many-to-many) */
export declare const enrollments: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "enrollments";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "enrollments";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        studentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "student_id";
            tableName: "enrollments";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        classId: import("drizzle-orm/pg-core").PgColumn<{
            name: "class_id";
            tableName: "enrollments";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        enrolledAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "enrolled_at";
            tableName: "enrollments";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
/** Enrollment relations */
export declare const enrollmentsRelations: import("drizzle-orm").Relations<"enrollments", {
    student: import("drizzle-orm").One<"users", true>;
    classObj: import("drizzle-orm").One<"classes", true>;
}>;
/** Type definitions for Enrollment */
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
//# sourceMappingURL=enrollment.model.d.ts.map