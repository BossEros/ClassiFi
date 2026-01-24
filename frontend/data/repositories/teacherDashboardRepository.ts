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

export async function getCompleteDashboardDataForTeacherId(
  teacherId: number,
  maximumRecentClassesCount: number = 12,
  maximumPendingTasksCount: number = 10
): Promise<TeacherDashboardResponse> {
  const apiResponse = await apiClient.get<TeacherDashboardResponse>(
    `/teacher/dashboard/${teacherId}?recentClassesLimit=${maximumRecentClassesCount}&pendingTasksLimit=${maximumPendingTasksCount}`
  )

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || 'Failed to fetch dashboard data')
  }

  return apiResponse.data
}

export async function getRecentClassesForTeacherId(teacherId: number, maximumClassesCount: number = 5): Promise<TeacherDashboardClassListResponse> {
  const apiResponse = await apiClient.get<TeacherDashboardClassListResponse>(
    `/teacher/dashboard/${teacherId}/classes?limit=${maximumClassesCount}`
  )

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || 'Failed to fetch recent classes')
  }

  return apiResponse.data
}

export async function getPendingTasksForTeacherId(teacherId: number, maximumTasksCount: number = 10): Promise<TeacherDashboardTaskListResponse> {
  const apiResponse = await apiClient.get<TeacherDashboardTaskListResponse>(
    `/teacher/dashboard/${teacherId}/tasks?limit=${maximumTasksCount}`
  )

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || 'Failed to fetch pending tasks')
  }

  return apiResponse.data
}

