/**
 * Notification preference model types
 */

export type NotificationType =
    | "ASSIGNMENT_CREATED"
    | "SUBMISSION_GRADED"
    | "CLASS_ANNOUNCEMENT"
    | "DEADLINE_REMINDER"
    | "ENROLLMENT_CONFIRMED"

export interface NotificationPreference {
    id: number
    userId: number
    notificationType: NotificationType
    emailEnabled: boolean
    inAppEnabled: boolean
    createdAt: string
    updatedAt: string | null
}

export interface UpdateNotificationPreferenceRequest {
    notificationType: NotificationType
    emailEnabled: boolean
    inAppEnabled: boolean
}
