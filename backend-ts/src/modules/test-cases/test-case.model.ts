import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { assignments } from "@/modules/assignments/assignment.model.js"
import { testResults } from "@/modules/test-cases/test-result.model.js"

/**
 * Test Cases table - stores teacher-defined test cases for assignments.
 * Each test case has an input (stdin) and expected output (stdout).
 */
export const testCases = pgTable(
  "test_cases",
  {
    id: serial("id").primaryKey(),
    assignmentId: integer("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    input: text("input").notNull().default(""),
    expectedOutput: text("expected_output").notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    timeLimit: integer("time_limit").default(5).notNull(), // seconds (1-10)
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_test_cases_assignment").on(table.assignmentId),
    index("idx_test_cases_sort_order").on(table.assignmentId, table.sortOrder),
  ],
)

/** Test case relations */
export const testCasesRelations = relations(testCases, ({ one, many }) => ({
  assignment: one(assignments, {
    fields: [testCases.assignmentId],
    references: [assignments.id],
  }),
  testResults: many(testResults),
}))

/** Type definitions for TestCase */
export type TestCase = typeof testCases.$inferSelect
export type NewTestCase = typeof testCases.$inferInsert
