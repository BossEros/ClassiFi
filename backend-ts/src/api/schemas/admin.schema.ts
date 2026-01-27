/**
 * Admin Validation Schemas
 * Zod schemas for admin endpoint request/response validation
 */
import { z } from "zod"
import { ClassScheduleSchema, DayOfWeekEnum } from "./common.schema.js"

// Re-export for backwards compatibility
export { ClassScheduleSchema, DayOfWeekEnum }

// ============ Common Schemas ============

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

// ============ User Management Schemas ============

export const UserRoleSchema = z.enum(["student", "teacher", "admin"])

export const UserFilterQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  role: z.enum(["student", "teacher", "admin", "all"]).default("all"),
  status: z.enum(["active", "inactive", "all"]).default("all"),
})

export const UserParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const UpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
})

export const UpdateUserDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
})

export const UpdateUserEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: UserRoleSchema,
})

export const UserDTOSchema = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
  avatarUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
})

export const PaginatedUsersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(UserDTOSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const SingleUserResponseSchema = z.object({
  success: z.boolean(),
  user: UserDTOSchema,
})

// ============ Analytics Schemas ============

export const AdminStatsResponseSchema = z.object({
  success: z.boolean(),
  stats: z.object({
    totalUsers: z.number(),
    totalStudents: z.number(),
    totalTeachers: z.number(),
    totalAdmins: z.number(),
    totalClasses: z.number(),
    activeClasses: z.number(),
    totalSubmissions: z.number(),
    totalPlagiarismReports: z.number(),
  }),
})

export const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  user: z.string(),
  target: z.string(),
  timestamp: z.string(),
})

export const ActivityResponseSchema = z.object({
  success: z.boolean(),
  activity: z.array(ActivityItemSchema),
})

export const ActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

// ============ Class Management Schemas ============

export const ClassFilterQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  teacherId: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "archived", "all"]).default("all"),
  yearLevel: z.coerce.number().int().min(1).max(4).optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  academicYear: z.string().optional(),
})

export const ClassParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const CreateClassSchema = z.object({
  teacherId: z.number().int().positive(),
  className: z.string().min(1, "Class name is required"),
  yearLevel: z.number().int().min(1).max(12),
  semester: z.number().int().min(1).max(3),
  academicYear: z.string().min(1, "Academic year is required"),
  schedule: ClassScheduleSchema,
  description: z.string().optional(),
})

export const UpdateClassSchema = z.object({
  className: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  yearLevel: z.number().int().min(1).max(12).optional(),
  semester: z.number().int().min(1).max(3).optional(),
  academicYear: z.string().optional(),
  schedule: ClassScheduleSchema.optional(),
  teacherId: z.number().int().positive().optional(),
})

export const ReassignTeacherSchema = z.object({
  teacherId: z.number().int().positive(),
})

export const StudentEnrollmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  studentId: z.coerce.number().int().positive(),
})

export const EnrollStudentBodySchema = z.object({
  studentId: z.number().int().positive(),
})

export const ClassDTOSchema = z.object({
  id: z.number(),
  className: z.string(),
  classCode: z.string(),
  teacherId: z.number(),
  yearLevel: z.number(),
  semester: z.number(),
  academicYear: z.string(),
  schedule: ClassScheduleSchema,
  description: z.string().nullable(),
  isActive: z.boolean(),
  studentCount: z.number().optional(),
  createdAt: z.string().optional(),
})

export const ClassWithTeacherDTOSchema = ClassDTOSchema.extend({
  teacherName: z.string(),
})

export const PaginatedClassesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ClassWithTeacherDTOSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const SingleClassResponseSchema = z.object({
  success: z.boolean(),
  class: ClassWithTeacherDTOSchema,
})

export const TeachersListResponseSchema = z.object({
  success: z.boolean(),
  teachers: z.array(UserDTOSchema),
})

// ============ Type Exports ============

export type UserFilterQuery = z.infer<typeof UserFilterQuerySchema>
export type UserParams = z.infer<typeof UserParamsSchema>
export type UpdateUserRole = z.infer<typeof UpdateUserRoleSchema>
export type UpdateUserDetails = z.infer<typeof UpdateUserDetailsSchema>
export type UpdateUserEmail = z.infer<typeof UpdateUserEmailSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type ClassFilterQuery = z.infer<typeof ClassFilterQuerySchema>
export type ClassParams = z.infer<typeof ClassParamsSchema>
export type CreateClass = z.infer<typeof CreateClassSchema>
export type UpdateClass = z.infer<typeof UpdateClassSchema>
export type ReassignTeacher = z.infer<typeof ReassignTeacherSchema>
export type StudentEnrollmentParams = z.infer<
  typeof StudentEnrollmentParamsSchema
>
export type EnrollStudentBody = z.infer<typeof EnrollStudentBodySchema>
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>
