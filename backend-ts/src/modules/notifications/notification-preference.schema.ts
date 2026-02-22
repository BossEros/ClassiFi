import { z } from "zod"
import { NotificationTypeSchema } from "@/modules/notifications/notification.schema.js"

// ============================================================================
// Notification Preference Response Schema
// ============================================================================

/** Notification preference response schema */
export const NotificationPreferenceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  notificationType: NotificationTypeSchema,
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
})

export type NotificationPreferenceResponse = z.infer<
  typeof NotificationPreferenceSchema
>

// ============================================================================
// Request Schemas
// ============================================================================

/** Update notification preference request schema */
export const UpdateNotificationPreferenceSchema = z.object({
  notificationType: NotificationTypeSchema,
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
})

export type UpdateNotificationPreferenceRequest = z.infer<
  typeof UpdateNotificationPreferenceSchema
>
