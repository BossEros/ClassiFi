import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { classes } from "@/models/class.model.js"

/** Programming language enum for assignments */
export const programmingLanguageEnum = pgEnum("programming_language", [
  "python",
  "java",
  "c",
])

/** Late penalty configuration type */
export interface LatePenaltyConfig {
  gracePeriodHours: number // Hours after deadline with no penalty
  tiers: Array<{
    // Penalty tiers
    hoursAfterGrace: number // Hours after grace period ends
    penaltyPercent: number // Percentage to deduct (e.g., 10 = -10%)
  }>
  rejectAfterHours: number | null // Reject submissions after X hours (null = always accept)
}

/** Assignments table - represents assignments for classes */
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  assignmentName: varchar("assignment_name", { length: 150 }).notNull(),
  description: text("description").notNull(),
  programmingLanguage: programmingLanguageEnum(
    "programming_language",
  ).notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  allowResubmission: boolean("allow_resubmission").default(true).notNull(),
  maxAttempts: integer("max_attempts"),
  templateCode: text("template_code"),
  totalScore: integer("total_score").default(100).notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  // Late Penalty Configuration
  latePenaltyEnabled: boolean("late_penalty_enabled").default(false).notNull(),
  latePenaltyConfig: jsonb("late_penalty_config").$type<LatePenaltyConfig>(),
})

/** Assignment relations */
export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  classObj: one(classes, {
    fields: [assignments.classId],
    references: [classes.id],
  }),
  submissions: many(submissions),
  similarityReports: many(similarityReports),
}))

/** Type definitions for Assignment */
export type Assignment = typeof assignments.$inferSelect
export type NewAssignment = typeof assignments.$inferInsert

// Import related tables
import { submissions } from "@/models/submission.model.js"
import { similarityReports } from "@/models/similarity-report.model.js"
