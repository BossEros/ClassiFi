import { z } from "zod";

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
]);

export type DayOfWeek = z.infer<typeof DayOfWeekEnum>;

/**
 * Class schedule schema - validates the schedule structure for class meetings.
 * Matches the ClassSchedule type from models/class.model.ts
 */
export const ClassScheduleSchema = z.object({
  days: z.array(DayOfWeekEnum),
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
});

export type ClassSchedule = z.infer<typeof ClassScheduleSchema>;

// ============================================================================
// Common Response Schemas
// ============================================================================

/** Generic success message response - used by many endpoints */
export const SuccessMessageSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export type SuccessMessage = z.infer<typeof SuccessMessageSchema>;

// ============================================================================
// Common Query Schemas
// ============================================================================

/** Generic limit query schema - used by dashboard endpoints */
export const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type LimitQuery = z.infer<typeof LimitQuerySchema>;

/** Latest only query schema - used by submission endpoints */
export const LatestOnlyQuerySchema = z.object({
  latestOnly: z.coerce.boolean().default(true),
});

export type LatestOnlyQuery = z.infer<typeof LatestOnlyQuerySchema>;

// ============================================================================
// Common Param Schemas
// ============================================================================

/** User ID query schema */
export const UserIdQuerySchema = z.object({
  userId: z.string(),
});

export type UserIdQuery = z.infer<typeof UserIdQuerySchema>;

/** Student ID query schema */
export const StudentIdQuerySchema = z.object({
  studentId: z.string(),
});

export type StudentIdQuery = z.infer<typeof StudentIdQuerySchema>;
