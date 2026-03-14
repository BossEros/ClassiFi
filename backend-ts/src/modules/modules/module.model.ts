import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { classes } from "@/modules/classes/class.model.js"
import { assignments } from "@/modules/assignments/assignment.model.js"

/** Modules table - represents grouping containers for assignments within a class */
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

/** Module relations */
export const modulesRelations = relations(modules, ({ one, many }) => ({
  classObj: one(classes, {
    fields: [modules.classId],
    references: [classes.id],
  }),
  assignments: many(assignments),
}))

/** Type definitions for Module */
export type Module = typeof modules.$inferSelect
export type NewModule = typeof modules.$inferInsert
