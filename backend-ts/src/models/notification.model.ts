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
import { users } from "./user.model.js"

export const notificationTypeEnum = pgEnum("notification_type", [
  "ASSIGNMENT_CREATED",
  "SUBMISSION_GRADED",
  "CLASS_ANNOUNCEMENT",
  "DEADLINE_REMINDER",
  "ENROLLMENT_CONFIRMED",
])

export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL",
  "IN_APP",
])

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

/**
 * Metadata type definitions for each notification type
 */
export interface AssignmentCreatedMetadata {
  assignmentId: number
  assignmentTitle: string
  className: string
  classId: number
  dueDate: string
  assignmentUrl: string
}

export interface SubmissionGradedMetadata {
  assignmentId: number
  assignmentTitle: string
  submissionId: number
  grade: number
  totalScore: number
  feedback?: string
  submissionUrl: string
}

export interface ClassAnnouncementMetadata {
  classId: number
  className: string
  announcementText: string
}

export interface DeadlineReminderMetadata {
  assignmentId: number
  assignmentTitle: string
  dueDate: string
  hoursRemaining: number
  assignmentUrl: string
}

export interface EnrollmentConfirmedMetadata {
  classId: number
  className: string
  teacherName: string
  classUrl: string
}

/**
 * Base notification type from database
 */
type BaseNotification = typeof notifications.$inferSelect

/**
 * Discriminated union of all notification types with specific metadata
 */
export type Notification =
  | (Omit<BaseNotification, "metadata"> & {
    type: "ASSIGNMENT_CREATED"
    metadata: AssignmentCreatedMetadata
  })
  | (Omit<BaseNotification, "metadata"> & {
    type: "SUBMISSION_GRADED"
    metadata: SubmissionGradedMetadata
  })
  | (Omit<BaseNotification, "metadata"> & {
    type: "CLASS_ANNOUNCEMENT"
    metadata: ClassAnnouncementMetadata
  })
  | (Omit<BaseNotification, "metadata"> & {
    type: "DEADLINE_REMINDER"
    metadata: DeadlineReminderMetadata
  })
  | (Omit<BaseNotification, "metadata"> & {
    type: "ENROLLMENT_CONFIRMED"
    metadata: EnrollmentConfirmedMetadata
  })

/**
 * Type for creating new notifications with specific metadata
 */
export type NewNotification =
  | {
    userId: number
    type: "ASSIGNMENT_CREATED"
    title: string
    message: string
    metadata: AssignmentCreatedMetadata
  }
  | {
    userId: number
    type: "SUBMISSION_GRADED"
    title: string
    message: string
    metadata: SubmissionGradedMetadata
  }
  | {
    userId: number
    type: "CLASS_ANNOUNCEMENT"
    title: string
    message: string
    metadata: ClassAnnouncementMetadata
  }
  | {
    userId: number
    type: "DEADLINE_REMINDER"
    title: string
    message: string
    metadata: DeadlineReminderMetadata
  }
  | {
    userId: number
    type: "ENROLLMENT_CONFIRMED"
    title: string
    message: string
    metadata: EnrollmentConfirmedMetadata
  }

/**
 * Type guard to check if a Notification matches a specific type and narrow its type.
 *
 * @param notification - The Notification to check.
 * @param type - The Notification["type"] value to match.
 * @returns True when notification is of the narrowed type Extract<Notification, { type: T }>, enabling TypeScript to narrow the Notification type to the specific variant.
 */
export function isNotificationType<T extends Notification["type"]>(
  notification: Notification,
  type: T,
): notification is Extract<Notification, { type: T }> {
  return notification.type === type
}
