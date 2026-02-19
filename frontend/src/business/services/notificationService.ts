import { notificationRepository } from "@/data/repositories/notificationRepository"
import type {
  NotificationListResponse,
  NotificationType,
} from "@/business/models/notification/types"

/**
 * Fetches notifications with pagination.
 *
 * @param page - Page number (1-indexed)
 * @param limit - Number of notifications per page
 * @returns Paginated notifications
 */
export async function getNotifications(
  page: number = 1,
  limit: number = 20,
): Promise<NotificationListResponse> {
  const response = await notificationRepository.getNotifications(page, limit)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch notifications")
  }

  return response.data
}

/**
 * Gets the count of unread notifications.
 *
 * @returns Unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await notificationRepository.getUnreadCount()

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch unread count")
  }

  return response.data.unreadCount
}

/**
 * Marks a notification as read.
 *
 * @param notificationId - The ID of the notification to mark as read
 */
export async function markAsRead(notificationId: number): Promise<void> {
  const response = await notificationRepository.markAsRead(notificationId)

  if (response.error) {
    throw new Error(response.error)
  }
}

/**
 * Marks all notifications as read.
 */
export async function markAllAsRead(): Promise<void> {
  const response = await notificationRepository.markAllAsRead()

  if (response.error) {
    throw new Error(response.error)
  }
}

/**
 * Deletes a notification.
 *
 * @param notificationId - The ID of the notification to delete
 */
export async function deleteNotification(
  notificationId: number,
): Promise<void> {
  const response =
    await notificationRepository.deleteNotification(notificationId)

  if (response.error) {
    throw new Error(response.error)
  }
}

/**
 * Formats notification time for display (e.g., "5m ago", "2h ago", "3d ago").
 *
 * @param createdAt - ISO date string
 * @returns Formatted time string
 */
export function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

/**
 * Gets the icon name for a notification type.
 * Returns lucide-react icon names.
 *
 * @param type - Notification type
 * @returns Icon name from lucide-react
 */
export function getNotificationIcon(type: NotificationType): string {
  const iconMap: Record<NotificationType, string> = {
    ASSIGNMENT_CREATED: "FileText",
    SUBMISSION_GRADED: "CheckCircle",
    CLASS_ANNOUNCEMENT: "Megaphone",
    DEADLINE_REMINDER: "Clock",
    ENROLLMENT_CONFIRMED: "UserPlus",
  }

  return iconMap[type] || "Bell"
}
