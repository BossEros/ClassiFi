import type { LatePenaltyConfig } from "@/shared/types/gradebook"

// ============================================================================
// Class/Dashboard Types - Shared Layer
// ============================================================================

/**
 * Branded type for ISO 8601 date strings.
 * Use this for all date fields received from APIs to ensure type consistency.
 *
 * @example
 * // API responses return ISODateString
 * const deadline: ISODateString = "2024-12-31T23:59:59.000Z";
 *
 * // Convert to Date when needed for calculations/display
 * const date = parseISODate(deadline);
 */
export type ISODateString = string & { readonly __brand: "ISODateString" }

/**
 * Parse an ISO date string to a Date object.
 * Use this utility at consumption points when Date operations are needed.
 */
export function parseISODate(
  isoString: ISODateString | string | null | undefined,
): Date | null {
  if (!isoString) return null
  const date = new Date(isoString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Convert a Date to an ISO date string.
 * Use this when sending dates to the API.
 */
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

/**
 * Class entity
 */
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
  yearLevel: number
  semester: number
  academicYear: string
  schedule: Schedule
}

/**
 * Assignment/Task entity
 */
export interface Assignment {
  id: number
  classId: number
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
  submittedAt?: ISODateString | null
  grade?: number | null
  maxGrade?: number
}

/** Alias for Assignment */
export type Task = Assignment

/**
 * Enrolled student in a class
 */
export interface EnrolledStudent {
  id: number
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
  enrolledAt: ISODateString
  fullName?: string
}

// ============================================================================
// Class Detail View Types
// ============================================================================

/**
 * Assignment status for filtering and display
 */
export type AssignmentStatus = "pending" | "not-started" | "submitted" | "late"

/**
 * Assignment filter options
 */
export type AssignmentFilter = "all" | "pending" | "submitted"

/**
 * Class detail page tab options
 */
export type ClassTab = "assignments" | "students" | "calendar" | "grades"
