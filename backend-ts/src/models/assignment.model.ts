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
import { submissions } from "@/models/submission.model.js"
import { similarityReports } from "@/models/similarity-report.model.js"

/** Programming language enum for assignments */
export const programmingLanguageEnum = pgEnum("programming_language", [
  "python",
  "java",
  "c",
])

/** Late penalty configuration type */
export interface LatePenaltyConfig {
  tiers: Array<{
    // Penalty tiers
    hoursLate: number // Maximum hours late covered by this tier
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
  descriptionImageUrl: text("description_image_url"),
  descriptionImageAlt: varchar("description_image_alt", { length: 255 }),
  programmingLanguage: programmingLanguageEnum(
    "programming_language",
  ).notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
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

  // Reminder tracking
  lastReminderSentAt: timestamp("last_reminder_sent_at", {
    withTimezone: true,
  }),
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
