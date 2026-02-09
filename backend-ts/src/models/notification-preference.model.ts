import {
  pgTable,
  serial,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./user.model.js"
import { notificationTypeEnum } from "./notification.model.js"

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: notificationTypeEnum("notification_type").notNull(),
    emailEnabled: boolean("email_enabled").notNull().default(true),
    inAppEnabled: boolean("in_app_enabled").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    unique("uq_user_notification_type").on(
      table.userId,
      table.notificationType,
    ),
  ],
)

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  }),
)

export type NotificationPreference = typeof notificationPreferences.$inferSelect
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert
