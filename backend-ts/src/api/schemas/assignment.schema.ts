import { z } from 'zod';

/** Programming language enum */
export const ProgrammingLanguageSchema = z.enum(['python', 'java', 'c']);
export type ProgrammingLanguage = z.infer<typeof ProgrammingLanguageSchema>;

/** Create assignment request schema */
export const CreateAssignmentRequestSchema = z.object({
    teacherId: z.number().int().min(1),
    assignmentName: z.string().min(1).max(150),
    description: z.string().min(1),
    programmingLanguage: ProgrammingLanguageSchema,
    deadline: z.string().datetime(),
    allowResubmission: z.boolean().default(true),
    maxAttempts: z.number().int().min(1).max(99).nullable().optional(),
    templateCode: z.string().max(50000).nullable().optional(),
});

export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;

/** Update assignment request schema */
export const UpdateAssignmentRequestSchema = z.object({
    teacherId: z.number().int().min(1),
    assignmentName: z.string().min(1).max(150).optional(),
    description: z.string().min(1).optional(),
    programmingLanguage: ProgrammingLanguageSchema.optional(),
    deadline: z.string().datetime().optional(),
    allowResubmission: z.boolean().optional(),
    maxAttempts: z.number().int().min(1).max(99).nullable().optional(),
    templateCode: z.string().max(50000).nullable().optional(),
});

export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;

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
    templateCode: z.string().nullable().optional(),
    hasTemplateCode: z.boolean().optional(),
    submissionCount: z.number().optional(),
    hasSubmitted: z.boolean().optional(),
});

export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>;

/** Assignment detail response schema */
export const AssignmentDetailResponseSchema = AssignmentResponseSchema.extend({
    className: z.string().optional(),
    teacherName: z.string().optional(),
});

export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;

// ============================================================================
// Param & Query Schemas
// ============================================================================

/** Assignment ID param schema */
export const AssignmentIdParamSchema = z.object({
    assignmentId: z.string(),
});

export type AssignmentIdParam = z.infer<typeof AssignmentIdParamSchema>;

// ============================================================================
// Response Schemas (for controller routes)
// ============================================================================

/** Get assignment response schema */
export const GetAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentDetailResponseSchema,
});

export type GetAssignmentResponse = z.infer<typeof GetAssignmentResponseSchema>;

/** Update assignment response schema */
export const UpdateAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentResponseSchema,
});

export type UpdateAssignmentResponse = z.infer<typeof UpdateAssignmentResponseSchema>;

/** Assignment list response schema */
export const AssignmentListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignments: z.array(AssignmentResponseSchema),
});

export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;

/** Create assignment response schema */
export const CreateAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentResponseSchema,
});

export type CreateAssignmentResponse = z.infer<typeof CreateAssignmentResponseSchema>;
