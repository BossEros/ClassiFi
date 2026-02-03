/**
 * Notification type enumeration
 * Represents all possible notification types in the system
 */
export type NotificationType =
  | "ASSIGNMENT_CREATED"
  | "SUBMISSION_GRADED"
  | "CLASS_ANNOUNCEMENT"
  | "DEADLINE_REMINDER"
  | "ENROLLMENT_CONFIRMED"

/**
 * Notification interface
 * Represents a single notification in the system
 */
export interface Notification {
  id: number
  userId: number
  type: NotificationType
  title: string
  message: string
  metadata: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

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
  count: number
}
