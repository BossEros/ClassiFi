import type { ClassRepository } from "@/modules/classes/class.repository.js"
import type { Class, Notification } from "@/models/index.js"
import type { NotificationType } from "@/modules/notifications/notification.schema.js"
import type { NotificationDataByType } from "@/modules/notifications/notification.types.js"
import { ClassNotFoundError, NotClassOwnerError } from "@/shared/errors.js"

// ============================================================================
// Notification Type Guards
// ============================================================================

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
 *
 * @example
 * ```typescript
 * if (isNotificationType(notification, "ASSIGNMENT_CREATED")) {
 *   // notification.metadata is now AssignmentCreatedPayload
 *   console.log(notification.metadata.assignmentTitle)
 * }
 * ```
 */
export function isNotificationType<T extends NotificationType>(
  notification: Notification,
  type: T,
): notification is TypedNotification<T> {
  return notification.type === type
}

/**
 * Require a class to exist.
 * @throws {ClassNotFoundError} If class doesn't exist
 */
export async function requireClass(
  classRepo: ClassRepository,
  classId: number,
): Promise<Class> {
  const classData = await classRepo.getClassById(classId)
  if (!classData) {
    throw new ClassNotFoundError(classId)
  }
  return classData
}

/**
 * Require a class to exist and be owned by the teacher.
 * @throws {ClassNotFoundError} If class doesn't exist
 * @throws {NotClassOwnerError} If teacher doesn't own the class
 */
export async function requireClassOwnership(
  classRepo: ClassRepository,
  classId: number,
  teacherId: number,
): Promise<Class> {
  const classData = await requireClass(classRepo, classId)

  if (classData.teacherId !== teacherId) {
    throw new NotClassOwnerError()
  }

  return classData
}

