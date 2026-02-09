import { z } from "zod"
import { NotificationTypeSchema } from "./notification.schema.js"

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

// ============================================================================
// Response Schemas
// ============================================================================

/** Notification preferences list response schema */
export const NotificationPreferencesResponseSchema = z.object({
  success: z.literal(true),
  preferences: z.array(NotificationPreferenceSchema),
})

export type NotificationPreferencesResponse = z.infer<
  typeof NotificationPreferencesResponseSchema
>

/** Single notification preference response schema */
export const NotificationPreferenceResponseSchema = z.object({
  success: z.literal(true),
  preference: NotificationPreferenceSchema,
})

export type SingleNotificationPreferenceResponse = z.infer<
  typeof NotificationPreferenceResponseSchema
>
