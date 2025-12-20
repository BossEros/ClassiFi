import { z } from 'zod';

/** Dashboard class response */
export const DashboardClassResponseSchema = z.object({
    id: z.number(),
    className: z.string(),
    classCode: z.string(),
    description: z.string().nullable(),
    studentCount: z.number().optional(),
    assignmentCount: z.number().optional(),
    teacherName: z.string().optional(),
    createdAt: z.string(),
});

export type DashboardClassResponse = z.infer<typeof DashboardClassResponseSchema>;

/** Dashboard assignment response */
export const DashboardAssignmentResponseSchema = z.object({
    id: z.number(),
    assignmentName: z.string(),
    className: z.string(),
    classId: z.number(),
    deadline: z.string(),
    hasSubmitted: z.boolean().optional(),
    programmingLanguage: z.string(),
});

export type DashboardAssignmentResponse = z.infer<typeof DashboardAssignmentResponseSchema>;

/** Student dashboard response */
export const StudentDashboardResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    enrolledClasses: z.array(DashboardClassResponseSchema),
    pendingAssignments: z.array(DashboardAssignmentResponseSchema),
});

export type StudentDashboardResponse = z.infer<typeof StudentDashboardResponseSchema>;

/** Join class request */
export const JoinClassRequestSchema = z.object({
    studentId: z.number().int().positive(),
    classCode: z.string().min(1),
});

export type JoinClassRequest = z.infer<typeof JoinClassRequestSchema>;

/** Leave class request */
export const LeaveClassRequestSchema = z.object({
    studentId: z.number().int().positive(),
    classId: z.number().int().positive(),
});

export type LeaveClassRequest = z.infer<typeof LeaveClassRequestSchema>;

/** Teacher dashboard task response */
export const DashboardTaskResponseSchema = z.object({
    id: z.number(),
    assignmentName: z.string(),
    className: z.string(),
    classId: z.number(),
    deadline: z.string(),
    submissionCount: z.number(),
    totalStudents: z.number(),
});

export type DashboardTaskResponse = z.infer<typeof DashboardTaskResponseSchema>;

/** Teacher dashboard response */
export const TeacherDashboardResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    recentClasses: z.array(DashboardClassResponseSchema),
    pendingTasks: z.array(DashboardTaskResponseSchema),
});

export type TeacherDashboardResponse = z.infer<typeof TeacherDashboardResponseSchema>;
