import { z } from "zod"

// ============================================================================
// Shared Domain Schemas
// ============================================================================

/** Days of the week enum for class schedules */
export const DayOfWeekEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
])

export type DayOfWeek = z.infer<typeof DayOfWeekEnum>

/**
 * Class schedule schema - validates the schedule structure for class meetings.
 * Matches the ClassSchedule type from models/class.model.ts
 */
export const ClassScheduleSchema = z.object({
  days: z.array(DayOfWeekEnum),
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
})

export type ClassSchedule = z.infer<typeof ClassScheduleSchema>

// ============================================================================
// Common Response Schemas
// ============================================================================

/** Generic success message response - used by many endpoints */
export const SuccessMessageSchema = z.object({
  success: z.literal(true),
  message: z.string(),
})

export type SuccessMessage = z.infer<typeof SuccessMessageSchema>

/** Generic success response with message - used across multiple modules */
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>

// ============================================================================
// Common Query Schemas
// ============================================================================

/**
 * Standard pagination query parameters.
 * Used across admin and other paginated endpoints.
 *
 * @property page - Page number (minimum: 1, default: 1)
 * @property limit - Items per page (minimum: 1, maximum: 100, default: 20)
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

/** Generic limit query schema - used by dashboard endpoints */
export const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type LimitQuery = z.infer<typeof LimitQuerySchema>

/** Latest only query schema - used by submission endpoints */
export const LatestOnlyQuerySchema = z.object({
  latestOnly: z.coerce.boolean().default(true),
})

export type LatestOnlyQuery = z.infer<typeof LatestOnlyQuerySchema>

// ============================================================================
// Common Param Schemas
// ============================================================================

/** User ID query schema */
export const UserIdQuerySchema = z.object({
  userId: z.string(),
})

export type UserIdQuery = z.infer<typeof UserIdQuerySchema>

/** Student ID query schema */
export const StudentIdQuerySchema = z.object({
  studentId: z.string(),
})

export type StudentIdQuery = z.infer<typeof StudentIdQuerySchema>
