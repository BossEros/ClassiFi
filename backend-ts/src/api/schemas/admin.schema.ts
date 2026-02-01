/**
 * Admin Validation Schemas
 * Zod schemas for admin endpoint request/response validation
 */
import { z } from "zod"
import {
  ClassScheduleSchema,
  DayOfWeekEnum,
  PaginationQuerySchema,
  SuccessResponseSchema,
} from "./common.schema.js"

// Re-export for backwards compatibility
export { ClassScheduleSchema, DayOfWeekEnum }

// ============================================================================
// Configuration Constants
// ============================================================================

const MIN_PASSWORD_LENGTH = 8
const MAX_YEAR_LEVEL = 12
const MAX_SEMESTER = 3

// ============================================================================
// User Management Schemas
// ============================================================================

/**
 * User role enumeration schema.
 * Defines the three role types available in the system.
 */
export const UserRoleSchema = z.enum(["student", "teacher", "admin"])
export type UserRole = z.infer<typeof UserRoleSchema>

/**
 * Query parameters for filtering and paginating user lists.
 * Used by the GET /admin/users endpoint.
 *
 * @property search - Optional text search across user fields
 * @property role - Filter by user role (default: "all")
 * @property status - Filter by active/inactive status (default: "all")
 * @property page - Page number for pagination (default: 1)
 * @property limit - Items per page (default: 20, max: 100)
 */
export const UserFilterQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  role: z.enum(["student", "teacher", "admin", "all"]).default("all"),
  status: z.enum(["active", "inactive", "all"]).default("all"),
})
export type UserFilterQuery = z.infer<typeof UserFilterQuerySchema>

/**
 * Path parameters for user-specific endpoints.
 * Contains the user ID as a positive integer.
 */
export const UserParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
export type UserParams = z.infer<typeof UserParamsSchema>

/**
 * Request body schema for updating a user's role.
 * Used by PATCH /admin/users/:id/role endpoint.
 */
export const UpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
})
export type UpdateUserRole = z.infer<typeof UpdateUserRoleSchema>

/**
 * Request body schema for updating user profile details.
 * Used by PATCH /admin/users/:id endpoint.
 */
export const UpdateUserDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
})
export type UpdateUserDetails = z.infer<typeof UpdateUserDetailsSchema>

/**
 * Request body schema for updating a user's email address.
 * Used by PATCH /admin/users/:id/email endpoint.
 */
export const UpdateUserEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})
export type UpdateUserEmail = z.infer<typeof UpdateUserEmailSchema>

/**
 * Request body schema for creating a new user account.
 * Requires all user details including credentials and role assignment.
 */
export const CreateUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    ),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: UserRoleSchema,
})
export type CreateUser = z.infer<typeof CreateUserSchema>

/**
 * User data transfer object schema.
 * Represents user information returned by admin endpoints.
 */
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
export type UserDTO = z.infer<typeof UserDTOSchema>

/**
 * Response schema for paginated user lists.
 * Includes pagination metadata and user data array.
 */
export const PaginatedUsersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(UserDTOSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

/**
 * Response schema for single user retrieval.
 * Returns a single user object.
 */
export const SingleUserResponseSchema = z.object({
  success: z.boolean(),
  user: UserDTOSchema,
})

/**
 * Response schema for teachers list.
 * Returns array of teacher users.
 */
export const TeachersListResponseSchema = z.object({
  success: z.boolean(),
  teachers: z.array(UserDTOSchema),
})

// Re-export SuccessResponseSchema for backwards compatibility
export { SuccessResponseSchema }

// ============================================================================
// Analytics Schemas
// ============================================================================

/**
 * Response schema for admin dashboard statistics.
 * Provides system-wide metrics and counts.
 */
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

/**
 * Activity log item schema.
 * Represents a single activity event in the system.
 */
export const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  user: z.string(),
  target: z.string(),
  timestamp: z.string(),
})

/**
 * Response schema for activity feed.
 * Returns array of recent activity items.
 */
export const ActivityResponseSchema = z.object({
  success: z.boolean(),
  activity: z.array(ActivityItemSchema),
})

/**
 * Query parameters for activity feed endpoint.
 * Controls the number of activity items returned.
 */
export const ActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
export type ActivityQuery = z.infer<typeof ActivityQuerySchema>

// ============================================================================
// Class Management Schemas
// ============================================================================

/**
 * Query parameters for filtering and paginating class lists.
 * Used by the GET /admin/classes endpoint.
 *
 * @property search - Optional text search across class fields
 * @property teacherId - Filter by specific teacher
 * @property status - Filter by active/archived status (default: "all")
 * @property yearLevel - Filter by year level (1-4)
 * @property semester - Filter by semester (1-2)
 * @property academicYear - Filter by academic year
 * @property page - Page number for pagination (default: 1)
 * @property limit - Items per page (default: 20, max: 100)
 */
export const ClassFilterQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  teacherId: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "archived", "all"]).default("all"),
  yearLevel: z.coerce.number().int().min(1).max(4).optional(),
  semester: z.coerce.number().int().min(1).max(2).optional(),
  academicYear: z.string().optional(),
})
export type ClassFilterQuery = z.infer<typeof ClassFilterQuerySchema>

/**
 * Path parameters for class-specific endpoints.
 * Contains the class ID as a positive integer.
 */
export const ClassParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})
export type ClassParams = z.infer<typeof ClassParamsSchema>

/**
 * Request body schema for creating a new class.
 * Requires all class details including teacher assignment and schedule.
 */
export const CreateClassSchema = z.object({
  teacherId: z.number().int().positive(),
  className: z.string().min(1, "Class name is required"),
  yearLevel: z.number().int().min(1).max(MAX_YEAR_LEVEL),
  semester: z.number().int().min(1).max(MAX_SEMESTER),
  academicYear: z.string().min(1, "Academic year is required"),
  schedule: ClassScheduleSchema,
  description: z.string().optional(),
})
export type CreateClass = z.infer<typeof CreateClassSchema>

/**
 * Request body schema for updating class details.
 * All fields are optional for partial updates.
 */
export const UpdateClassSchema = z.object({
  className: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  yearLevel: z.number().int().min(1).max(MAX_YEAR_LEVEL).optional(),
  semester: z.number().int().min(1).max(MAX_SEMESTER).optional(),
  academicYear: z.string().optional(),
  schedule: ClassScheduleSchema.optional(),
  teacherId: z.number().int().positive().optional(),
})
export type UpdateClass = z.infer<typeof UpdateClassSchema>

/**
 * Request body schema for reassigning a class to a different teacher.
 * Used by PATCH /admin/classes/:id/teacher endpoint.
 */
export const ReassignTeacherSchema = z.object({
  teacherId: z.number().int().positive(),
})
export type ReassignTeacher = z.infer<typeof ReassignTeacherSchema>

/**
 * Path parameters for student enrollment endpoints.
 * Contains both class ID and student ID.
 */
export const StudentEnrollmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  studentId: z.coerce.number().int().positive(),
})
export type StudentEnrollmentParams = z.infer<
  typeof StudentEnrollmentParamsSchema
>

/**
 * Request body schema for enrolling a student in a class.
 * Used by POST /admin/classes/:id/students endpoint.
 */
export const EnrollStudentBodySchema = z.object({
  studentId: z.number().int().positive(),
})
export type EnrollStudentBody = z.infer<typeof EnrollStudentBodySchema>

/**
 * Class data transfer object schema.
 * Represents class information without teacher details.
 */
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

/**
 * Class data transfer object with teacher information.
 * Extends ClassDTO with teacher name for admin views.
 */
export const ClassWithTeacherDTOSchema = ClassDTOSchema.extend({
  teacherName: z.string(),
})

/**
 * Response schema for paginated class lists.
 * Includes pagination metadata and class data array.
 */
export const PaginatedClassesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ClassWithTeacherDTOSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

/**
 * Response schema for single class retrieval.
 * Returns a single class object with teacher information.
 */
export const SingleClassResponseSchema = z.object({
  success: z.boolean(),
  class: ClassWithTeacherDTOSchema,
})

/**
 * Assignment item schema for class assignment lists.
 * Lightweight representation of assignments within a class.
 */
export const ClassAssignmentItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullish(),
  deadline: z.string().nullish(),
  createdAt: z.string(),
  submissionCount: z.number(),
})

/**
 * Response schema for class assignments list.
 * Returns array of assignments for a specific class.
 */
export const ClassAssignmentsResponseSchema = z.object({
  success: z.boolean(),
  assignments: z.array(ClassAssignmentItemSchema),
})
