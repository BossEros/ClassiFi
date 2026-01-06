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
    isActive: z.boolean(),
    yearLevel: z.number(),
    semester: z.number(),
    academicYear: z.string(),
    schedule: z.any(), // Using any for schedule structure for now to match ClassDTO
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
    studentId: z.number().int().min(1),
    classCode: z.string().min(1),
});
/** Leave class request */
export const LeaveClassRequestSchema = z.object({
    studentId: z.number().int().min(1),
    classId: z.number().int().min(1),
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
// ============================================================================
// Query Schemas (from controllers)
// ============================================================================
/** Student dashboard query schema */
export const StudentDashboardQuerySchema = z.object({
    enrolledClassesLimit: z.string().optional(),
    pendingAssignmentsLimit: z.string().optional(),
});
/** Teacher dashboard query schema */
export const TeacherDashboardQuerySchema = z.object({
    recentClassesLimit: z.string().optional(),
    pendingTasksLimit: z.string().optional(),
});
// ============================================================================
// Response Schemas (from controllers)
// ============================================================================
/** Dashboard class list response schema */
export const DashboardClassListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    classes: z.array(DashboardClassResponseSchema),
});
/** Dashboard assignment list response schema */
export const DashboardAssignmentListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignments: z.array(DashboardAssignmentResponseSchema),
});
/** Task list response schema */
export const TaskListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    tasks: z.array(DashboardTaskResponseSchema),
});
/** Join class response schema */
export const JoinClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    classInfo: DashboardClassResponseSchema,
});
//# sourceMappingURL=dashboard.schema.js.map