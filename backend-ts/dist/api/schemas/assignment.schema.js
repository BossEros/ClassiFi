import { z } from 'zod';
/** Programming language enum */
export const ProgrammingLanguageSchema = z.enum(['python', 'java', 'c']);
/** Create assignment request schema */
export const CreateAssignmentRequestSchema = z.object({
    teacherId: z.number().int().min(1),
    assignmentName: z.string().min(1).max(150),
    description: z.string().min(1),
    programmingLanguage: ProgrammingLanguageSchema,
    deadline: z.string().datetime(),
    allowResubmission: z.boolean().default(true),
    maxAttempts: z.number().int().min(1).max(99).nullable().optional(),
});
/** Update assignment request schema */
export const UpdateAssignmentRequestSchema = z.object({
    teacherId: z.number().int().min(1),
    assignmentName: z.string().min(1).max(150).optional(),
    description: z.string().min(1).optional(),
    programmingLanguage: ProgrammingLanguageSchema.optional(),
    deadline: z.string().datetime().optional(),
    allowResubmission: z.boolean().optional(),
    maxAttempts: z.number().int().min(1).max(99).nullable().optional(),
});
/** Assignment response schema */
export const AssignmentResponseSchema = z.object({
    id: z.number(),
    classId: z.number(),
    assignmentName: z.string(),
    description: z.string(),
    programmingLanguage: z.string(),
    deadline: z.string(),
    allowResubmission: z.boolean(),
    maxAttempts: z.number().nullable().optional(),
    createdAt: z.string(),
    isActive: z.boolean(),
    submissionCount: z.number().optional(),
    hasSubmitted: z.boolean().optional(),
});
/** Assignment detail response schema */
export const AssignmentDetailResponseSchema = AssignmentResponseSchema.extend({
    className: z.string().optional(),
    teacherName: z.string().optional(),
});
// ============================================================================
// Param & Query Schemas
// ============================================================================
/** Assignment ID param schema */
export const AssignmentIdParamSchema = z.object({
    assignmentId: z.string(),
});
// ============================================================================
// Response Schemas (for controller routes)
// ============================================================================
/** Get assignment response schema */
export const GetAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentDetailResponseSchema,
});
/** Update assignment response schema */
export const UpdateAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentResponseSchema,
});
/** Assignment list response schema */
export const AssignmentListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignments: z.array(AssignmentResponseSchema),
});
/** Create assignment response schema */
export const CreateAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentResponseSchema,
});
//# sourceMappingURL=assignment.schema.js.map