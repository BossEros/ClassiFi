import { apiClient, unwrapApiResponse } from "@/data/api/apiClient"
import type {
  ClassResponse,
  AssignmentResponse,
  StudentDashboardBackendResponse,
} from "@/data/api/dashboard.types"
import type {
  JoinClassResponse,
  LeaveClassResponse,
  ClassListResponse,
  AssignmentListResponse,
} from "@/data/api/class.types"

// Export response types for consumers
export type {
  StudentDashboardBackendResponse,
  ClassListResponse,
  AssignmentListResponse,
  JoinClassResponse,
  LeaveClassResponse,
  ClassResponse,
  AssignmentResponse,
}

export async function getCompleteDashboardDataForStudentId(
  studentId: number,
  maximumEnrolledClassesCount: number = 12,
  maximumPendingAssignmentsCount: number = 10,
): Promise<StudentDashboardBackendResponse> {
  const apiResponse = await apiClient.get<StudentDashboardBackendResponse>(
    `/student/dashboard/${studentId}?enrolledClassesLimit=${maximumEnrolledClassesCount}&pendingAssignmentsLimit=${maximumPendingAssignmentsCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch dashboard data")
}

export async function getAllEnrolledClassesForStudentId(
  studentId: number,
  maximumClassesCount?: number,
): Promise<ClassListResponse> {
  let apiUrl = `/student/dashboard/${studentId}/classes`
  if (maximumClassesCount) {
    apiUrl += `?limit=${maximumClassesCount}`
  }

  const apiResponse = await apiClient.get<ClassListResponse>(apiUrl)

  return unwrapApiResponse(apiResponse, "Failed to fetch enrolled classes")
}

export async function getAllPendingAssignmentsForStudentId(
  studentId: number,
  maximumAssignmentsCount: number = 10,
): Promise<AssignmentListResponse> {
  const apiResponse = await apiClient.get<AssignmentListResponse>(
    `/student/dashboard/${studentId}/assignments?limit=${maximumAssignmentsCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch pending assignments")
}

export async function enrollStudentInClassWithCode(
  studentId: number,
  classEnrollmentCode: string,
): Promise<JoinClassResponse> {
  const apiResponse = await apiClient.post<JoinClassResponse>(
    "/student/dashboard/join",
    {
      studentId,
      classCode: classEnrollmentCode,
    },
  )

  return unwrapApiResponse(apiResponse, "Failed to join class")
}

export async function unenrollStudentFromClassById(
  studentId: number,
  classId: number,
): Promise<LeaveClassResponse> {
  const apiResponse = await apiClient.post<LeaveClassResponse>(
    "/student/dashboard/leave",
    {
      studentId,
      classId,
    },
  )

  return unwrapApiResponse(apiResponse, "Failed to leave class")
}
