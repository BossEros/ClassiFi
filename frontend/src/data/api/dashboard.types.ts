import type { ClassDTO, TaskDTO, ClassResponse } from "@/data/api/class.types"
export type { ClassResponse } from "@/data/api/class.types"

export interface DashboardResponse {
  success: boolean
  message?: string
  recentClasses: ClassDTO[]
  pendingTasks: TaskDTO[]
}

export interface StudentDashboardData {
  enrolledClasses: ClassDTO[]
  pendingAssignments: TaskDTO[]
}

/** Class response from teacher dashboard API */
export interface TeacherDashboardClassResponse {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  isActive: boolean
  createdAt: string
}

/** Task/Assignment response from teacher dashboard API */
export interface TeacherDashboardTaskResponse {
  id: number
  classId: number
  assignmentName: string
  instructions: string | null
  instructionsImageUrl?: string | null
  programmingLanguage: string
  deadline: string | null
  allowResubmission: boolean
  isActive: boolean
  createdAt: string
  className?: string
  submissionCount?: number
}

/** Complete teacher dashboard response */
export interface TeacherDashboardResponse {
  success: boolean
  message?: string
  recentClasses: TeacherDashboardClassResponse[]
  pendingTasks: TeacherDashboardTaskResponse[]
}

/** Teacher dashboard class list response */
export interface TeacherDashboardClassListResponse {
  success: boolean
  message?: string
  classes: TeacherDashboardClassResponse[]
}

/** Teacher dashboard task list response */
export interface TeacherDashboardTaskListResponse {
  success: boolean
  message?: string
  tasks: TeacherDashboardTaskResponse[]
}

export interface AssignmentResponse {
  id: number
  classId: number
  assignmentName: string
  instructions: string | null
  instructionsImageUrl?: string | null
  programmingLanguage: string
  deadline: string | null
  allowResubmission: boolean
  isActive: boolean
  createdAt: string
  className?: string
  hasSubmitted?: boolean
}

export interface StudentDashboardBackendResponse {
  success: boolean
  message?: string
  enrolledClasses: ClassResponse[]
  pendingAssignments: AssignmentResponse[]
}
