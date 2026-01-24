import { apiClient } from '@/data/api/apiClient'
import type {
  TeacherDashboardResponse,
  TeacherDashboardClassListResponse,
  TeacherDashboardTaskListResponse,
} from '@/data/api/types'

// Export response types for consumers
export type {
  TeacherDashboardResponse,
  TeacherDashboardClassListResponse,
  TeacherDashboardTaskListResponse,
}

// ============================================================================
// Repository Functions (return raw API data)
// ============================================================================

/**
 * Fetches complete dashboard data for a teacher
 * @returns Raw backend response data
 */
export async function getDashboardData(
  teacherId: number,
  recentClassesLimit: number = 12,
  pendingTasksLimit: number = 10
): Promise<TeacherDashboardResponse> {
  const response = await apiClient.get<TeacherDashboardResponse>(
    `/teacher/dashboard/${teacherId}?recentClassesLimit=${recentClassesLimit}&pendingTasksLimit=${pendingTasksLimit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch dashboard data')
  }

  return response.data
}

/**
 * Fetches recent classes for a teacher
 * @returns Raw backend response data
 */
export async function getRecentClasses(teacherId: number, limit: number = 5): Promise<TeacherDashboardClassListResponse> {
  const response = await apiClient.get<TeacherDashboardClassListResponse>(
    `/teacher/dashboard/${teacherId}/classes?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch recent classes')
  }

  return response.data
}

/**
 * Fetches pending tasks for a teacher
 * @returns Raw backend response data
 */
export async function getPendingTasks(teacherId: number, limit: number = 10): Promise<TeacherDashboardTaskListResponse> {
  const response = await apiClient.get<TeacherDashboardTaskListResponse>(
    `/teacher/dashboard/${teacherId}/tasks?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch pending tasks')
  }

  return response.data
}

