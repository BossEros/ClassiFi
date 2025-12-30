import { z } from 'zod';

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
    limit: z.string().optional(),
});

export type LimitQuery = z.infer<typeof LimitQuerySchema>;

/** Latest only query schema - used by submission endpoints */
export const LatestOnlyQuerySchema = z.object({
    latestOnly: z.string().optional(),
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
