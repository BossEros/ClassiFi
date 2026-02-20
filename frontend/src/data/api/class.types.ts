import type { Schedule, Class, Assignment, EnrolledStudent } from "@/shared/types/class"

/** Base class fields shared across all class representations */
interface ClassBase {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  isActive: boolean
  createdAt: string
  teacherName?: string
  yearLevel: number
  semester: number
  academicYear: string
  schedule: Schedule
}

/** Class DTO for API responses - includes optional aggregate counts */
export interface ClassDTO extends ClassBase {
  studentCount?: number
  assignmentCount?: number
}

/** Task/Assignment DTO for API responses */
export interface TaskDTO {
  id: number
  classId: number
  assignmentName: string
  instructions: string | null
  instructionsImageUrl?: string | null
  className?: string
  deadline: string | null
  programmingLanguage: string
  hasSubmitted?: boolean
  submissionCount?: number
  studentCount?: number
}

/** Class response - no aggregate counters */
export type ClassResponse = ClassBase

export interface CreateClassRequest {
  teacherId: number
  className: string
  description?: string
  classCode: string
  yearLevel: 1 | 2 | 3 | 4
  semester: 1 | 2
  academicYear: string
  schedule: Schedule
}

export interface UpdateClassRequest {
  teacherId: number
  className?: string
  description?: string
  isActive?: boolean
  yearLevel?: 1 | 2 | 3 | 4
  semester?: 1 | 2
  academicYear?: string
  schedule?: Schedule
}

export interface CreateClassResponse {
  success: boolean
  message?: string
  class?: ClassDTO
}

export interface JoinClassResponse {
  success: boolean
  message: string
  classInfo?: ClassDTO
}

export interface LeaveClassResponse {
  success: boolean
  message: string
}

/** Response for a single class detail operation */
export interface ClassDetailResponse {
  success: boolean
  message?: string
  class?: Class
}

/** Response for class list operations */
export interface ClassListResponse {
  success: boolean
  message?: string
  classes: Class[]
}

/** Response for assignment list operations */
export interface AssignmentListResponse {
  success: boolean
  message?: string
  assignments: Assignment[]
}

/** Response for student list operations */
export interface StudentListResponse {
  success: boolean
  message?: string
  students: EnrolledStudent[]
}

/** Generic delete operation response */
export interface DeleteResponse {
  success: boolean
  message?: string
}

/** Response for class code generation */
export interface GenerateCodeResponse {
  success: boolean
  message?: string
  code: string
}
