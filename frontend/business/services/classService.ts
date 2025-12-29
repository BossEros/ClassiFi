import * as classRepository from '@/data/repositories/classRepository'
import { validateCreateAssignmentData } from '../validation/assignmentValidation'
import type { Class, Assignment, EnrolledStudent, ClassDetailData } from '../models/dashboard/types'
import type { UpdateAssignmentRequest } from '../models/assignment/types'
import type {
  CreateClassRequest,
  UpdateClassRequest,
  CreateAssignmentRequest
} from '@/data/api/types'

/**
 * Creates a new class with validation
 *
 * @param request - Class creation data
 * @returns Created class data
 */
export async function createClass(request: CreateClassRequest): Promise<Class> {
  return await classRepository.createClass({
    teacherId: request.teacherId,
    className: request.className.trim(),
    description: request.description?.trim() || undefined
  })
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

// Re-export UpdateClassRequest from centralized types
export type { UpdateClassRequest } from '@/data/api/types'

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

  return await classRepository.updateClass(classId, {
    teacherId: request.teacherId,
    className: request.className?.trim(),
    description: request.description?.trim()
  })
}

/**
 * Creates a new assignment for a class with validation
 *
 * @param request - Assignment creation data (frontend format)
 * @returns Created assignment data
 */
export async function createAssignment(request: CreateAssignmentRequest): Promise<Assignment> {
  // Validate all fields
  const validation = validateCreateAssignmentData(request)

  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0]
    throw new Error(firstError)
  }

  // Validate IDs
  if (!request.classId || request.classId <= 0) {
    throw new Error('Invalid class ID')
  }

  if (!request.teacherId || request.teacherId <= 0) {
    throw new Error('Invalid teacher ID')
  }

  // Pass directly to repository (backend uses camelCase)
  return await classRepository.createAssignment(request.classId, {
    teacherId: request.teacherId,
    assignmentName: request.assignmentName.trim(),
    description: request.description.trim(),
    programmingLanguage: request.programmingLanguage,
    deadline: typeof request.deadline === 'string' ? request.deadline : request.deadline.toISOString(),
    allowResubmission: request.allowResubmission
  })
}

/**
 * Updates an assignment with validation
 *
 * @param assignmentId - ID of the assignment to update
 * @param request - Assignment update data (frontend format)
 * @returns Updated assignment data
 */
export async function updateAssignment(assignmentId: number, request: UpdateAssignmentRequest): Promise<Assignment> {
  if (!assignmentId || assignmentId <= 0) {
    throw new Error('Invalid assignment ID')
  }

  if (!request.teacherId || request.teacherId <= 0) {
    throw new Error('Invalid teacher ID')
  }

  // Validate fields if provided
  if (request.assignmentName !== undefined) {
    if (request.assignmentName.trim().length === 0) {
      throw new Error('Assignment title is required')
    }
    if (request.assignmentName.trim().length > 150) {
      throw new Error('Assignment title must be 150 characters or less')
    }
  }

  if (request.description !== undefined) {
    if (request.description.trim().length < 10) {
      throw new Error('Description must be at least 10 characters')
    }
  }

  if (request.deadline) {
    if (request.deadline <= new Date()) {
      throw new Error('Deadline must be in the future')
    }
  }

  // Pass directly to repository (backend uses camelCase)
  return await classRepository.updateAssignment(assignmentId, {
    teacherId: request.teacherId,
    assignmentName: request.assignmentName?.trim(),
    description: request.description?.trim(),
    programmingLanguage: request.programmingLanguage,
    deadline: request.deadline ? (typeof request.deadline === 'string' ? request.deadline : request.deadline.toISOString()) : undefined,
    allowResubmission: request.allowResubmission
  })
}

/**
 * Deletes an assignment
 *
 * @param assignmentId - ID of the assignment to delete
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function deleteAssignment(assignmentId: number, teacherId: number): Promise<void> {
  if (!assignmentId || assignmentId <= 0) {
    throw new Error('Invalid assignment ID')
  }

  if (!teacherId || teacherId <= 0) {
    throw new Error('Invalid teacher ID')
  }

  await classRepository.deleteAssignment(assignmentId, teacherId)
}

/**
 * Removes a student from a class
 *
 * @param classId - ID of the class
 * @param studentId - ID of the student to remove
 * @param teacherId - ID of the teacher (for authorization)
 */
export async function removeStudent(classId: number, studentId: number, teacherId: number): Promise<void> {
  if (!classId || classId <= 0) {
    throw new Error('Invalid class ID')
  }

  if (!studentId || studentId <= 0) {
    throw new Error('Invalid student ID')
  }

  if (!teacherId || teacherId <= 0) {
    throw new Error('Invalid teacher ID')
  }

  await classRepository.removeStudent(classId, studentId, teacherId)
}

