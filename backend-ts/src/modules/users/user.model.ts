import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { classes } from "@/modules/classes/class.model.js"
import { enrollments } from "@/models/enrollment.model.js"
import { submissions } from "@/modules/submissions/submission.model.js"

/** User role enum matching PostgreSQL type */
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin"])

/** Users table - stores user account information */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseUserId: uuid("supabase_user_id").unique(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  role: userRoleEnum("role").notNull(),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

/** User relations */
export const usersRelations = relations(users, ({ many }) => ({
  classes: many(classes),
  enrollments: many(enrollments),
  submissions: many(submissions),
}))

/** Type definitions for User */
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
