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
import { classes } from "@/modules/classes/class.model.js"
import { modules } from "@/modules/modules/module.model.js"
import { submissions } from "@/modules/submissions/submission.model.js"
import { similarityReports } from "@/modules/plagiarism/similarity-report.model.js"

export const programmingLanguageEnum = pgEnum("programming_language", [
  "python",
  "java",
  "c",
])

export interface LatePenaltyConfig {
  tiers: Array<{
    hoursLate: number 
    penaltyPercent: number
  }>
  rejectAfterHours: number | null
}

/** Assignments table - represents assignments for classes */
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").references(() => modules.id, {
      onDelete: "cascade",
    }),
  assignmentName: varchar("assignment_name", { length: 150 }).notNull(),
  instructions: text("instructions").notNull(),
  instructionsImageUrl: text("instructions_image_url"),
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
  allowLateSubmissions: boolean("allow_late_submissions")
    .default(false)
    .notNull(),
  latePenaltyConfig: jsonb("late_penalty_config").$type<LatePenaltyConfig>(),
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
  module: one(modules, {
    fields: [assignments.moduleId],
    references: [modules.id],
  }),
  submissions: many(submissions),
  similarityReports: many(similarityReports),
}))

/** Type definitions for Assignment */
export type Assignment = typeof assignments.$inferSelect
export type NewAssignment = typeof assignments.$inferInsert
