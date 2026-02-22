import { z } from "zod"

// ============================================================================
// Notification Type Enum
// ============================================================================

/** Notification type enum matching database enum */
export const NotificationTypeSchema = z.enum([
  "ASSIGNMENT_CREATED",
  "SUBMISSION_GRADED",
  "CLASS_ANNOUNCEMENT",
  "DEADLINE_REMINDER",
  "ENROLLMENT_CONFIRMED",
])

export type NotificationType = z.infer<typeof NotificationTypeSchema>

// ============================================================================
// Notification Response Schema
// ============================================================================

/** Notification response schema */
export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  isRead: z.boolean(),
  readAt: z.string().nullable().optional(),
  createdAt: z.string(),
})

export type NotificationResponse = z.infer<typeof NotificationSchema>

// ============================================================================
// Param & Query Schemas
// ============================================================================

/** Notification ID param schema */
export const NotificationParamsSchema = z.object({
  id: z.coerce.number().int().min(1),
})

export type NotificationParams = z.infer<typeof NotificationParamsSchema>

/** Notification query parameters schema with pagination */
export const NotificationQueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().optional(),
})

export type NotificationQueryParams = z.infer<
  typeof NotificationQueryParamsSchema
>

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/** DTO for listing notifications with validated and sanitized query parameters */
export class ListNotificationsDto {
  readonly page: number
  readonly limit: number
  readonly unreadOnly?: boolean

  constructor(queryParams: unknown) {
    const validated = NotificationQueryParamsSchema.parse(queryParams)
    this.page = validated.page
    this.limit = validated.limit
    this.unreadOnly = validated.unreadOnly
  }
}
