import type { UserRole } from "@/modules/users/user.repository.js"
import type { ClassSchedule } from "@/modules/classes/class.model.js"

// ============ Pagination Types ============

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============ User Filter Types ============

export interface UserFilterOptions extends PaginationOptions {
  search?: string
  role?: UserRole | "all"
  status?: "active" | "inactive" | "all"
}

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
}

// ============ Class Filter Types ============

export interface ClassFilterOptions extends PaginationOptions {
  search?: string
  teacherId?: number
  status?: "active" | "archived" | "all"
  semester?: number
  academicYear?: string
}

export interface CreateClassData {
  teacherId: number
  className: string
  semester: number
  academicYear: string
  schedule: ClassSchedule
  description?: string
}

export interface UpdateClassData {
  className?: string
  description?: string | null
  isActive?: boolean
  semester?: number
  academicYear?: string
  schedule?: ClassSchedule
  teacherId?: number
}

// ============ Enrollment Types ============

export interface EnrollmentFilterOptions extends PaginationOptions {
  search?: string
  classId?: number
  teacherId?: number
  studentId?: number
  semester?: number
  academicYear?: string
}

export interface AdminEnrollmentListItem {
  id: number
  studentId: number
  studentFirstName: string
  studentLastName: string
  studentEmail: string
  studentAvatarUrl: string | null
  studentIsActive: boolean
  classId: number
  className: string
  classCode: string
  classIsActive: boolean
  teacherId: number
  teacherName: string
  teacherAvatarUrl: string | null
  semester: number
  academicYear: string
  enrolledAt: string
}

export interface TransferStudentData {
  studentId: number
  fromClassId: number
  toClassId: number
}

// ============ Bulk Enrollment Types ============

export type BulkEnrollmentResultStatus = "enrolled" | "skipped" | "failed"

export interface BulkEnrollmentResultItem {
  studentId: number
  status: BulkEnrollmentResultStatus
  reason?: string
}

export interface BulkEnrollmentResult {
  summary: {
    total: number
    enrolled: number
    skipped: number
    failed: number
  }
  results: BulkEnrollmentResultItem[]
}

// ============ Analytics Types ============

export interface AdminStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalAdmins: number
  totalClasses: number
  activeClasses: number
  totalSubmissions: number
  totalPlagiarismReports: number
}

export interface ActivityItem {
  id: string
  type:
    | "user_registered"
    | "class_created"
    | "submission_made"
    | "plagiarism_analyzed"
  description: string
  user: string
  target: string
  timestamp: Date
}


