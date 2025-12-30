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
//# sourceMappingURL=submission.schema.d.ts.map