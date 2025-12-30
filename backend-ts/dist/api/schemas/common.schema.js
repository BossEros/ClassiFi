import { z } from 'zod';
// ============================================================================
// Common Response Schemas
// ============================================================================
/** Generic success message response - used by many endpoints */
export const SuccessMessageSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});
// ============================================================================
// Common Query Schemas
// ============================================================================
/** Generic limit query schema - used by dashboard endpoints */
export const LimitQuerySchema = z.object({
    limit: z.string().optional(),
});
/** Latest only query schema - used by submission endpoints */
export const LatestOnlyQuerySchema = z.object({
    latestOnly: z.string().optional(),
});
// ============================================================================
// Common Param Schemas
// ============================================================================
/** User ID query schema */
export const UserIdQuerySchema = z.object({
    userId: z.string(),
});
/** Student ID query schema */
export const StudentIdQuerySchema = z.object({
    studentId: z.string(),
});
//# sourceMappingURL=common.schema.js.map