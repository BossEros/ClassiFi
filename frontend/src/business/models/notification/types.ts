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
  maxGrade: number
  submissionUrl: string
}

export interface ClassAnnouncementMetadata {
  classId: number
  className: string
  message: string
}

export interface DeadlineReminderMetadata {
  assignmentId: number
  assignmentTitle: string
  dueDate: string
  assignmentUrl: string
}

export interface EnrollmentConfirmedMetadata {
  classId: number
  className: string
  enrollmentId: number
  instructorName: string
  classUrl: string
}

interface BaseNotification {
  id: number
  userId: number
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

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

export function isNotificationType<T extends Notification["type"]>(
  notification: Notification,
  type: T,
): notification is Extract<Notification, { type: T }> {
  return notification.type === type
}

export type NotificationType = Notification["type"]

export interface NotificationListResponse {
  success: boolean
  notifications: Notification[]
  total: number
  hasMore: boolean
}

export interface UnreadCountResponse {
  success: boolean
  unreadCount: number
}
