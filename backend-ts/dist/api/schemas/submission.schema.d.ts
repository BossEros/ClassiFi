import { z } from 'zod';
/** Submission response schema */
export declare const SubmissionResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    assignmentId: z.ZodNumber;
    studentId: z.ZodNumber;
    fileName: z.ZodString;
    filePath: z.ZodString;
    fileSize: z.ZodNumber;
    submissionNumber: z.ZodNumber;
    submittedAt: z.ZodString;
    isLatest: z.ZodBoolean;
    studentName: z.ZodOptional<z.ZodString>;
    assignmentName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
/** Submit assignment response schema */
export declare const SubmitAssignmentResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    submission: z.ZodOptional<z.ZodObject<{
        id: z.ZodNumber;
        assignmentId: z.ZodNumber;
        studentId: z.ZodNumber;
        fileName: z.ZodString;
        filePath: z.ZodString;
        fileSize: z.ZodNumber;
        submissionNumber: z.ZodNumber;
        submittedAt: z.ZodString;
        isLatest: z.ZodBoolean;
        studentName: z.ZodOptional<z.ZodString>;
        assignmentName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SubmitAssignmentResponse = z.infer<typeof SubmitAssignmentResponseSchema>;
/** Submission list response schema */
export declare const SubmissionListResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    submissions: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        assignmentId: z.ZodNumber;
        studentId: z.ZodNumber;
        fileName: z.ZodString;
        filePath: z.ZodString;
        fileSize: z.ZodNumber;
        submissionNumber: z.ZodNumber;
        submittedAt: z.ZodString;
        isLatest: z.ZodBoolean;
        studentName: z.ZodOptional<z.ZodString>;
        assignmentName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type SubmissionListResponse = z.infer<typeof SubmissionListResponseSchema>;
/** Submission history response schema */
export declare const SubmissionHistoryResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    submissions: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        assignmentId: z.ZodNumber;
        studentId: z.ZodNumber;
        fileName: z.ZodString;
        filePath: z.ZodString;
        fileSize: z.ZodNumber;
        submissionNumber: z.ZodNumber;
        submittedAt: z.ZodString;
        isLatest: z.ZodBoolean;
        studentName: z.ZodOptional<z.ZodString>;
        assignmentName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    totalSubmissions: z.ZodNumber;
}, z.core.$strip>;
export type SubmissionHistoryResponse = z.infer<typeof SubmissionHistoryResponseSchema>;
/** Submission detail response schema */
export declare const SubmissionDetailResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    assignmentId: z.ZodNumber;
    studentId: z.ZodNumber;
    fileName: z.ZodString;
    filePath: z.ZodString;
    fileSize: z.ZodNumber;
    submissionNumber: z.ZodNumber;
    submittedAt: z.ZodString;
    isLatest: z.ZodBoolean;
    studentName: z.ZodOptional<z.ZodString>;
    assignmentName: z.ZodOptional<z.ZodString>;
    className: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SubmissionDetailResponse = z.infer<typeof SubmissionDetailResponseSchema>;
/** Submission ID param schema */
export declare const SubmissionIdParamSchema: z.ZodObject<{
    submissionId: z.ZodString;
}, z.core.$strip>;
export type SubmissionIdParam = z.infer<typeof SubmissionIdParamSchema>;
/** History params schema (assignmentId + studentId) */
export declare const HistoryParamsSchema: z.ZodObject<{
    assignmentId: z.ZodString;
    studentId: z.ZodString;
}, z.core.$strip>;
export type HistoryParams = z.infer<typeof HistoryParamsSchema>;
/** Download response schema */
export declare const DownloadResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    downloadUrl: z.ZodString;
}, z.core.$strip>;
export type DownloadResponse = z.infer<typeof DownloadResponseSchema>;
//# sourceMappingURL=submission.schema.d.ts.map