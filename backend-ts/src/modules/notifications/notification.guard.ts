import type { Notification } from "@/models/index.js"
import type { NotificationType } from "@/modules/notifications/notification.schema.js"
import type { NotificationDataByType } from "@/modules/notifications/notification.types.js"

/**
 * A typed notification with specific metadata based on its type.
 * Extends the base Notification with discriminated union for type-safe metadata access.
 */
export type TypedNotification<T extends NotificationType = NotificationType> =
  Omit<Notification, "type" | "metadata"> & {
    type: T
    metadata: NotificationDataByType[T]
  }

/**
 * Type guard to check if a Notification matches a specific type and narrow its type.
 *
 * @param notification - The Notification to check.
 * @param type - The NotificationType value to match.
 * @returns True when notification is of the narrowed TypedNotification<T>, enabling TypeScript to narrow the type.
 */
export function isNotificationType<T extends NotificationType>(
  notification: Notification,
  type: T,
): notification is TypedNotification<T> {
  return notification.type === type
}
