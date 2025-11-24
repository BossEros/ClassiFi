/**
 * Class Service
 * Part of the Business Logic Layer - Contains class business logic
 */

import * as classRepository from '../../../data/repositories/class/classRepository'
import type { Class, Assignment, EnrolledStudent, ClassDetailData } from '../../models/dashboard/types'

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
 * Generates a unique class code from the backend
 *
 * @returns Generated unique class code
 */
export async function generateClassCode(): Promise<string> {
  return await classRepository.generateClassCode()
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

/**
 * Fetches a class by ID
 *
 * @param classId - ID of the class
 * @param teacherId - Optional teacher ID for authorization
 * @returns Class data
 */
export async function getClassById(classId: number, teacherId?: number): Promise<Class> {
  if (!classId || classId <= 0) {
    throw new Error('Invalid class ID')
  }

  return await classRepository.getClassById(classId, teacherId)
}

/**
 * Fetches all assignments for a class
 *
 * @param classId - ID of the class
 * @returns List of assignments
 */
export async function getClassAssignments(classId: number): Promise<Assignment[]> {
  if (!classId || classId <= 0) {
    throw new Error('Invalid class ID')
  }

  return await classRepository.getClassAssignments(classId)
}

/**
 * Fetches all students enrolled in a class
 *
 * @param classId - ID of the class
 * @returns List of enrolled students
 */
export async function getClassStudents(classId: number): Promise<EnrolledStudent[]> {
  if (!classId || classId <= 0) {
    throw new Error('Invalid class ID')
  }

  return await classRepository.getClassStudents(classId)
}

/**
 * Fetches complete class detail data (class info, assignments, and students)
 *
 * @param classId - ID of the class
 * @param teacherId - Optional teacher ID for authorization
 * @returns Complete class detail data
 */
export async function getClassDetailData(classId: number, teacherId?: number): Promise<ClassDetailData> {
  if (!classId || classId <= 0) {
    throw new Error('Invalid class ID')
  }

  // Fetch all data in parallel for better performance
  const [classInfo, assignments, students] = await Promise.all([
    classRepository.getClassById(classId, teacherId),
    classRepository.getClassAssignments(classId),
    classRepository.getClassStudents(classId)
  ])

  return {
    classInfo,
    assignments,
    students
  }
}

/**
 * Deletes a class permanently (hard delete with cascade)
 *
 * @param classId - ID of the class to delete
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function deleteClass(classId: number, teacherId: number): Promise<void> {
  if (!classId || classId <= 0) {
    throw new Error('Invalid class ID')
  }

  if (!teacherId || teacherId <= 0) {
    throw new Error('Invalid teacher ID')
  }

  await classRepository.deleteClass(classId, teacherId)
}

/**
 * Request structure for updating a class (frontend format)
 */
export interface UpdateClassRequest {
  teacherId: number
  className?: string
  description?: string
}

/**
 * Updates a class with validation
 *
 * @param classId - ID of the class to update
 * @param request - Update data
 * @returns Updated class data
 */
export async function updateClass(classId: number, request: UpdateClassRequest): Promise<Class> {
  if (!classId || classId <= 0) {
    throw new Error('Invalid class ID')
  }

  if (!request.teacherId || request.teacherId <= 0) {
    throw new Error('Invalid teacher ID')
  }

  // Validate class name if provided
  if (request.className !== undefined) {
    if (request.className.trim().length === 0) {
      throw new Error('Class name cannot be empty')
    }
    if (request.className.trim().length > 100) {
      throw new Error('Class name must be 100 characters or less')
    }
  }

  // Validate description if provided
  if (request.description && request.description.length > 1000) {
    throw new Error('Description must be 1000 characters or less')
  }

  // Transform frontend format to backend format
  const backendRequest: classRepository.UpdateClassBackendRequest = {
    teacher_id: request.teacherId,
    class_name: request.className?.trim(),
    description: request.description?.trim()
  }

  return await classRepository.updateClass(classId, backendRequest)
}

