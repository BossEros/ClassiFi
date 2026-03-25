import type { DayOfWeek, EnrolledStudent } from "@/shared/types/class"
import type { UserRole } from "@/shared/types/auth"

export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "student" | "teacher" | "admin"
}

export interface AdminClassSchedule {
  days: DayOfWeek[]
  startTime: string
  endTime: string
}

export interface AdminClass {
  id: number
  className: string
  classCode: string
  teacherId: number
  semester: number
  academicYear: string
  schedule: AdminClassSchedule
  description: string | null
  isActive: boolean
  studentCount: number
  createdAt: string
  teacherName: string
  teacherEmail?: string | null
  teacherAvatarUrl?: string | null
}

export interface CreateClassData {
  teacherId: number
  className: string
  semester: number
  academicYear: string
  schedule: AdminClassSchedule
  description?: string
}

export interface UpdateClassData {
  className?: string
  description?: string | null
  isActive?: boolean
  semester?: number
  academicYear?: string
  schedule?: AdminClassSchedule
  teacherId?: number
}

export interface ClassAssignment {
  id: number
  title: string
  instructions: string
  deadline: string | null
  createdAt: string
  submissionCount: number
}

export interface AdminEnrollmentRecord {
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
  type: string
  description: string
  user: string
  target: string
  timestamp: string
}

export interface AdminResponse {
  success: boolean
  message?: string
}

export interface AdminUserResponse extends AdminResponse {
  user?: AdminUser
}

export interface AdminUsersResponse extends AdminResponse {
  users?: AdminUser[]
}

export interface AdminClassResponse extends AdminResponse {
  class?: AdminClass
}

export interface AdminStatsResponse extends AdminResponse {
  stats?: AdminStats
}

export interface AdminActivityResponse extends AdminResponse {
  activity?: ActivityItem[]
}

export interface AdminTeachersResponse extends AdminResponse {
  teachers?: AdminUser[]
}

export interface AdminStudentsResponse extends AdminResponse {
  students?: EnrolledStudent[]
}

export interface AdminAssignmentsResponse extends AdminResponse {
  assignments?: ClassAssignment[]
}

export interface AdminEnrollmentResponse extends AdminResponse {
  enrollment?: AdminEnrollmentRecord
}

export interface AdminEnrollmentsResponse extends AdminResponse {
  enrollments?: AdminEnrollmentRecord[]
}

export interface PaginatedResponse<T> extends AdminResponse {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
