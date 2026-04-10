import { apiClient, unwrapApiResponse } from "@/data/api/apiClient"
import type {
  TeacherDashboardResponse,
  TeacherDashboardClassListResponse,
  TeacherDashboardTaskListResponse,
} from "@/data/api/dashboard.types"

export interface TeacherAllAssignmentsResponse {
  success: boolean
  message?: string
  assignments: {
    id: number
    assignmentName: string
    className: string
    classId: number
    deadline: string | null
    submissionCount: number
    totalStudents: number
    programmingLanguage: string
  }[]
}

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
 * Fetches the complete teacher dashboard payload with recent classes and pending tasks.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @param maximumRecentClassesCount - Maximum number of recent classes to include.
 * @param maximumPendingTasksCount - Maximum number of pending tasks to include.
 * @returns Dashboard response for the teacher homepage.
 */
export async function getCompleteDashboardDataForTeacherId(
  teacherId: number,
  maximumRecentClassesCount: number = 12,
  maximumPendingTasksCount: number = 10,
): Promise<TeacherDashboardResponse> {
  const apiResponse = await apiClient.get<TeacherDashboardResponse>(
    `/teacher/dashboard/${teacherId}?recentClassesLimit=${maximumRecentClassesCount}&pendingTasksLimit=${maximumPendingTasksCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch dashboard data")
}

/**
 * Retrieves a limited list of the teacher's most recent classes.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @param maximumClassesCount - Maximum number of classes to return.
 * @returns Response containing recent class cards for dashboard display.
 */
export async function getRecentClassesForTeacherId(
  teacherId: number,
  maximumClassesCount: number = 5,
): Promise<TeacherDashboardClassListResponse> {
  const apiResponse = await apiClient.get<TeacherDashboardClassListResponse>(
    `/teacher/dashboard/${teacherId}/classes?limit=${maximumClassesCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch recent classes")
}

/**
 * Retrieves pending tasks that require teacher action.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @param maximumTasksCount - Maximum number of pending tasks to return.
 * @returns Response containing pending dashboard tasks.
 */
export async function getPendingTasksForTeacherId(
  teacherId: number,
  maximumTasksCount: number = 10,
): Promise<TeacherDashboardTaskListResponse> {
  const apiResponse = await apiClient.get<TeacherDashboardTaskListResponse>(
    `/teacher/dashboard/${teacherId}/tasks?limit=${maximumTasksCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch pending tasks")
}

/**
 * Retrieves all assignments for a teacher across all active classes.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @returns Response containing all teacher assignments with submission counts.
 */
export async function getAllAssignmentsForTeacherId(
  teacherId: number,
): Promise<TeacherAllAssignmentsResponse> {
  const apiResponse = await apiClient.get<TeacherAllAssignmentsResponse>(
    `/teacher/dashboard/${teacherId}/assignments`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch all assignments")
}
