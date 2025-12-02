/**
 * Teacher Dashboard Service
 * Business logic for the teacher dashboard.
 */

import * as dashboardRepository from '../../data/repositories/dashboard/teacherDashboardRepository'
import type { DashboardData, Class, Task } from '../models/dashboard/types'

/**
 * Fetches complete dashboard data for a teacher
 *
 * @param teacherId - ID of the teacher
 * @returns Dashboard data with recent classes and pending tasks
 */
export async function getDashboardData(teacherId: number): Promise<DashboardData> {
  try {
    return await dashboardRepository.getDashboardData(teacherId)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}

/**
 * Fetches recent classes for a teacher
 *
 * @param teacherId - ID of the teacher
 * @param limit - Maximum number of classes to return (default: 5)
 * @returns List of recent classes
 */
export async function getRecentClasses(teacherId: number, limit: number = 5): Promise<Class[]> {
  try {
    return await dashboardRepository.getRecentClasses(teacherId, limit)
  } catch (error) {
    console.error('Error fetching recent classes:', error)
    throw error
  }
}

/**
 * Fetches pending tasks for a teacher
 *
 * @param teacherId - ID of the teacher
 * @param limit - Maximum number of tasks to return (default: 10)
 * @returns List of pending tasks
 */
export async function getPendingTasks(teacherId: number, limit: number = 10): Promise<Task[]> {
  try {
    return await dashboardRepository.getPendingTasks(teacherId, limit)
  } catch (error) {
    console.error('Error fetching pending tasks:', error)
    throw error
  }
}
