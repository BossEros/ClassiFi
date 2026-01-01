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
}, z.core.$strip>;
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
}, z.core.$strip>;
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
    }, z.core.$strip>>;
    pendingAssignments: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        assignmentName: z.ZodString;
        className: z.ZodString;
        classId: z.ZodNumber;
        deadline: z.ZodString;
        hasSubmitted: z.ZodOptional<z.ZodBoolean>;
        programmingLanguage: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type StudentDashboardResponse = z.infer<typeof StudentDashboardResponseSchema>;
/** Join class request */
export declare const JoinClassRequestSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    classCode: z.ZodString;
}, z.core.$strip>;
export type JoinClassRequest = z.infer<typeof JoinClassRequestSchema>;
/** Leave class request */
export declare const LeaveClassRequestSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    classId: z.ZodNumber;
}, z.core.$strip>;
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
}, z.core.$strip>;
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
    }, z.core.$strip>>;
    pendingTasks: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        assignmentName: z.ZodString;
        className: z.ZodString;
        classId: z.ZodNumber;
        deadline: z.ZodString;
        submissionCount: z.ZodNumber;
        totalStudents: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type TeacherDashboardResponse = z.infer<typeof TeacherDashboardResponseSchema>;
/** Student dashboard query schema */
export declare const StudentDashboardQuerySchema: z.ZodObject<{
    enrolledClassesLimit: z.ZodOptional<z.ZodString>;
    pendingAssignmentsLimit: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type StudentDashboardQuery = z.infer<typeof StudentDashboardQuerySchema>;
/** Teacher dashboard query schema */
export declare const TeacherDashboardQuerySchema: z.ZodObject<{
    recentClassesLimit: z.ZodOptional<z.ZodString>;
    pendingTasksLimit: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
    }, z.core.$strip>>;
}, z.core.$strip>;
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
    }, z.core.$strip>>;
}, z.core.$strip>;
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
    }, z.core.$strip>>;
}, z.core.$strip>;
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
    }, z.core.$strip>;
}, z.core.$strip>;
export type JoinClassResponse = z.infer<typeof JoinClassResponseSchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map