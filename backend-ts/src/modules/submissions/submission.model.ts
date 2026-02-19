import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core"
import { relations, sql } from "drizzle-orm"
import { assignments } from "@/modules/assignments/assignment.model.js"
import { users } from "@/modules/users/user.model.js"

/** Submissions table - stores student code submissions for assignments */
export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size").notNull(),
    submissionNumber: integer("submission_number").default(1).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    isLatest: boolean("is_latest").default(true).notNull(),
    grade: integer("grade"), // The final grade (auto-calculated or manually overridden)
    isLate: boolean("is_late").default(false).notNull(),
    penaltyApplied: integer("penalty_applied").default(0),

    // Grade Override Tracking
    isGradeOverridden: boolean("is_grade_overridden").default(false).notNull(),
    overrideFeedback: text("override_feedback"), // Teacher's feedback (nullable)
    overriddenAt: timestamp("overridden_at", { withTimezone: true }), // When override occurred
  },
  (table) => [
    unique("uq_assignment_student_submission").on(
      table.assignmentId,
      table.studentId,
      table.submissionNumber,
    ),
    check(
      "check_file_size",
      sql`${table.fileSize} > 0 AND ${table.fileSize} <= 10485760`,
    ),
    check("check_submission_number", sql`${table.submissionNumber} > 0`),
    check(
      "check_override_consistency",
      sql`NOT ${table.isGradeOverridden} OR ${table.overriddenAt} IS NOT NULL`,
    ),
    index("idx_submissions_assignment").on(table.assignmentId),
    index("idx_submissions_student").on(table.studentId),
    index("idx_submissions_date").on(table.submittedAt),
  ],
)

/** Submission relations */
export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [submissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [submissions.studentId],
    references: [users.id],
  }),
}))

/** Type definitions for Submission */
export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert
