import { pgTable, serial, integer, varchar, text, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./user.model.js";

export const notificationTypeEnum = pgEnum("notification_type", [
    "ASSIGNMENT_CREATED",
    "SUBMISSION_GRADED",
    "CLASS_ANNOUNCEMENT",
    "DEADLINE_REMINDER",
    "ENROLLMENT_CONFIRMED",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
    "EMAIL",
    "IN_APP",
]);

export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;