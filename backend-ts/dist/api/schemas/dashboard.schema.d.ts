import { z } from 'zod';
/** Dashboard class response */
export declare const DashboardClassResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    className: z.ZodString;
    classCode: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    studentCount: z.ZodOptional<z.ZodNumber>;
    assignmentCount: z.ZodOptional<z.ZodNumber>;
    teacherName: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    createdAt: string;
    className: string;
    classCode: string;
    description: string | null;
    studentCount?: number | undefined;
    teacherName?: string | undefined;
    assignmentCount?: number | undefined;
}, {
    id: number;
    createdAt: string;
    className: string;
    classCode: string;
    description: string | null;
    studentCount?: number | undefined;
    teacherName?: string | undefined;
    assignmentCount?: number | undefined;
}>;
export type DashboardClassResponse = z.infer<typeof DashboardClassResponseSchema>;
/** Dashboard assignment response */
export declare const DashboardAssignmentResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    assignmentName: z.ZodString;
    className: z.ZodString;
    classId: z.ZodNumber;
    deadline: z.ZodString;
    hasSubmitted: z.ZodOptional<z.ZodBoolean>;
    programmingLanguage: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    className: string;
    classId: number;
    assignmentName: string;
    programmingLanguage: string;
    deadline: string;
    hasSubmitted?: boolean | undefined;
}, {
    id: number;
    className: string;
    classId: number;
    assignmentName: string;
    programmingLanguage: string;
    deadline: string;
    hasSubmitted?: boolean | undefined;
}>;
export type DashboardAssignmentResponse = z.infer<typeof DashboardAssignmentResponseSchema>;
/** Student dashboard response */
export declare const StudentDashboardResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    enrolledClasses: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        className: z.ZodString;
        classCode: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        studentCount: z.ZodOptional<z.ZodNumber>;
        assignmentCount: z.ZodOptional<z.ZodNumber>;
        teacherName: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }, {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }>, "many">;
    pendingAssignments: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        assignmentName: z.ZodString;
        className: z.ZodString;
        classId: z.ZodNumber;
        deadline: z.ZodString;
        hasSubmitted: z.ZodOptional<z.ZodBoolean>;
        programmingLanguage: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        hasSubmitted?: boolean | undefined;
    }, {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        hasSubmitted?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    enrolledClasses: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }[];
    pendingAssignments: {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        hasSubmitted?: boolean | undefined;
    }[];
}, {
    message: string;
    success: boolean;
    enrolledClasses: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }[];
    pendingAssignments: {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        hasSubmitted?: boolean | undefined;
    }[];
}>;
export type StudentDashboardResponse = z.infer<typeof StudentDashboardResponseSchema>;
/** Join class request */
export declare const JoinClassRequestSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    classCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    classCode: string;
    studentId: number;
}, {
    classCode: string;
    studentId: number;
}>;
export type JoinClassRequest = z.infer<typeof JoinClassRequestSchema>;
/** Leave class request */
export declare const LeaveClassRequestSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    classId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    classId: number;
    studentId: number;
}, {
    classId: number;
    studentId: number;
}>;
export type LeaveClassRequest = z.infer<typeof LeaveClassRequestSchema>;
/** Teacher dashboard task response */
export declare const DashboardTaskResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    assignmentName: z.ZodString;
    className: z.ZodString;
    classId: z.ZodNumber;
    deadline: z.ZodString;
    submissionCount: z.ZodNumber;
    totalStudents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    className: string;
    classId: number;
    assignmentName: string;
    deadline: string;
    submissionCount: number;
    totalStudents: number;
}, {
    id: number;
    className: string;
    classId: number;
    assignmentName: string;
    deadline: string;
    submissionCount: number;
    totalStudents: number;
}>;
export type DashboardTaskResponse = z.infer<typeof DashboardTaskResponseSchema>;
/** Teacher dashboard response */
export declare const TeacherDashboardResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    recentClasses: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        className: z.ZodString;
        classCode: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        studentCount: z.ZodOptional<z.ZodNumber>;
        assignmentCount: z.ZodOptional<z.ZodNumber>;
        teacherName: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }, {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }>, "many">;
    pendingTasks: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        assignmentName: z.ZodString;
        className: z.ZodString;
        classId: z.ZodNumber;
        deadline: z.ZodString;
        submissionCount: z.ZodNumber;
        totalStudents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        deadline: string;
        submissionCount: number;
        totalStudents: number;
    }, {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        deadline: string;
        submissionCount: number;
        totalStudents: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    recentClasses: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }[];
    pendingTasks: {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        deadline: string;
        submissionCount: number;
        totalStudents: number;
    }[];
}, {
    message: string;
    success: boolean;
    recentClasses: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }[];
    pendingTasks: {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        deadline: string;
        submissionCount: number;
        totalStudents: number;
    }[];
}>;
export type TeacherDashboardResponse = z.infer<typeof TeacherDashboardResponseSchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map