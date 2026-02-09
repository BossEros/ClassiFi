import type { NotificationType } from "../../api/schemas/notification.schema.js"
import {
  assignmentCreatedEmailTemplate,
  submissionGradedEmailTemplate,
  classAnnouncementEmailTemplate,
  deadlineReminderEmailTemplate,
  enrollmentConfirmedEmailTemplate,
} from "../email/templates.js"

// ============================================================================
// Notification Payload Types (Discriminated Union)
// ============================================================================

/** Payload for ASSIGNMENT_CREATED notification */
export interface AssignmentCreatedPayload {
  assignmentId: number
  assignmentTitle: string
  className: string
  classId: number
  dueDate: string
  assignmentUrl: string
}

/** Payload for SUBMISSION_GRADED notification */
export interface SubmissionGradedPayload {
  submissionId: number
  assignmentId: number
  assignmentTitle: string
  grade: number
  maxGrade: number
  submissionUrl: string
}

/** Payload for CLASS_ANNOUNCEMENT notification */
export interface ClassAnnouncementPayload {
  classId: number
  className: string
  message: string
}

/** Payload for DEADLINE_REMINDER notification */
export interface DeadlineReminderPayload {
  assignmentId: number
  assignmentTitle: string
  dueDate: string
  assignmentUrl: string
}

/** Payload for ENROLLMENT_CONFIRMED notification */
export interface EnrollmentConfirmedPayload {
  classId: number
  className: string
  enrollmentId: number
  instructorName: string
  classUrl: string
}

/**
 * Maps each NotificationType to its specific payload shape.
 * This creates a discriminated union ensuring type safety across the notification system.
 */
export type NotificationDataByType = {
  ASSIGNMENT_CREATED: AssignmentCreatedPayload
  SUBMISSION_GRADED: SubmissionGradedPayload
  CLASS_ANNOUNCEMENT: ClassAnnouncementPayload
  DEADLINE_REMINDER: DeadlineReminderPayload
  ENROLLMENT_CONFIRMED: EnrollmentConfirmedPayload
}

/**
 * Metadata stored with each notification.
 * For rich metadata, we persist the full payload for the notification type.
 */
export type NotificationMetadataByType = NotificationDataByType

/** Supported notification delivery channels */
export type NotificationChannel = "EMAIL" | "IN_APP"

/**
 * Helper type to get the payload for a specific notification type.
 * This ensures that when you use a notification type, you get the correct payload type.
 *
 * @example
 * type AssignmentData = PayloadFor<"ASSIGNMENT_CREATED">; // AssignmentCreatedPayload
 */
export type PayloadFor<T extends NotificationType> = NotificationDataByType[T]

// ============================================================================
// Notification Type Configuration
// ============================================================================

/**
 * Configuration for a notification type.
 * Defines how notifications of this type should be rendered and delivered.
 *
 * @template T - The specific notification type literal
 */
export interface NotificationTypeConfig<T extends NotificationType> {
  /** The notification type identifier (literal type for discrimination) */
  type: T

  /** Template function for generating the notification title */
  titleTemplate: (data: NotificationDataByType[T]) => string

  /** Template function for generating the notification message */
  messageTemplate: (data: NotificationDataByType[T]) => string

  /** Optional template function for generating email HTML content */
  emailTemplate?: (data: NotificationDataByType[T]) => string

  /** Delivery channels for this notification type */
  channels: NotificationChannel[]

  /** Function to extract metadata from the data */
  metadata: (data: NotificationDataByType[T]) => NotificationMetadataByType[T]
}

/**
 * Registry of all notification types.
 * Each type defines how notifications should be created and delivered.
 * The type system ensures that each notification type has the correct payload type.
 */
export const NOTIFICATION_TYPES: {
  [K in NotificationType]: NotificationTypeConfig<K>
} = {
  ASSIGNMENT_CREATED: {
    type: "ASSIGNMENT_CREATED",
    titleTemplate: (data) => `${data.className}: New Assignment Posted`,
    messageTemplate: (data) =>
      `Your teacher has posted a new assignment "${data.assignmentTitle}" in ${data.className}, due on ${data.dueDate}.`,
    emailTemplate: (data) => assignmentCreatedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      className: data.className,
      classId: data.classId,
      dueDate: data.dueDate,
      assignmentUrl: data.assignmentUrl,
    }),
  },

  SUBMISSION_GRADED: {
    type: "SUBMISSION_GRADED",
    titleTemplate: () => "Assignment Graded",
    messageTemplate: (data) =>
      `Your submission for "${data.assignmentTitle}" has been graded. Score: ${data.grade}/${data.maxGrade}`,
    emailTemplate: (data) => submissionGradedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      submissionId: data.submissionId,
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      grade: data.grade,
      maxGrade: data.maxGrade,
      submissionUrl: data.submissionUrl,
    }),
  },

  CLASS_ANNOUNCEMENT: {
    type: "CLASS_ANNOUNCEMENT",
    titleTemplate: (data) => `Announcement: ${data.className}`,
    messageTemplate: (data) => data.message,
    emailTemplate: (data) => classAnnouncementEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      classId: data.classId,
      className: data.className,
      message: data.message,
    }),
  },

  DEADLINE_REMINDER: {
    type: "DEADLINE_REMINDER",
    titleTemplate: () => "Assignment Deadline Reminder",
    messageTemplate: (data) =>
      `Don't forget! "${data.assignmentTitle}" is due on ${data.dueDate}.`,
    emailTemplate: (data) => deadlineReminderEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      assignmentId: data.assignmentId,
      assignmentTitle: data.assignmentTitle,
      dueDate: data.dueDate,
      assignmentUrl: data.assignmentUrl,
    }),
  },

  ENROLLMENT_CONFIRMED: {
    type: "ENROLLMENT_CONFIRMED",
    titleTemplate: (data) => `Enrolled in ${data.className}`,
    messageTemplate: (data) =>
      `You have been successfully enrolled in ${data.className}.`,
    emailTemplate: (data) => enrollmentConfirmedEmailTemplate(data),
    channels: ["EMAIL", "IN_APP"],
    metadata: (data) => ({
      classId: data.classId,
      className: data.className,
      enrollmentId: data.enrollmentId,
      instructorName: data.instructorName,
      classUrl: data.classUrl,
    }),
  },
}
