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

export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;

/** Submit assignment response schema */
export const SubmitAssignmentResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    submission: SubmissionResponseSchema.optional(),
});

export type SubmitAssignmentResponse = z.infer<typeof SubmitAssignmentResponseSchema>;

/** Submission list response schema */
export const SubmissionListResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    submissions: z.array(SubmissionResponseSchema),
});

export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;

/** Submission history response schema */
export const SubmissionHistoryResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    submissions: z.array(SubmissionResponseSchema),
    totalSubmissions: z.number(),
});

export type SubmissionHistoryResponse = z.infer<typeof SubmissionHistoryResponseSchema>;

/** Submission detail response schema */
export const SubmissionDetailResponseSchema = SubmissionResponseSchema.extend({
    assignmentName: z.string().optional(),
    className: z.string().optional(),
});

export type SubmissionDetailResponse = z.infer<typeof SubmissionDetailResponseSchema>;
