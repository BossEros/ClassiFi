export type {
  DayOfWeek,
  Schedule,
  Class,
  Assignment,
  Task,
  EnrolledStudent,
  AssignmentStatus,
  AssignmentFilter,
  ClassTab,
} from "@/shared/types/class"

import type { Class, Task, EnrolledStudent } from "@/shared/types/class"

export interface ClassDetailResponse {
  success: boolean
  message?: string
  class?: Class
}

export interface ClassListResponse {
  success: boolean
  message?: string
  classes: Class[]
}

export interface AssignmentListResponse {
  success: boolean
  message?: string
  assignments: Task[]
}

export interface StudentListResponse {
  success: boolean
  message?: string
  students: EnrolledStudent[]
}

export interface DeleteResponse {
  success: boolean
  message?: string
}

export interface GenerateCodeResponse {
  success: boolean
  classCode?: string
}

export interface ClassDetailData {
  classInfo: Class
  assignments: Task[]
  students: EnrolledStudent[]
}

export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

export interface DashboardStats {
  totalClasses?: number
  totalTasks?: number
  pendingTasks?: number
  totalStudents?: number
}

export interface DashboardData {
  recentClasses: Class[]
  pendingTasks: Task[]
}

export interface StudentBackendResponse {
  id: number
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  enrolledAt?: string
}
