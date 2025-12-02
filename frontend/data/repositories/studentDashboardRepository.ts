import { apiClient } from '../api/apiClient'
import type { Class, Task } from '../../business/models/dashboard/types'

/**
 * Backend class data structure (snake_case from API)
 */
interface BackendClass {
  id: number
  name: string
  code: string
  description?: string
  student_count?: number
  created_at?: string
}

/**
 * Backend assignment data structure (snake_case from API)
 */
interface BackendAssignment {
  id: number
  title: string
  description?: string
  class_id: number
  class_name: string
  programming_language: string
  deadline: string
  allow_resubmission: boolean
  created_at?: string
}

/**
 * Backend response structure for student dashboard data
 */
interface StudentDashboardBackendResponse {
  success: boolean
  message?: string
  enrolled_classes: BackendClass[]
  pending_assignments: BackendAssignment[]
}

/**
 * Backend response structure for join class
 */
interface JoinClassBackendResponse {
  success: boolean
  message: string
  class_info?: BackendClass
}

/**
 * Student dashboard data structure
 */
export interface StudentDashboardData {
  enrolledClasses: Class[]
  pendingAssignments: Task[]
}

/**
 * Join class response structure
 */
export interface JoinClassResponse {
  success: boolean
  message: string
  classInfo?: Class
}

/**
 * Transforms backend class response (snake_case) to frontend Class interface (camelCase)
 */
function transformClassResponse(backendClass: BackendClass): Class {
  return {
    id: backendClass.id,
    name: backendClass.name,
    code: backendClass.code,
    description: backendClass.description,
    studentCount: backendClass.student_count ?? 0,
    createdAt: backendClass.created_at ? new Date(backendClass.created_at) : undefined
  }
}

/**
 * Transforms backend assignment response (snake_case) to frontend Task interface (camelCase)
 */
function transformAssignmentResponse(backendAssignment: BackendAssignment): Task {
  return {
    id: backendAssignment.id,
    title: backendAssignment.title,
    description: backendAssignment.description ?? '',
    classId: backendAssignment.class_id,
    className: backendAssignment.class_name,
    programmingLanguage: backendAssignment.programming_language,
    deadline: new Date(backendAssignment.deadline),
    allowResubmission: backendAssignment.allow_resubmission,
    createdAt: backendAssignment.created_at ? new Date(backendAssignment.created_at) : undefined
  }
}

/**
 * Fetches complete dashboard data for a student
 *
 * @param studentId - ID of the student
 * @param enrolledClassesLimit - Maximum number of enrolled classes to return (default: 12)
 * @param pendingAssignmentsLimit - Maximum number of pending assignments to return (default: 10)
 * @returns Dashboard data with enrolled classes and pending assignments
 */
export async function getDashboardData(
  studentId: number,
  enrolledClassesLimit: number = 12,
  pendingAssignmentsLimit: number = 10
): Promise<StudentDashboardData> {
  const response = await apiClient.get<StudentDashboardBackendResponse>(
    `/student/dashboard/${studentId}?enrolled_classes_limit=${enrolledClassesLimit}&pending_assignments_limit=${pendingAssignmentsLimit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard data')
  }

  const data = response.data

  return {
    enrolledClasses: data.enrolled_classes.map(transformClassResponse),
    pendingAssignments: data.pending_assignments.map(transformAssignmentResponse)
  }
}

/**
 * Fetches enrolled classes for a student
 *
 * @param studentId - ID of the student
 * @param limit - Maximum number of classes to return
 * @returns List of enrolled classes
 */
export async function getEnrolledClasses(studentId: number, limit?: number): Promise<Class[]> {
  let url = `/student/dashboard/${studentId}/classes`
  if (limit) {
    url += `?limit=${limit}`
  }

  const response = await apiClient.get<{ success: boolean; message?: string; classes: BackendClass[] }>(url)

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch enrolled classes')
  }

  return response.data.classes.map(transformClassResponse)
}

/**
 * Fetches pending assignments for a student
 *
 * @param studentId - ID of the student
 * @param limit - Maximum number of assignments to return
 * @returns List of pending assignments
 */
export async function getPendingAssignments(studentId: number, limit: number = 10): Promise<Task[]> {
  const response = await apiClient.get<{ success: boolean; message?: string; assignments: BackendAssignment[] }>(
    `/student/dashboard/${studentId}/assignments?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch pending assignments')
  }

  return response.data.assignments.map(transformAssignmentResponse)
}

/**
 * Join a class using a class code
 *
 * @param studentId - ID of the student
 * @param classCode - Unique class code to join
 * @returns Join class response with success status and class info
 */
export async function joinClass(studentId: number, classCode: string): Promise<JoinClassResponse> {
  const response = await apiClient.post<JoinClassBackendResponse>('/student/dashboard/join', {
    student_id: studentId,
    class_code: classCode
  })

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to join class'
    }
  }

  const data = response.data

  return {
    success: data.success,
    message: data.message,
    classInfo: data.class_info ? transformClassResponse(data.class_info) : undefined
  }
}

/**
 * Leave a class
 *
 * @param studentId - ID of the student
 * @param classId - ID of the class to leave
 * @returns Leave class response with success status
 */
export async function leaveClass(studentId: number, classId: number): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post<{ success: boolean; message: string }>('/student/dashboard/leave', {
    student_id: studentId,
    class_id: classId
  })

  if (response.error || !response.data) {
    return {
      success: false,
      message: response.error || 'Failed to leave class'
    }
  }

  return response.data
}
