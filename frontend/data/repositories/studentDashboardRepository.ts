import { apiClient } from '../api/apiClient'
import type { Class, Task } from '../../business/models/dashboard/types'

/**
 * Response types matching backend API
 */
interface StudentDashboardResponse {
  success: boolean
  message?: string
  enrolledClasses: Class[]
  pendingAssignments: Task[]
}

interface ClassListResponse {
  success: boolean
  message?: string
  classes: Class[]
}

interface AssignmentListResponse {
  success: boolean
  message?: string
  assignments: Task[]
}

interface JoinClassResponse {
  success: boolean
  message: string
  classInfo?: Class
}

interface LeaveClassResponse {
  success: boolean
  message: string
}

/**
 * Student dashboard data structure
 */
export interface StudentDashboardData {
  enrolledClasses: Class[]
  pendingAssignments: Task[]
}

/**
 * Fetches complete dashboard data for a student
 */
export async function getDashboardData(
  studentId: number,
  enrolledClassesLimit: number = 12,
  pendingAssignmentsLimit: number = 10
): Promise<StudentDashboardData> {
  const response = await apiClient.get<StudentDashboardResponse>(
    `/student/dashboard/${studentId}?enrolledClassesLimit=${enrolledClassesLimit}&pendingAssignmentsLimit=${pendingAssignmentsLimit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard data')
  }

  return {
    enrolledClasses: response.data.enrolledClasses,
    pendingAssignments: response.data.pendingAssignments
  }
}

/**
 * Fetches enrolled classes for a student
 */
export async function getEnrolledClasses(studentId: number, limit?: number): Promise<Class[]> {
  let url = `/student/dashboard/${studentId}/classes`
  if (limit) {
    url += `?limit=${limit}`
  }

  const response = await apiClient.get<ClassListResponse>(url)

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch enrolled classes')
  }

  return response.data.classes
}

/**
 * Fetches pending assignments for a student
 */
export async function getPendingAssignments(studentId: number, limit: number = 10): Promise<Task[]> {
  const response = await apiClient.get<AssignmentListResponse>(
    `/student/dashboard/${studentId}/assignments?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch pending assignments')
  }

  return response.data.assignments
}

/**
 * Join a class using a class code
 */
export async function joinClass(studentId: number, classCode: string): Promise<JoinClassResponse> {
  const response = await apiClient.post<JoinClassResponse>('/student/dashboard/join', {
    studentId,
    classCode
  })

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to join class'
    }
  }

  return response.data
}

/**
 * Leave a class
 */
export async function leaveClass(studentId: number, classId: number): Promise<LeaveClassResponse> {
  const response = await apiClient.post<LeaveClassResponse>('/student/dashboard/leave', {
    studentId,
    classId
  })

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to leave class'
    }
  }

  return response.data
}
