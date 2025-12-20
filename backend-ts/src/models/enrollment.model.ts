import {
    pgTable,
    serial,
    integer,
    timestamp,
    unique,
    index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.model.js';
import { classes } from './class.model.js';

/** Enrollments table - links students to classes (many-to-many) */
export const enrollments = pgTable('enrollments', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    unique('uq_student_class').on(table.studentId, table.classId),
    index('idx_enrollments_student').on(table.studentId),
    index('idx_enrollments_class').on(table.classId),
]);

/** Enrollment relations */
export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
    student: one(users, {
        fields: [enrollments.studentId],
        references: [users.id],
    }),
    classObj: one(classes, {
        fields: [enrollments.classId],
        references: [classes.id],
    }),
}));

/** Type definitions for Enrollment */
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
