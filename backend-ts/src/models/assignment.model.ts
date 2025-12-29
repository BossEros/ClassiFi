import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    boolean,
    timestamp,
    pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { classes } from '@/models/class.model.js';
/** Programming language enum for assignments */
export const programmingLanguageEnum = pgEnum('programming_language', ['python', 'java']);

/** Assignments table - represents assignments for classes */
export const assignments = pgTable('assignments', {
    id: serial('id').primaryKey(),
    classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    assignmentName: varchar('assignment_name', { length: 150 }).notNull(),
    description: text('description').notNull(),
    programmingLanguage: programmingLanguageEnum('programming_language').notNull(),
    deadline: timestamp('deadline', { withTimezone: true }).notNull(),
    allowResubmission: boolean('allow_resubmission').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean('is_active').default(true).notNull(),
});

/** Assignment relations */
export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
    classObj: one(classes, {
        fields: [assignments.classId],
        references: [classes.id],
    }),
    submissions: many(submissions),
    similarityReports: many(similarityReports),
}));

/** Type definitions for Assignment */
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

// Import related tables
import { submissions } from './submission.model.js';
import { similarityReports } from './similarity-report.model.js';
