import { apiClient } from '../api/apiClient'
import type { DashboardData, Class, Task } from '../../business/models/dashboard/types'

/**
 * Response types matching backend API
 */
interface TeacherDashboardResponse {
  success: boolean
  message?: string
  recentClasses: Class[]
  pendingTasks: Task[]
}

interface ClassListResponse {
  success: boolean
  message?: string
  classes: Class[]
}

interface TaskListResponse {
  success: boolean
  message?: string
  tasks: Task[]
}

/**
 * Fetches complete dashboard data for a teacher
 */
export async function getDashboardData(
  teacherId: number,
  recentClassesLimit: number = 12,
  pendingTasksLimit: number = 10
): Promise<DashboardData> {
  const response = await apiClient.get<TeacherDashboardResponse>(
    `/teacher/dashboard/${teacherId}?recentClassesLimit=${recentClassesLimit}&pendingTasksLimit=${pendingTasksLimit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard data')
  }

  return {
    recentClasses: response.data.recentClasses,
    pendingTasks: response.data.pendingTasks
  }
}

/**
 * Fetches recent classes for a teacher
 */
export async function getRecentClasses(teacherId: number, limit: number = 5): Promise<Class[]> {
  const response = await apiClient.get<ClassListResponse>(
    `/teacher/dashboard/${teacherId}/classes?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch recent classes')
  }

  return response.data.classes
}

/**
 * Fetches pending tasks for a teacher
 */
export async function getPendingTasks(teacherId: number, limit: number = 10): Promise<Task[]> {
  const response = await apiClient.get<TaskListResponse>(
    `/teacher/dashboard/${teacherId}/tasks?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch pending tasks')
  }

  return response.data.tasks
}
