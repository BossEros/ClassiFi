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
/** Student dashboard response */
export const StudentDashboardResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    enrolledClasses: z.array(DashboardClassResponseSchema),
    pendingAssignments: z.array(DashboardAssignmentResponseSchema),
});
/** Join class request */
export const JoinClassRequestSchema = z.object({
    studentId: z.number().int().positive(),
    classCode: z.string().min(1),
});
/** Leave class request */
export const LeaveClassRequestSchema = z.object({
    studentId: z.number().int().positive(),
    classId: z.number().int().positive(),
});
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
/** Teacher dashboard response */
export const TeacherDashboardResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    recentClasses: z.array(DashboardClassResponseSchema),
    pendingTasks: z.array(DashboardTaskResponseSchema),
});
//# sourceMappingURL=dashboard.schema.js.map