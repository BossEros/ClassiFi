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
    studentUsername: z.ZodOptional<z.ZodString>;
    assignmentName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    assignmentId: number;
    studentId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    submissionNumber: number;
    submittedAt: string;
    isLatest: boolean;
    assignmentName?: string | undefined;
    studentName?: string | undefined;
    studentUsername?: string | undefined;
}, {
    id: number;
    assignmentId: number;
    studentId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    submissionNumber: number;
    submittedAt: string;
    isLatest: boolean;
    assignmentName?: string | undefined;
    studentName?: string | undefined;
    studentUsername?: string | undefined;
}>;
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
        studentUsername: z.ZodOptional<z.ZodString>;
        assignmentName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }, {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    submission?: {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    } | undefined;
}, {
    message: string;
    success: boolean;
    submission?: {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    } | undefined;
}>;
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
        studentUsername: z.ZodOptional<z.ZodString>;
        assignmentName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }, {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    submissions: {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }[];
    success: boolean;
}, {
    message: string;
    submissions: {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }[];
    success: boolean;
}>;
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
        studentUsername: z.ZodOptional<z.ZodString>;
        assignmentName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }, {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }>, "many">;
    totalSubmissions: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    message: string;
    submissions: {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }[];
    totalSubmissions: number;
    success: boolean;
}, {
    message: string;
    submissions: {
        id: number;
        assignmentId: number;
        studentId: number;
        fileName: string;
        filePath: string;
        fileSize: number;
        submissionNumber: number;
        submittedAt: string;
        isLatest: boolean;
        assignmentName?: string | undefined;
        studentName?: string | undefined;
        studentUsername?: string | undefined;
    }[];
    totalSubmissions: number;
    success: boolean;
}>;
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
    studentUsername: z.ZodOptional<z.ZodString>;
} & {
    assignmentName: z.ZodOptional<z.ZodString>;
    className: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    assignmentId: number;
    studentId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    submissionNumber: number;
    submittedAt: string;
    isLatest: boolean;
    className?: string | undefined;
    assignmentName?: string | undefined;
    studentName?: string | undefined;
    studentUsername?: string | undefined;
}, {
    id: number;
    assignmentId: number;
    studentId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    submissionNumber: number;
    submittedAt: string;
    isLatest: boolean;
    className?: string | undefined;
    assignmentName?: string | undefined;
    studentName?: string | undefined;
    studentUsername?: string | undefined;
}>;
export type SubmissionDetailResponse = z.infer<typeof SubmissionDetailResponseSchema>;
/** Submission ID param schema */
export declare const SubmissionIdParamSchema: z.ZodObject<{
    submissionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    submissionId: string;
}, {
    submissionId: string;
}>;
export type SubmissionIdParam = z.infer<typeof SubmissionIdParamSchema>;
/** History params schema (assignmentId + studentId) */
export declare const HistoryParamsSchema: z.ZodObject<{
    assignmentId: z.ZodString;
    studentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    assignmentId: string;
    studentId: string;
}, {
    assignmentId: string;
    studentId: string;
}>;
export type HistoryParams = z.infer<typeof HistoryParamsSchema>;
/** Download response schema */
export declare const DownloadResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    downloadUrl: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
    downloadUrl: string;
}, {
    message: string;
    success: true;
    downloadUrl: string;
}>;
export type DownloadResponse = z.infer<typeof DownloadResponseSchema>;
//# sourceMappingURL=submission.schema.d.ts.map