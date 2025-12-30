import { z } from 'zod';
/** Programming language enum */
export const ProgrammingLanguageSchema = z.enum(['python', 'java']);
/** Create assignment request schema */
export const CreateAssignmentRequestSchema = z.object({
    teacherId: z.number().int().positive(),
    assignmentName: z.string().min(1).max(150),
    description: z.string().min(1),
    programmingLanguage: ProgrammingLanguageSchema,
    deadline: z.string().datetime(),
    allowResubmission: z.boolean().default(true),
});
/** Update assignment request schema */
export const UpdateAssignmentRequestSchema = z.object({
    teacherId: z.number().int().positive(),
    assignmentName: z.string().min(1).max(150).optional(),
    description: z.string().min(1).optional(),
    programmingLanguage: ProgrammingLanguageSchema.optional(),
    deadline: z.string().datetime().optional(),
    allowResubmission: z.boolean().optional(),
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
//# sourceMappingURL=assignment.schema.js.map