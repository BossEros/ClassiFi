import { z } from 'zod';
/** Programming language enum */
export declare const ProgrammingLanguageSchema: z.ZodEnum<{
    python: "python";
    java: "java";
    c: "c";
}>;
export type ProgrammingLanguage = z.infer<typeof ProgrammingLanguageSchema>;
/** Create assignment request schema */
export declare const CreateAssignmentRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    assignmentName: z.ZodString;
    description: z.ZodString;
    programmingLanguage: z.ZodEnum<{
        python: "python";
        java: "java";
        c: "c";
    }>;
    deadline: z.ZodString;
    allowResubmission: z.ZodDefault<z.ZodBoolean>;
    maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;
/** Update assignment request schema */
export declare const UpdateAssignmentRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    assignmentName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    programmingLanguage: z.ZodOptional<z.ZodEnum<{
        python: "python";
        java: "java";
        c: "c";
    }>>;
    deadline: z.ZodOptional<z.ZodString>;
    allowResubmission: z.ZodOptional<z.ZodBoolean>;
    maxAttempts: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
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
}, z.core.$strip>;
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
    className: z.ZodOptional<z.ZodString>;
    teacherName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;
/** Assignment ID param schema */
export declare const AssignmentIdParamSchema: z.ZodObject<{
    assignmentId: z.ZodString;
}, z.core.$strip>;
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
        className: z.ZodOptional<z.ZodString>;
        teacherName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
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
    }, z.core.$strip>;
}, z.core.$strip>;
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
    }, z.core.$strip>>;
}, z.core.$strip>;
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
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreateAssignmentResponse = z.infer<typeof CreateAssignmentResponseSchema>;
//# sourceMappingURL=assignment.schema.d.ts.map