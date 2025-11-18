/**
 * Class Service
 * Part of the Business Logic Layer - Contains class business logic
 */

import * as classRepository from '../../../data/repositories/class/classRepository'
import type { Class } from '../../models/dashboard/types'

/**
 * Request structure for creating a class (frontend format)
 */
export interface CreateClassRequest {
  teacherId: number
  className: string
  description?: string
  classCode?: string
}

/**
 * Creates a new class with validation
 *
 * @param request - Class creation data
 * @returns Created class data
 */
export async function createClass(request: CreateClassRequest): Promise<Class> {
  // Validate class name
  if (!request.className || request.className.trim().length === 0) {
    throw new Error('Class name is required')
  }

  if (request.className.trim().length > 100) {
    throw new Error('Class name must be 100 characters or less')
  }

  // Validate description if provided
  if (request.description && request.description.length > 1000) {
    throw new Error('Description must be 1000 characters or less')
  }

  // Transform frontend format to backend format
  const backendRequest: classRepository.CreateClassRequest = {
    teacher_id: request.teacherId,
    class_name: request.className.trim(),
    description: request.description?.trim() || undefined,
    class_code: request.classCode || undefined
  }

  return await classRepository.createClass(backendRequest)
}

/**
 * Fetches all classes for a teacher
 *
 * @param teacherId - ID of the teacher
 * @returns List of all classes
 */
export async function getAllClasses(teacherId: number): Promise<Class[]> {
  if (!teacherId || teacherId <= 0) {
    throw new Error('Invalid teacher ID')
  }

  return await classRepository.getAllClasses(teacherId)
}

