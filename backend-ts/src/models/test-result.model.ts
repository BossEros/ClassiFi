import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    numeric,
    timestamp,
    index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { submissions } from '@/models/submission.model.js';
import { testCases } from '@/models/test-case.model.js';

/**
 * Test Results table - stores execution results for each test case per submission.
 * Links submissions to test cases with execution details.
 */
export const testResults = pgTable('test_results', {
    id: serial('id').primaryKey(),
    submissionId: integer('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
    testCaseId: integer('test_case_id').notNull().references(() => testCases.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull(), // 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', etc.
    actualOutput: text('actual_output'),
    executionTime: numeric('execution_time', { precision: 10, scale: 4 }), // seconds
    memoryUsed: integer('memory_used'), // KB
    executorToken: varchar('executor_token', { length: 100 }), // Judge0 submission token
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    index('idx_test_results_submission').on(table.submissionId),
    index('idx_test_results_test_case').on(table.testCaseId),
]);

/** Test result relations */
export const testResultsRelations = relations(testResults, ({ one }) => ({
    submission: one(submissions, {
        fields: [testResults.submissionId],
        references: [submissions.id],
    }),
    testCase: one(testCases, {
        fields: [testResults.testCaseId],
        references: [testCases.id],
    }),
}));

/** Type definitions for TestResult */
export type TestResult = typeof testResults.$inferSelect;
export type NewTestResult = typeof testResults.$inferInsert;
