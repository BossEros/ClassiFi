import { apiClient } from '@/data/api/apiClient'

interface ClassResponse {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  isActive: boolean
  createdAt: string
}

interface TaskResponse {
  id: number
  classId: number
  assignmentName: string
  description: string | null
  programmingLanguage: string
  deadline: string
  allowResubmission: boolean
  isActive: boolean
  createdAt: string
  className?: string
  submissionCount?: number
}

interface TeacherDashboardResponse {
  success: boolean
  message?: string
  recentClasses: ClassResponse[]
  pendingTasks: TaskResponse[]
}

interface ClassListResponse {
  success: boolean
  message?: string
  classes: ClassResponse[]
}

interface TaskListResponse {
  success: boolean
  message?: string
  tasks: TaskResponse[]
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
export async function getRecentClasses(teacherId: number, limit: number = 5): Promise<ClassListResponse> {
  const response = await apiClient.get<ClassListResponse>(
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
export async function getPendingTasks(teacherId: number, limit: number = 10): Promise<TaskListResponse> {
  const response = await apiClient.get<TaskListResponse>(
    `/teacher/dashboard/${teacherId}/tasks?limit=${limit}`
  )

  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch pending tasks')
  }

  return response.data
}

// Export response types for consumers
export type { TeacherDashboardResponse, ClassListResponse, TaskListResponse, ClassResponse, TaskResponse }
