import { pgTable, serial, integer, varchar, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { notifications, notificationChannelEnum } from "./notification.model";

export const deliveryStatusEnum = pgEnum("delivery_status", [
    "PENDING",
    "SENT",
    "FAILED",
    "RETRYING",
]);

export const notificationDeliveries = pgTable("notification_deliveries", {
    id: serial("id").primaryKey(),
    notificationId: integer("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade"}),
    channel: notificationChannelEnum("channel").notNull(),
    status: deliveryStatusEnum("status").notNull().default("PENDING"),  
    recipientEmail: varchar("recipient_email", { length: 255 }),
    sentAt: timestamp("sent_at"),
    failedAt: timestamp("failed_at"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at"),
});

export const notificationDeliveriesRelations = relations(notificationDeliveries, ({ one }) => ({
    notification: one(notifications, {
        fields: [notificationDeliveries.notificationId],
        references: [notifications.id],
    }),
}));

export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NewNotificationDelivery = typeof notificationDeliveries.$inferInsert;
