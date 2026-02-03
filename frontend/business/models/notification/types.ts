/**
 * Metadata for assignment created notification
 */
export interface AssignmentCreatedMetadata {
  assignmentId: number
  assignmentTitle: string
  className: string
  classId: number
  dueDate: string
  assignmentUrl: string
}

/**
 * Metadata for submission graded notification
 */
export interface SubmissionGradedMetadata {
  assignmentId: number
  assignmentTitle: string
  submissionId: number
  grade: number
  totalScore: number
  feedback?: string
  submissionUrl: string
}

/**
 * Metadata for class announcement notification
 */
export interface ClassAnnouncementMetadata {
  classId: number
  className: string
  announcementText: string
}

/**
 * Metadata for deadline reminder notification
 */
export interface DeadlineReminderMetadata {
  assignmentId: number
  assignmentTitle: string
  dueDate: string
  hoursRemaining: number
  assignmentUrl: string
}

/**
 * Metadata for enrollment confirmed notification
 */
export interface EnrollmentConfirmedMetadata {
  classId: number
  className: string
  teacherName: string
  classUrl: string
}

/**
 * Base notification interface with common properties
 */
interface BaseNotification {
  id: number
  userId: number
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

/**
 * Discriminated union of all notification types
 * Each notification type has its own specific metadata structure
 */
export type Notification =
  | (BaseNotification & {
      type: "ASSIGNMENT_CREATED"
      metadata: AssignmentCreatedMetadata
    })
  | (BaseNotification & {
      type: "SUBMISSION_GRADED"
      metadata: SubmissionGradedMetadata
    })
  | (BaseNotification & {
      type: "CLASS_ANNOUNCEMENT"
      metadata: ClassAnnouncementMetadata
    })
  | (BaseNotification & {
      type: "DEADLINE_REMINDER"
      metadata: DeadlineReminderMetadata
    })
  | (BaseNotification & {
      type: "ENROLLMENT_CONFIRMED"
      metadata: EnrollmentConfirmedMetadata
    })

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

/**
 * Extract notification type from discriminated union
 */
export type NotificationType = Notification["type"]

/**
 * Response interface for paginated notification list
 */
export interface NotificationListResponse {
  success: boolean
  notifications: Notification[]
  total: number
  hasMore: boolean
}

/**
 * Response interface for unread notification count
 */
export interface UnreadCountResponse {
  success: boolean
  unreadCount: number
}
