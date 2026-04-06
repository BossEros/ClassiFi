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

/**
 * Fetches the full student dashboard payload, including enrolled classes and pending assignments.
 *
 * @param studentId - The unique identifier of the student.
 * @param maximumEnrolledClassesCount - Maximum number of classes to include.
 * @param maximumPendingAssignmentsCount - Maximum number of pending assignments to include.
 * @returns Combined dashboard data for the student homepage.
 */
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

/**
 * Retrieves all classes where the student is currently enrolled.
 *
 * @param studentId - The unique identifier of the student.
 * @param maximumClassesCount - Optional limit for number of classes returned.
 * @returns Class list response for the student's enrollments.
 */
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

/**
 * Retrieves pending assignments for the student across enrolled classes.
 *
 * @param studentId - The unique identifier of the student.
 * @param maximumAssignmentsCount - Maximum number of pending assignments to return.
 * @returns Assignment list response containing pending work.
 */
export async function getAllPendingAssignmentsForStudentId(
  studentId: number,
  maximumAssignmentsCount: number = 10,
): Promise<AssignmentListResponse> {
  const apiResponse = await apiClient.get<AssignmentListResponse>(
    `/student/dashboard/${studentId}/assignments?limit=${maximumAssignmentsCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch pending assignments")
}

/**
 * Enrolls a student into a class using a class enrollment code.
 *
 * @param studentId - The unique identifier of the student.
 * @param classEnrollmentCode - The code used to join the class.
 * @returns Join class response with operation status and class info.
 */
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

/**
 * Unenrolls a student from a specific class.
 *
 * @param studentId - The unique identifier of the student.
 * @param classId - The unique identifier of the class to leave.
 * @returns Leave class response describing the outcome.
 */
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
