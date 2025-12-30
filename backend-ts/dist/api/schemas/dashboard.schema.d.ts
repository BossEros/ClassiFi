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
/** Student dashboard query schema */
export declare const StudentDashboardQuerySchema: z.ZodObject<{
    enrolledClassesLimit: z.ZodOptional<z.ZodString>;
    pendingAssignmentsLimit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    enrolledClassesLimit?: string | undefined;
    pendingAssignmentsLimit?: string | undefined;
}, {
    enrolledClassesLimit?: string | undefined;
    pendingAssignmentsLimit?: string | undefined;
}>;
export type StudentDashboardQuery = z.infer<typeof StudentDashboardQuerySchema>;
/** Teacher dashboard query schema */
export declare const TeacherDashboardQuerySchema: z.ZodObject<{
    recentClassesLimit: z.ZodOptional<z.ZodString>;
    pendingTasksLimit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    recentClassesLimit?: string | undefined;
    pendingTasksLimit?: string | undefined;
}, {
    recentClassesLimit?: string | undefined;
    pendingTasksLimit?: string | undefined;
}>;
export type TeacherDashboardQuery = z.infer<typeof TeacherDashboardQuerySchema>;
/** Dashboard class list response schema */
export declare const DashboardClassListResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    classes: z.ZodArray<z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    message: string;
    classes: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }[];
    success: true;
}, {
    message: string;
    classes: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    }[];
    success: true;
}>;
export type DashboardClassListResponse = z.infer<typeof DashboardClassListResponseSchema>;
/** Dashboard assignment list response schema */
export declare const DashboardAssignmentListResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    assignments: z.ZodArray<z.ZodObject<{
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
    assignments: {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        hasSubmitted?: boolean | undefined;
    }[];
    success: true;
}, {
    message: string;
    assignments: {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        programmingLanguage: string;
        deadline: string;
        hasSubmitted?: boolean | undefined;
    }[];
    success: true;
}>;
export type DashboardAssignmentListResponse = z.infer<typeof DashboardAssignmentListResponseSchema>;
/** Task list response schema */
export declare const TaskListResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    tasks: z.ZodArray<z.ZodObject<{
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
    success: true;
    tasks: {
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
    success: true;
    tasks: {
        id: number;
        className: string;
        classId: number;
        assignmentName: string;
        deadline: string;
        submissionCount: number;
        totalStudents: number;
    }[];
}>;
export type TaskListResponse = z.infer<typeof TaskListResponseSchema>;
/** Join class response schema */
export declare const JoinClassResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    message: z.ZodString;
    classInfo: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    message: string;
    success: true;
    classInfo: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    };
}, {
    message: string;
    success: true;
    classInfo: {
        id: number;
        createdAt: string;
        className: string;
        classCode: string;
        description: string | null;
        studentCount?: number | undefined;
        teacherName?: string | undefined;
        assignmentCount?: number | undefined;
    };
}>;
export type JoinClassResponse = z.infer<typeof JoinClassResponseSchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map