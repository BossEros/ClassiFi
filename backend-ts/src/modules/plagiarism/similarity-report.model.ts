import {
  pgTable,
  pgEnum,
  serial,
  integer,
  timestamp,
  numeric,
  jsonb,
  index,
  check,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import { assignments } from "@/modules/assignments/assignment.model.js"
import { users } from "@/modules/users/user.model.js"
import { similarityResults } from "@/modules/plagiarism/similarity-result.model.js"

/** Report type discriminator: intra-assignment vs cross-class analysis */
export const reportTypeEnum = pgEnum("report_type", [
  "assignment",
  "cross-class",
])

/** Similarity reports table - stores similarity analysis reports (both intra-assignment and cross-class) */
export const similarityReports = pgTable(
  "similarity_reports",
  {
    id: serial("id").primaryKey(),
    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    teacherId: integer("teacher_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reportType: reportTypeEnum("report_type").default("assignment").notNull(),
    matchedAssignmentIds: jsonb("matched_assignment_ids").$type<number[]>(),
    totalSubmissions: integer("total_submissions").notNull(),
    totalComparisons: integer("total_comparisons").notNull(),
    flaggedPairs: integer("flagged_pairs").default(0).notNull(),
    averageSimilarity: numeric("average_similarity", {
      precision: 5,
      scale: 4,
    }),
    highestSimilarity: numeric("highest_similarity", {
      precision: 5,
      scale: 4,
    }),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    check(
      "check_average_similarity",
      sql`${table.averageSimilarity} >= 0 AND ${table.averageSimilarity} <= 1`,
    ),
    check(
      "check_highest_similarity",
      sql`${table.highestSimilarity} >= 0 AND ${table.highestSimilarity} <= 1`,
    ),
    check("check_total_submissions", sql`${table.totalSubmissions} >= 0`),
    check("check_total_comparisons", sql`${table.totalComparisons} >= 0`),
    check("check_flagged_pairs", sql`${table.flaggedPairs} >= 0`),
    index("idx_similarity_reports_assignment").on(table.assignmentId),
    index("idx_similarity_reports_teacher").on(table.teacherId),
    index("idx_similarity_reports_date").on(table.generatedAt),
    index("idx_similarity_reports_type").on(table.reportType),
  ],
)

/** Similarity report relations */
export const similarityReportsRelations = relations(
  similarityReports,
  ({ one, many }) => ({
    assignment: one(assignments, {
      fields: [similarityReports.assignmentId],
      references: [assignments.id],
    }),
    teacher: one(users, {
      fields: [similarityReports.teacherId],
      references: [users.id],
    }),
    similarityResults: many(similarityResults),
  }),
)

/** Type definitions for SimilarityReport */
export type SimilarityReport = typeof similarityReports.$inferSelect
export type NewSimilarityReport = typeof similarityReports.$inferInsert
