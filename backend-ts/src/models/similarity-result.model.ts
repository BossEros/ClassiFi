import {
    pgTable,
    serial,
    integer,
    boolean,
    timestamp,
    numeric,
    jsonb,
    unique,
    index,
    check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { similarityReports } from './similarity-report.model.js';
import { submissions } from './submission.model.js';

/** Similarity results table - stores pairwise similarity comparison results */
export const similarityResults = pgTable('similarity_results', {
    id: serial('id').primaryKey(),
    reportId: integer('report_id').notNull().references(() => similarityReports.id, { onDelete: 'cascade' }),
    submission1Id: integer('submission1_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
    submission2Id: integer('submission2_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
    structuralScore: numeric('structural_score', { precision: 5, scale: 2 }).notNull(),
    semanticScore: numeric('semantic_score', { precision: 5, scale: 2 }).notNull(),
    hybridScore: numeric('hybrid_score', { precision: 5, scale: 2 }).notNull(),
    matchingSegments: jsonb('matching_segments'),
    isFlagged: boolean('is_flagged').default(false).notNull(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    unique('uq_report_submission_pair').on(table.reportId, table.submission1Id, table.submission2Id),
    check('check_different_submissions', sql`${table.submission1Id} != ${table.submission2Id}`),
    check('check_submission_order', sql`${table.submission1Id} < ${table.submission2Id}`),
    check('check_structural_score', sql`${table.structuralScore} >= 0 AND ${table.structuralScore} <= 100`),
    check('check_semantic_score', sql`${table.semanticScore} >= 0 AND ${table.semanticScore} <= 100`),
    check('check_hybrid_score', sql`${table.hybridScore} >= 0 AND ${table.hybridScore} <= 100`),
    index('idx_similarity_results_report').on(table.reportId),
    index('idx_similarity_results_submission1').on(table.submission1Id),
    index('idx_similarity_results_submission2').on(table.submission2Id),
    index('idx_similarity_results_hybrid_score').on(table.hybridScore),
]);

/** Similarity result relations */
export const similarityResultsRelations = relations(similarityResults, ({ one }) => ({
    report: one(similarityReports, {
        fields: [similarityResults.reportId],
        references: [similarityReports.id],
    }),
    submission1: one(submissions, {
        fields: [similarityResults.submission1Id],
        references: [submissions.id],
    }),
    submission2: one(submissions, {
        fields: [similarityResults.submission2Id],
        references: [submissions.id],
    }),
}));

/** Type definitions for SimilarityResult */
export type SimilarityResult = typeof similarityResults.$inferSelect;
export type NewSimilarityResult = typeof similarityResults.$inferInsert;
