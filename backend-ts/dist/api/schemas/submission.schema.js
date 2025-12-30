import { z } from 'zod';
/** Submission response schema */
export const SubmissionResponseSchema = z.object({
    id: z.number(),
    assignmentId: z.number(),
    studentId: z.number(),
    fileName: z.string(),
    filePath: z.string(),
    fileSize: z.number(),
    submissionNumber: z.number(),
    submittedAt: z.string(),
    isLatest: z.boolean(),
    studentName: z.string().optional(),
    studentUsername: z.string().optional(),
    assignmentName: z.string().optional(),
});
/** Submit assignment response schema */
export const SubmitAssignmentResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    submission: SubmissionResponseSchema.optional(),
});
/** Submission list response schema */
export const SubmissionListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    submissions: z.array(SubmissionResponseSchema),
});
/** Submission history response schema */
export const SubmissionHistoryResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    submissions: z.array(SubmissionResponseSchema),
    totalSubmissions: z.number(),
});
/** Submission detail response schema */
export const SubmissionDetailResponseSchema = SubmissionResponseSchema.extend({
    assignmentName: z.string().optional(),
    className: z.string().optional(),
});
//# sourceMappingURL=submission.schema.js.map