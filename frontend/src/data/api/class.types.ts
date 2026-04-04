import type { ComponentType } from "react"
import type { LatePenaltyConfig } from "@/data/api/gradebook.types"

export type ISODateString = string & { readonly __brand: "ISODateString" }

export function parseISODate(
  isoString: ISODateString | string | null | undefined,
): Date | null {
  if (!isoString) return null
  const date = new Date(isoString)
  return isNaN(date.getTime()) ? null : date
}

export function toISODateString(date: Date): ISODateString {
  return date.toISOString() as ISODateString
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

export interface Schedule {
  days: DayOfWeek[]
  startTime: string
  endTime: string
}

export interface Class {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  isActive: boolean
  createdAt: ISODateString
  teacherName?: string
  studentCount?: number
  assignmentCount?: number
  semester: number
  academicYear: string
  schedule: Schedule
}

export interface Assignment {
  id: number
  classId: number
  moduleId: number | null
  assignmentName: string
  className?: string
  deadline: ISODateString | null
  programmingLanguage: string
  hasSubmitted?: boolean
  submissionCount?: number
  studentCount?: number
  instructions?: string | null
  instructionsImageUrl?: string | null
  allowResubmission?: boolean
  isActive?: boolean
  createdAt?: ISODateString
  maxAttempts?: number | null
  templateCode?: string | null
  hasTemplateCode?: boolean
  totalScore?: number
  scheduledDate?: ISODateString | null
  allowLateSubmissions?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
  enableSimilarityPenalty?: boolean
  submittedAt?: ISODateString | null
  grade?: number | null
  maxGrade?: number
}

export type Task = Assignment

export interface Module {
  id: number
  classId: number
  name: string
  isPublished: boolean
  createdAt: ISODateString
  updatedAt: ISODateString
  assignments: Assignment[]
}

export interface EnrolledStudent {
  id: number
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  enrolledAt: ISODateString
  fullName?: string
}

export type AssignmentStatus = "pending" | "not-started" | "submitted" | "late"
export type AssignmentFilter = "all" | "pending" | "submitted"
export type ClassTab = "assignments" | "students" | "calendar" | "grades"

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
  semester: 1 | 2
  academicYear: string
  schedule: Schedule
}

export interface UpdateClassRequest {
  teacherId: number
  className?: string
  description?: string | null
  isActive?: boolean
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

/** Aggregated class detail data returned by the class service */
export interface ClassDetailData {
  classInfo: Class
  assignments: Task[]
  students: EnrolledStudent[]
}

/** Navigation item used in the sidebar */
export interface NavigationItem {
  id: string
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
}


