import { apiClient } from '../api/apiClient'
import type { Class, Assignment, EnrolledStudent } from '../../business/models/dashboard/types'
import type {
  CreateClassRequest,
  UpdateClassRequest,
  CreateAssignmentRequest,
  UpdateAssignmentRequest
} from '../api/types'

/**
 * Internal response types (not exported - only used within this repository)
 */
interface ClassResponse {
  success: boolean
  message?: string
  class?: Class
}

interface ClassListResponse {
  success: boolean
  message?: string
  classes: Class[]
}

interface AssignmentListResponse {
  success: boolean
  message?: string
  assignments: Assignment[]
}

// Backend response type (does not include fullName - we compute it on the frontend)
interface StudentBackendResponse {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string | null
  enrolledAt?: string
}

interface StudentListResponse {
  success: boolean
  message?: string
  students: StudentBackendResponse[]
}

interface DeleteResponse {
  success: boolean
  message?: string
}

interface GenerateCodeResponse {
  success: boolean
  code: string
  message?: string
}


/**
 * Creates a new class
 */
export async function createClass(request: CreateClassRequest): Promise<Class> {
  const response = await apiClient.post<ClassResponse>('/classes', request)

  if (response.error || !response.data?.success || !response.data.class) {
    throw new Error(response.error || response.data?.message || 'Failed to create class')
  }

  return response.data.class
}

/**
 * Generates a unique class code
 */
export async function generateClassCode(): Promise<string> {
  const response = await apiClient.get<GenerateCodeResponse>('/classes/generate-code')

  if (response.error || !response.data?.success) {
    throw new Error(response.error || response.data?.message || 'Failed to generate class code')
  }

  return response.data.code
}

/**
 * Fetches all classes for a teacher
 */
export async function getAllClasses(teacherId: number, activeOnly?: boolean): Promise<Class[]> {
  const query = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : ''
  const response = await apiClient.get<ClassListResponse>(`/classes/teacher/${teacherId}${query}`)

  if (response.error || !response.data?.success) {
    throw new Error(response.error || response.data?.message || 'Failed to fetch classes')
  }

  return response.data.classes
}

/**
 * Fetches a class by ID
 */
export async function getClassById(classId: number, teacherId?: number): Promise<Class> {
  const url = teacherId ? `/classes/${classId}?teacherId=${teacherId}` : `/classes/${classId}`
  const response = await apiClient.get<ClassResponse>(url)

  if (response.error || !response.data?.success || !response.data.class) {
    throw new Error(response.error || response.data?.message || 'Failed to fetch class')
  }

  return response.data.class
}

/**
 * Fetches all assignments for a class
 */
export async function getClassAssignments(classId: number): Promise<Assignment[]> {
  const response = await apiClient.get<AssignmentListResponse>(`/classes/${classId}/assignments`)

  if (response.error || !response.data?.success) {
    throw new Error(response.error || response.data?.message || 'Failed to fetch assignments')
  }

  return response.data.assignments
}

/**
 * Fetches all students enrolled in a class
 * Transforms backend response to include computed fullName
 */
export async function getClassStudents(classId: number): Promise<EnrolledStudent[]> {
  const response = await apiClient.get<StudentListResponse>(`/classes/${classId}/students`)

  if (response.error || !response.data?.success) {
    throw new Error(response.error || response.data?.message || 'Failed to fetch students')
  }

  // Transform backend response to include computed fullName
  return response.data.students.map(student => ({
    ...student,
    fullName: `${student.firstName} ${student.lastName}`.trim()
  }))
}

/**
 * Deletes a class
 */
export async function deleteClass(classId: number, teacherId: number): Promise<void> {
  const response = await apiClient.delete<DeleteResponse>(`/classes/${classId}`, { teacherId })

  if (response.error || !response.data?.success) {
    throw new Error(response.error || response.data?.message || 'Failed to delete class')
  }
}

/**
 * Updates a class
 */
export async function updateClass(classId: number, request: UpdateClassRequest): Promise<Class> {
  const response = await apiClient.put<{ success: boolean; message?: string; classInfo?: Class }>(`/classes/${classId}`, request)

  if (response.error || !response.data?.success || !response.data.classInfo) {
    throw new Error(response.error || response.data?.message || 'Failed to update class')
  }

  return response.data.classInfo
}

/**
 * Creates a new assignment for a class
 */
export async function createAssignment(classId: number, request: Omit<CreateAssignmentRequest, 'classId'>): Promise<Assignment> {
  const response = await apiClient.post<{ success: boolean; message?: string; assignment?: Assignment }>(
    `/classes/${classId}/assignments`,
    request
  )

  if (response.error || !response.data?.success || !response.data.assignment) {
    throw new Error(response.error || response.data?.message || 'Failed to create assignment')
  }

  return response.data.assignment
}

/**
 * Updates an assignment
 */
export async function updateAssignment(assignmentId: number, request: UpdateAssignmentRequest): Promise<Assignment> {
  const response = await apiClient.put<{ success: boolean; message?: string; assignment?: Assignment }>(
    `/assignments/${assignmentId}`,
    request
  )

  if (response.error || !response.data?.success || !response.data.assignment) {
    throw new Error(response.error || response.data?.message || 'Failed to update assignment')
  }

  return response.data.assignment
}

/**
 * Deletes an assignment
 */
export async function deleteAssignment(assignmentId: number, teacherId: number): Promise<void> {
  const response = await apiClient.delete<DeleteResponse>(`/assignments/${assignmentId}?teacherId=${teacherId}`)

  if (response.error || !response.data?.success) {
    throw new Error(response.error || response.data?.message || 'Failed to delete assignment')
  }
}

/**
 * Removes a student from a class
 */
export async function removeStudent(classId: number, studentId: number, teacherId: number): Promise<void> {
  const response = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}/students/${studentId}?teacherId=${teacherId}`
  )

  if (response.error || !response.data?.success) {
    throw new Error(response.error || response.data?.message || 'Failed to remove student')
  }
}
