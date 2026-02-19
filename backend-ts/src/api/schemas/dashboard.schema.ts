import { z } from "zod"
import { ClassScheduleSchema } from "./common.schema.js"

/** Dashboard class response */
export const DashboardClassResponseSchema = z.object({
  id: z.number(),
  teacherId: z.number(),
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
  schedule: ClassScheduleSchema,
})

export type DashboardClassResponse = z.infer<
  typeof DashboardClassResponseSchema
>

/** Dashboard assignment response */
export const DashboardAssignmentResponseSchema = z.object({
  id: z.number(),
  assignmentName: z.string(),
  className: z.string(),
  classId: z.number(),
  deadline: z.string().nullable(),
  hasSubmitted: z.boolean().optional(),
  submittedAt: z.string().nullable().optional(),
  grade: z.number().nullable().optional(),
  maxGrade: z.number().optional(),
  programmingLanguage: z.string(),
})

export type DashboardAssignmentResponse = z.infer<
  typeof DashboardAssignmentResponseSchema
>

/** Student dashboard response */
export const StudentDashboardResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  enrolledClasses: z.array(DashboardClassResponseSchema),
  pendingAssignments: z.array(DashboardAssignmentResponseSchema),
})

export type StudentDashboardResponse = z.infer<
  typeof StudentDashboardResponseSchema
>

/** Join class request */
export const JoinClassRequestSchema = z.object({
  studentId: z.number().int().min(1),
  classCode: z.string().min(1),
})

export type JoinClassRequest = z.infer<typeof JoinClassRequestSchema>

/** Leave class request */
export const LeaveClassRequestSchema = z.object({
  studentId: z.number().int().min(1),
  classId: z.number().int().min(1),
})

export type LeaveClassRequest = z.infer<typeof LeaveClassRequestSchema>

/** Teacher dashboard task response */
export const DashboardTaskResponseSchema = z.object({
  id: z.number(),
  assignmentName: z.string(),
  className: z.string(),
  classId: z.number(),
  deadline: z.string().nullable(),
  submissionCount: z.number(),
  totalStudents: z.number(),
})

export type DashboardTaskResponse = z.infer<typeof DashboardTaskResponseSchema>

/** Teacher dashboard response */
export const TeacherDashboardResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  recentClasses: z.array(DashboardClassResponseSchema),
  pendingTasks: z.array(DashboardTaskResponseSchema),
})

export type TeacherDashboardResponse = z.infer<
  typeof TeacherDashboardResponseSchema
>

// ============================================================================
// Query Schemas (from controllers)
// ============================================================================

/** Student dashboard query schema */
export const StudentDashboardQuerySchema = z.object({
  enrolledClassesLimit: z.coerce.number().int().positive().max(50).optional(),
  pendingAssignmentsLimit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional(),
})

export type StudentDashboardQuery = z.infer<typeof StudentDashboardQuerySchema>

/** Teacher dashboard query schema */
export const TeacherDashboardQuerySchema = z.object({
  recentClassesLimit: z.coerce.number().int().positive().max(50).optional(),
  pendingTasksLimit: z.coerce.number().int().positive().max(100).optional(),
})

export type TeacherDashboardQuery = z.infer<typeof TeacherDashboardQuerySchema>

// ============================================================================
// Response Schemas (from controllers)
// ============================================================================

/** Dashboard class list response schema */
export const DashboardClassListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  classes: z.array(DashboardClassResponseSchema),
})

export type DashboardClassListResponse = z.infer<
  typeof DashboardClassListResponseSchema
>

/** Dashboard assignment list response schema */
export const DashboardAssignmentListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  assignments: z.array(DashboardAssignmentResponseSchema),
})

export type DashboardAssignmentListResponse = z.infer<
  typeof DashboardAssignmentListResponseSchema
>

/** Task list response schema */
export const TaskListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  tasks: z.array(DashboardTaskResponseSchema),
})

export type TaskListResponse = z.infer<typeof TaskListResponseSchema>

/** Join class response schema */
export const JoinClassResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  classInfo: DashboardClassResponseSchema,
})

export type JoinClassResponse = z.infer<typeof JoinClassResponseSchema>
