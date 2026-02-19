import type { UserRole } from "@/modules/users/user.repository.js"
import type { ClassSchedule } from "@/models/index.js"

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
  yearLevel?: number
  semester?: number
  academicYear?: string
}

export interface CreateClassData {
  teacherId: number
  className: string
  yearLevel: number
  semester: number
  academicYear: string
  schedule: ClassSchedule
  description?: string
}

export interface UpdateClassData {
  className?: string
  description?: string | null
  isActive?: boolean
  yearLevel?: number
  semester?: number
  academicYear?: string
  schedule?: ClassSchedule
  teacherId?: number
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
