import { z } from 'zod';
/** Programming language enum */
export declare const ProgrammingLanguageSchema: z.ZodEnum<["python", "java"]>;
export type ProgrammingLanguage = z.infer<typeof ProgrammingLanguageSchema>;
/** Create assignment request schema */
export declare const CreateAssignmentRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    assignmentName: z.ZodString;
    description: z.ZodString;
    programmingLanguage: z.ZodEnum<["python", "java"]>;
    deadline: z.ZodString;
    allowResubmission: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
    description: string;
    assignmentName: string;
    programmingLanguage: "python" | "java";
    deadline: string;
    allowResubmission: boolean;
}, {
    teacherId: number;
    description: string;
    assignmentName: string;
    programmingLanguage: "python" | "java";
    deadline: string;
    allowResubmission?: boolean | undefined;
}>;
export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;
/** Update assignment request schema */
export declare const UpdateAssignmentRequestSchema: z.ZodObject<{
    teacherId: z.ZodNumber;
    assignmentName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    programmingLanguage: z.ZodOptional<z.ZodEnum<["python", "java"]>>;
    deadline: z.ZodOptional<z.ZodString>;
    allowResubmission: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    teacherId: number;
    description?: string | undefined;
    assignmentName?: string | undefined;
    programmingLanguage?: "python" | "java" | undefined;
    deadline?: string | undefined;
    allowResubmission?: boolean | undefined;
}, {
    teacherId: number;
    description?: string | undefined;
    assignmentName?: string | undefined;
    programmingLanguage?: "python" | "java" | undefined;
    deadline?: string | undefined;
    allowResubmission?: boolean | undefined;
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
    submissionCount?: number | undefined;
    hasSubmitted?: boolean | undefined;
    teacherName?: string | undefined;
}>;
export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;
//# sourceMappingURL=assignment.schema.d.ts.map