import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "@/modules/users/user.model.js"
import { assignments } from "@/modules/assignments/assignment.model.js"
import { enrollments } from "@/modules/enrollments/enrollment.model.js"

/** Schedule type for class meetings */
export type ClassSchedule = {
  days: (
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
  )[]
  startTime: string // HH:MM format
  endTime: string // HH:MM format
}

/** Classes table - represents courses taught by teachers */
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  className: varchar("class_name", { length: 100 }).notNull(),
  classCode: varchar("class_code", { length: 20 }).unique().notNull(),
  description: text("description"),
  yearLevel: integer("year_level").notNull(), // 1-4
  semester: integer("semester").notNull(), // 1 or 2
  academicYear: varchar("academic_year", { length: 9 }).notNull(), // e.g., "2024-2025"
  schedule: jsonb("schedule").$type<ClassSchedule>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
})

/** Class relations */
export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  assignments: many(assignments),
  enrollments: many(enrollments),
}))

/** Type definitions for Class */
export type Class = typeof classes.$inferSelect
export type NewClass = typeof classes.$inferInsert
