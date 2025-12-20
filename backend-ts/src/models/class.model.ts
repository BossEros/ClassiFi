import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    boolean,
    timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.model.js';

/** Classes table - represents courses taught by teachers */
export const classes = pgTable('classes', {
    id: serial('id').primaryKey(),
    teacherId: integer('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    className: varchar('class_name', { length: 100 }).notNull(),
    classCode: varchar('class_code', { length: 20 }).unique().notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
});

/** Class relations */
export const classesRelations = relations(classes, ({ one, many }) => ({
    teacher: one(users, {
        fields: [classes.teacherId],
        references: [users.id],
    }),
    assignments: many(assignments),
    enrollments: many(enrollments),
}));

/** Type definitions for Class */
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;

// Import related tables
import { assignments } from './assignment.model.js';
import { enrollments } from './enrollment.model.js';
