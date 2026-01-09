import * as dashboardRepository from '@/data/repositories/teacherDashboardRepository'
import type { DashboardData, Class, Task } from '@/business/models/dashboard/types'

/**
 * Fetches complete dashboard data for a teacher
 *
 * @param teacherId - ID of the teacher
 * @returns Dashboard data with recent classes and pending tasks
 */
export async function getDashboardData(teacherId: number): Promise<DashboardData> {
  try {
    const response = await dashboardRepository.getDashboardData(teacherId)
    return {
      recentClasses: response.recentClasses as unknown as Class[],
      pendingTasks: response.pendingTasks as unknown as Task[]
    }
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
    const response = await dashboardRepository.getRecentClasses(teacherId, limit)
    return response.classes as unknown as Class[]
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
    const response = await dashboardRepository.getPendingTasks(teacherId, limit)
    return response.tasks as unknown as Task[]
  } catch (error) {
    console.error('Error fetching pending tasks:', error)
    throw error
  }
}
