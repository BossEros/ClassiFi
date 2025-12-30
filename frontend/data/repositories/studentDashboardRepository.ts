import { apiClient } from '@/data/api/apiClient'

// ============================================================================
// Raw Backend Response Types (matching API shape exactly)
// ============================================================================

interface ClassResponse {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  isActive: boolean
  createdAt: string
  teacherName?: string
  // New fields
  yearLevel: number
  semester: number
  academicYear: string
  schedule: {
    days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]
    startTime: string
    endTime: string
  }
}

interface AssignmentResponse {
  id: number
  classId: number
  assignmentName: string
  description: string | null
  programmingLanguage: string
  deadline: string
  allowResubmission: boolean
  isActive: boolean
  createdAt: string
  className?: string
  hasSubmitted?: boolean
}

interface StudentDashboardBackendResponse {
  success: boolean
  message?: string
  enrolledClasses: ClassResponse[]
  pendingAssignments: AssignmentResponse[]
}

interface ClassListResponse {
  success: boolean
  message?: string
  classes: ClassResponse[]
}

interface AssignmentListResponse {
  success: boolean
  message?: string
  assignments: AssignmentResponse[]
}

interface JoinClassResponse {
  success: boolean
  message: string
  classInfo?: ClassResponse
}

interface LeaveClassResponse {
  success: boolean
  message: string
}

// ============================================================================
// Repository Functions (return raw API data)
// ============================================================================

/**
 * Fetches complete dashboard data for a student
 * @returns Raw backend response data
 */
export async function getDashboardData(
  studentId: number,
  enrolledClassesLimit: number = 12,
  pendingAssignmentsLimit: number = 10
): Promise<StudentDashboardBackendResponse> {
  const response = await apiClient.get<StudentDashboardBackendResponse>(
    `/student/dashboard/${studentId}?enrolledClassesLimit=${enrolledClassesLimit}&pendingAssignmentsLimit=${pendingAssignmentsLimit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard data')
  }

  return response.data
}

/**
 * Fetches enrolled classes for a student
 * @returns Raw backend response data
 */
export async function getEnrolledClasses(studentId: number, limit?: number): Promise<ClassListResponse> {
  let url = `/student/dashboard/${studentId}/classes`
  if (limit) {
    url += `?limit=${limit}`
  }

  const response = await apiClient.get<ClassListResponse>(url)

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch enrolled classes')
  }

  return response.data
}

/**
 * Fetches pending assignments for a student
 * @returns Raw backend response data
 */
export async function getPendingAssignments(studentId: number, limit: number = 10): Promise<AssignmentListResponse> {
  const response = await apiClient.get<AssignmentListResponse>(
    `/student/dashboard/${studentId}/assignments?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch pending assignments')
  }

  return response.data
}

/**
 * Join a class using a class code
 * @returns Raw backend response data
 */
export async function joinClass(studentId: number, classCode: string): Promise<JoinClassResponse> {
  const response = await apiClient.post<JoinClassResponse>('/student/dashboard/join', {
    studentId,
    classCode
  })

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to join class')
  }

  return response.data
}

/**
 * Leave a class
 * @returns Raw backend response data
 */
export async function leaveClass(studentId: number, classId: number): Promise<LeaveClassResponse> {
  const response = await apiClient.post<LeaveClassResponse>('/student/dashboard/leave', {
    studentId,
    classId
  })

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to leave class')
  }

  return response.data
}

// Export response types for consumers
export type {
  StudentDashboardBackendResponse,
  ClassListResponse,
  AssignmentListResponse,
  JoinClassResponse,
  LeaveClassResponse,
  ClassResponse,
  AssignmentResponse
}
