/**
 * Class Repository
 * Part of the Data Access Layer - Handles API calls for classes
 */

import { apiClient } from '../../api/apiClient'
import type { Class } from '../../../business/models/dashboard/types'

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
  class: BackendClass
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

  return transformClassResponse(response.data.class)
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

