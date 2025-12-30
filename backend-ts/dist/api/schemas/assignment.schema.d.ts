import { z } from 'zod';
/** Programming language enum */
export declare const ProgrammingLanguageSchema: z.ZodEnum<["python", "java", "c"]>;
export type ProgrammingLanguage = z.infer<typeof ProgrammingLanguageSchema>;
/** Create assignment request schema */
export declare const CreateAssignmentRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    assignmentName: z.ZodString;
    description: z.ZodString;
    programmingLanguage: z.ZodEnum<["python", "java", "c"]>;
    deadline: z.ZodString;
    allowResubmission: z.ZodDefault<z.ZodBoolean>;
    maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
    description: string;
    assignmentName: string;
    programmingLanguage: "python" | "java" | "c";
    deadline: string;
    allowResubmission: boolean;
    maxAttempts?: number | null | undefined;
}, {
    teacherId: number;
    description: string;
    assignmentName: string;
    programmingLanguage: "python" | "java" | "c";
    deadline: string;
    allowResubmission?: boolean | undefined;
    maxAttempts?: number | null | undefined;
}>;
export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;
/** Update assignment request schema */
export declare const UpdateAssignmentRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    assignmentName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    programmingLanguage: z.ZodOptional<z.ZodEnum<["python", "java", "c"]>>;
    deadline: z.ZodOptional<z.ZodString>;
    allowResubmission: z.ZodOptional<z.ZodBoolean>;
    maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
    description?: string | undefined;
    assignmentName?: string | undefined;
    programmingLanguage?: "python" | "java" | "c" | undefined;
    deadline?: string | undefined;
    allowResubmission?: boolean | undefined;
    maxAttempts?: number | null | undefined;
}, {
    teacherId: number;
    description?: string | undefined;
    assignmentName?: string | undefined;
    programmingLanguage?: "python" | "java" | "c" | undefined;
    deadline?: string | undefined;
    allowResubmission?: boolean | undefined;
    maxAttempts?: number | null | undefined;
}>;
export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;
/** Assignment response schema */
export declare const AssignmentResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    classId: z.ZodNumber;
    assignmentName: z.ZodString;
    description: z.ZodString;
    programmingLanguage: z.ZodString;
    deadline: z.ZodString;
    allowResubmission: z.ZodBoolean;
    maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    createdAt: z.ZodString;
    isActive: z.ZodBoolean;
    submissionCount: z.ZodOptional<z.ZodNumber>;
    hasSubmitted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: number;
    createdAt: string;
    description: string;
    isActive: boolean;
    classId: number;
    assignmentName: string;
    programmingLanguage: string;
    deadline: string;
    allowResubmission: boolean;
    maxAttempts?: number | null | undefined;
    submissionCount?: number | undefined;
    hasSubmitted?: boolean | undefined;
}, {
    id: number;
    createdAt: string;
    description: string;
    isActive: boolean;
    classId: number;
    assignmentName: string;
    programmingLanguage: string;
    deadline: string;
    allowResubmission: boolean;
    maxAttempts?: number | null | undefined;
    submissionCount?: number | undefined;
    hasSubmitted?: boolean | undefined;
}>;
export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>;
/** Assignment detail response schema */
export declare const AssignmentDetailResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    classId: z.ZodNumber;
    assignmentName: z.ZodString;
    description: z.ZodString;
    programmingLanguage: z.ZodString;
    deadline: z.ZodString;
    allowResubmission: z.ZodBoolean;
    maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    createdAt: z.ZodString;
    isActive: z.ZodBoolean;
    submissionCount: z.ZodOptional<z.ZodNumber>;
    hasSubmitted: z.ZodOptional<z.ZodBoolean>;
} & {
    className: z.ZodOptional<z.ZodString>;
    teacherName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    createdAt: string;
    description: string;
    isActive: boolean;
    classId: number;
    assignmentName: string;
    programmingLanguage: string;
    deadline: string;
    allowResubmission: boolean;
    className?: string | undefined;
    maxAttempts?: number | null | undefined;
    submissionCount?: number | undefined;
    hasSubmitted?: boolean | undefined;
    teacherName?: string | undefined;
}, {
    id: number;
    createdAt: string;
    description: string;
    isActive: boolean;
    classId: number;
    assignmentName: string;
    programmingLanguage: string;
    deadline: string;
    allowResubmission: boolean;
    className?: string | undefined;
    maxAttempts?: number | null | undefined;
    submissionCount?: number | undefined;
    hasSubmitted?: boolean | undefined;
    teacherName?: string | undefined;
}>;
export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;
/** Assignment ID param schema */
export declare const AssignmentIdParamSchema: z.ZodObject<{
    assignmentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    assignmentId: string;
}, {
    assignmentId: string;
}>;
export type AssignmentIdParam = z.infer<typeof AssignmentIdParamSchema>;
/** Get assignment response schema */
export declare const GetAssignmentResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    assignment: z.ZodObject<{
        id: z.ZodNumber;
        classId: z.ZodNumber;
        assignmentName: z.ZodString;
        description: z.ZodString;
        programmingLanguage: z.ZodString;
        deadline: z.ZodString;
        allowResubmission: z.ZodBoolean;
        maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        submissionCount: z.ZodOptional<z.ZodNumber>;
        hasSubmitted: z.ZodOptional<z.ZodBoolean>;
    } & {
        className: z.ZodOptional<z.ZodString>;
        teacherName: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        className?: string | undefined;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
        teacherName?: string | undefined;
    }, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        className?: string | undefined;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
        teacherName?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    assignment: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        className?: string | undefined;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
        teacherName?: string | undefined;
    };
    success: true;
}, {
    message: string;
    assignment: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        className?: string | undefined;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
        teacherName?: string | undefined;
    };
    success: true;
}>;
export type GetAssignmentResponse = z.infer<typeof GetAssignmentResponseSchema>;
/** Update assignment response schema */
export declare const UpdateAssignmentResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    assignment: z.ZodObject<{
        id: z.ZodNumber;
        classId: z.ZodNumber;
        assignmentName: z.ZodString;
        description: z.ZodString;
        programmingLanguage: z.ZodString;
        deadline: z.ZodString;
        allowResubmission: z.ZodBoolean;
        maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        submissionCount: z.ZodOptional<z.ZodNumber>;
        hasSubmitted: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    assignment: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    };
    success: true;
}, {
    message: string;
    assignment: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    };
    success: true;
}>;
export type UpdateAssignmentResponse = z.infer<typeof UpdateAssignmentResponseSchema>;
/** Assignment list response schema */
export declare const AssignmentListResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    assignments: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        classId: z.ZodNumber;
        assignmentName: z.ZodString;
        description: z.ZodString;
        programmingLanguage: z.ZodString;
        deadline: z.ZodString;
        allowResubmission: z.ZodBoolean;
        maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        submissionCount: z.ZodOptional<z.ZodNumber>;
        hasSubmitted: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    assignments: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }[];
    success: true;
}, {
    message: string;
    assignments: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }[];
    success: true;
}>;
export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;
/** Create assignment response schema */
export declare const CreateAssignmentResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    assignment: z.ZodObject<{
        id: z.ZodNumber;
        classId: z.ZodNumber;
        assignmentName: z.ZodString;
        description: z.ZodString;
        programmingLanguage: z.ZodString;
        deadline: z.ZodString;
        allowResubmission: z.ZodBoolean;
        maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        createdAt: z.ZodString;
        isActive: z.ZodBoolean;
        submissionCount: z.ZodOptional<z.ZodNumber>;
        hasSubmitted: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }, {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: string;
    assignment: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    };
    success: true;
}, {
    message: string;
    assignment: {
        id: number;
        createdAt: string;
        description: string;
        isActive: boolean;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        allowResubmission: boolean;
        maxAttempts?: number | null | undefined;
        submissionCount?: number | undefined;
        hasSubmitted?: boolean | undefined;
    };
    success: true;
}>;
export type CreateAssignmentResponse = z.infer<typeof CreateAssignmentResponseSchema>;
//# sourceMappingURL=assignment.schema.d.ts.map