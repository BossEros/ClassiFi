/**
 * Student Dashboard Service
 * Part of the Business Logic Layer - Contains student dashboard business logic
 */

import * as dashboardRepository from '../../../data/repositories/dashboard/studentDashboardRepository'
import type { StudentDashboardData, JoinClassResponse } from '../../../data/repositories/dashboard/studentDashboardRepository'
import type { Class, Task } from '../../models/dashboard/types'

/**
 * Fetches complete dashboard data for a student
 *
 * @param studentId - ID of the student
 * @returns Dashboard data with enrolled classes and pending assignments
 */
export async function getDashboardData(studentId: number): Promise<StudentDashboardData> {
  try {
    return await dashboardRepository.getDashboardData(studentId)
  } catch (error) {
    console.error('Error fetching student dashboard data:', error)
    throw error
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
  try {
    return await dashboardRepository.getEnrolledClasses(studentId, limit)
  } catch (error) {
    console.error('Error fetching enrolled classes:', error)
    throw error
  }
}

/**
 * Fetches pending assignments for a student
 *
 * @param studentId - ID of the student
 * @param limit - Maximum number of assignments to return (default: 10)
 * @returns List of pending assignments
 */
export async function getPendingAssignments(studentId: number, limit: number = 10): Promise<Task[]> {
  try {
    return await dashboardRepository.getPendingAssignments(studentId, limit)
  } catch (error) {
    console.error('Error fetching pending assignments:', error)
    throw error
  }
}

/**
 * Join a class using a class code
 *
 * @param studentId - ID of the student
 * @param classCode - Unique class code to join
 * @returns Join class response with success status and class info
 */
export async function joinClass(studentId: number, classCode: string): Promise<JoinClassResponse> {
  try {
    // Validate class code format (6-8 alphanumeric characters)
    const codeRegex = /^[A-Za-z0-9]{6,8}$/
    if (!codeRegex.test(classCode)) {
      return {
        success: false,
        message: 'Invalid class code format. Please enter a 6-8 character alphanumeric code.'
      }
    }

    return await dashboardRepository.joinClass(studentId, classCode)
  } catch (error) {
    console.error('Error joining class:', error)
    return {
      success: false,
      message: 'Failed to join class. Please try again.'
    }
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
  try {
    return await dashboardRepository.leaveClass(studentId, classId)
  } catch (error) {
    console.error('Error leaving class:', error)
    return {
      success: false,
      message: 'Failed to leave class. Please try again.'
    }
  }
}
