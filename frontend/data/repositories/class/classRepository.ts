/**
 * Class Repository
 * Part of the Data Access Layer - Handles API calls for classes
 */

import { apiClient } from '../../api/apiClient'
import type { Class, Assignment, EnrolledStudent } from '../../../business/models/dashboard/types'

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
 * Backend response structure for class creation
 */
interface CreateClassBackendResponse {
  success: boolean
  message?: string
  class_info: BackendClass
}

/**
 * Backend response structure for generate code
 */
interface GenerateCodeBackendResponse {
  success: boolean
  code: string
  message?: string
}

/**
 * Backend response structure for class list
 */
interface ClassListBackendResponse {
  success: boolean
  message?: string
  classes: BackendClass[]
}

/**
 * Request structure for creating a class
 */
export interface CreateClassRequest {
  teacher_id: number
  class_name: string
  description?: string
  class_code?: string
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
    studentCount: backendClass.student_count || 0,
    createdAt: backendClass.created_at ? new Date(backendClass.created_at) : undefined
  }
}

/**
 * Creates a new class
 *
 * @param request - Class creation data
 * @returns Created class data
 */
export async function createClass(request: CreateClassRequest): Promise<Class> {
  const response = await apiClient.post<CreateClassBackendResponse>(
    '/classes',
    request
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to create class')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create class')
  }

  return transformClassResponse(response.data.class_info)
}

/**
 * Generates a unique class code from the backend
 *
 * @returns Generated unique class code
 */
export async function generateClassCode(): Promise<string> {
  const response = await apiClient.get<GenerateCodeBackendResponse>(
    '/classes/generate-code'
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to generate class code')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to generate class code')
  }

  return response.data.code
}

/**
 * Fetches all classes for a teacher
 *
 * @param teacherId - ID of the teacher
 * @returns List of all classes
 */
export async function getAllClasses(teacherId: number): Promise<Class[]> {
  const response = await apiClient.get<ClassListBackendResponse>(
    `/classes/teacher/${teacherId}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch classes')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch classes')
  }

  return response.data.classes.map(transformClassResponse)
}

/**
 * Backend assignment data structure (snake_case from API)
 */
interface BackendAssignment {
  id: number
  title: string
  description: string
  programming_language: string
  deadline?: string
  allow_resubmission: boolean
  is_checked: boolean
  created_at?: string
}

/**
 * Backend student data structure (snake_case from API)
 */
interface BackendStudent {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  enrolled_at?: string
}

/**
 * Backend response structure for class detail
 */
interface ClassDetailBackendResponse {
  success: boolean
  message?: string
  class_info: BackendClass
}

/**
 * Backend response structure for assignments list
 */
interface AssignmentListBackendResponse {
  success: boolean
  message?: string
  assignments: BackendAssignment[]
}

/**
 * Backend response structure for students list
 */
interface StudentListBackendResponse {
  success: boolean
  message?: string
  students: BackendStudent[]
}

/**
 * Backend response structure for delete operation
 */
interface DeleteClassBackendResponse {
  success: boolean
  message?: string
}

/**
 * Backend response structure for update operation
 */
interface UpdateClassBackendResponse {
  success: boolean
  message?: string
  class_info: BackendClass
}

/**
 * Request structure for updating a class
 */
export interface UpdateClassBackendRequest {
  teacher_id: number
  class_name?: string
  description?: string
}

/**
 * Request structure for creating an assignment (backend format)
 */
export interface CreateAssignmentBackendRequest {
  class_id: number
  teacher_id: number
  assignment_name: string
  description: string
  programming_language: 'python' | 'java'
  deadline: string  // ISO string
  allow_resubmission: boolean
}

/**
 * Backend response structure for assignment creation
 */
interface CreateAssignmentBackendResponse {
  success: boolean
  message?: string
  assignment?: BackendAssignment
}

/**
 * Request structure for updating an assignment (backend format)
 */
export interface UpdateAssignmentBackendRequest {
  teacher_id: number
  assignment_name?: string
  description?: string
  programming_language?: 'python' | 'java'
  deadline?: string
  allow_resubmission?: boolean
}

/**
 * Backend response structure for assignment update
 */
interface UpdateAssignmentBackendResponse {
  success: boolean
  message?: string
  assignment?: BackendAssignment
}

/**
 * Backend response structure for assignment deletion
 */
interface DeleteAssignmentBackendResponse {
  success: boolean
  message?: string
}

/**
 * Transforms backend assignment response to frontend Assignment interface
 */
function transformAssignmentResponse(backendAssignment: BackendAssignment): Assignment {
  return {
    id: backendAssignment.id,
    title: backendAssignment.title,
    description: backendAssignment.description,
    programmingLanguage: backendAssignment.programming_language,
    deadline: backendAssignment.deadline ? new Date(backendAssignment.deadline) : new Date(),
    allowResubmission: backendAssignment.allow_resubmission,
    isChecked: backendAssignment.is_checked,
    createdAt: backendAssignment.created_at ? new Date(backendAssignment.created_at) : undefined
  }
}

/**
 * Transforms backend student response to frontend EnrolledStudent interface
 */
function transformStudentResponse(backendStudent: BackendStudent): EnrolledStudent {
  return {
    id: backendStudent.id,
    username: backendStudent.username,
    email: backendStudent.email,
    firstName: backendStudent.first_name,
    lastName: backendStudent.last_name,
    fullName: backendStudent.full_name,
    enrolledAt: backendStudent.enrolled_at ? new Date(backendStudent.enrolled_at) : undefined
  }
}

/**
 * Fetches a class by ID
 *
 * @param classId - ID of the class
 * @param teacherId - Optional teacher ID for authorization
 * @returns Class data
 */
export async function getClassById(classId: number, teacherId?: number): Promise<Class> {
  const url = teacherId
    ? `/classes/${classId}?teacher_id=${teacherId}`
    : `/classes/${classId}`

  const response = await apiClient.get<ClassDetailBackendResponse>(url)

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch class')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch class')
  }

  return transformClassResponse(response.data.class_info)
}

/**
 * Fetches all assignments for a class
 *
 * @param classId - ID of the class
 * @returns List of assignments
 */
export async function getClassAssignments(classId: number): Promise<Assignment[]> {
  const response = await apiClient.get<AssignmentListBackendResponse>(
    `/classes/${classId}/assignments`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch assignments')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch assignments')
  }

  return response.data.assignments.map(transformAssignmentResponse)
}

/**
 * Fetches all students enrolled in a class
 *
 * @param classId - ID of the class
 * @returns List of enrolled students
 */
export async function getClassStudents(classId: number): Promise<EnrolledStudent[]> {
  const response = await apiClient.get<StudentListBackendResponse>(
    `/classes/${classId}/students`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch students')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch students')
  }

  return response.data.students.map(transformStudentResponse)
}

/**
 * Deletes a class permanently (hard delete with cascade)
 *
 * @param classId - ID of the class to delete
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function deleteClass(classId: number, teacherId: number): Promise<void> {
  const response = await apiClient.delete<DeleteClassBackendResponse>(
    `/classes/${classId}`,
    { teacher_id: teacherId }
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to delete class')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete class')
  }
}

/**
 * Updates a class
 *
 * @param classId - ID of the class to update
 * @param request - Update data
 * @returns Updated class data
 */
export async function updateClass(classId: number, request: UpdateClassBackendRequest): Promise<Class> {
  const response = await apiClient.put<UpdateClassBackendResponse>(
    `/classes/${classId}`,
    request
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to update class')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update class')
  }

  return transformClassResponse(response.data.class_info)
}

/**
 * Creates a new assignment for a class
 *
 * @param classId - ID of the class
 * @param request - Assignment creation data (backend format)
 * @returns Created assignment data
 */
export async function createAssignment(
  classId: number,
  request: CreateAssignmentBackendRequest
): Promise<Assignment> {
  const response = await apiClient.post<CreateAssignmentBackendResponse>(
    `/classes/${classId}/assignments`,
    request
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to create assignment')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create assignment')
  }

  if (!response.data.assignment) {
    throw new Error('No assignment data returned')
  }

  return transformAssignmentResponse(response.data.assignment)
}

/**
 * Updates an assignment
 *
 * @param assignmentId - ID of the assignment to update
 * @param request - Assignment update data (backend format)
 * @returns Updated assignment data
 */
export async function updateAssignment(
  assignmentId: number,
  request: UpdateAssignmentBackendRequest
): Promise<Assignment> {
  const response = await apiClient.put<UpdateAssignmentBackendResponse>(
    `/assignments/${assignmentId}`,
    request
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to update assignment')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update assignment')
  }

  if (!response.data.assignment) {
    throw new Error('No assignment data returned')
  }

  return transformAssignmentResponse(response.data.assignment)
}

/**
 * Deletes an assignment
 *
 * @param assignmentId - ID of the assignment to delete
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function deleteAssignment(assignmentId: number, teacherId: number): Promise<void> {
  const response = await apiClient.delete<DeleteAssignmentBackendResponse>(
    `/assignments/${assignmentId}?teacher_id=${teacherId}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to delete assignment')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete assignment')
  }
}

/**
 * Removes a student from a class
 *
 * @param classId - ID of the class
 * @param studentId - ID of the student to remove
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function removeStudent(classId: number, studentId: number, teacherId: number): Promise<void> {
  const response = await apiClient.delete<{ success: boolean; message?: string }>(
    `/classes/${classId}/students/${studentId}?teacher_id=${teacherId}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to remove student')
  }

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to remove student')
  }
}

