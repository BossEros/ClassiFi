import { apiClient } from "@/data/api/apiClient";
import type {
  ClassResponse,
  AssignmentResponse,
  StudentDashboardBackendResponse,
  JoinClassResponse,
  LeaveClassResponse,
  ClassListResponse,
  AssignmentListResponse,
} from "@/data/api/types";

// Export response types for consumers
export type {
  StudentDashboardBackendResponse,
  ClassListResponse,
  AssignmentListResponse,
  JoinClassResponse,
  LeaveClassResponse,
  ClassResponse,
  AssignmentResponse,
};

export async function getCompleteDashboardDataForStudentId(
  studentId: number,
  maximumEnrolledClassesCount: number = 12,
  maximumPendingAssignmentsCount: number = 10,
): Promise<StudentDashboardBackendResponse> {
  const apiResponse = await apiClient.get<StudentDashboardBackendResponse>(
    `/student/dashboard/${studentId}?enrolledClassesLimit=${maximumEnrolledClassesCount}&pendingAssignmentsLimit=${maximumPendingAssignmentsCount}`,
  );

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || "Failed to fetch dashboard data");
  }

  return apiResponse.data;
}

export async function getAllEnrolledClassesForStudentId(
  studentId: number,
  maximumClassesCount?: number,
): Promise<ClassListResponse> {
  let apiUrl = `/student/dashboard/${studentId}/classes`;
  if (maximumClassesCount) {
    apiUrl += `?limit=${maximumClassesCount}`;
  }

  const apiResponse = await apiClient.get<ClassListResponse>(apiUrl);

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || "Failed to fetch enrolled classes");
  }

  return apiResponse.data;
}

export async function getAllPendingAssignmentsForStudentId(
  studentId: number,
  maximumAssignmentsCount: number = 10,
): Promise<AssignmentListResponse> {
  const apiResponse = await apiClient.get<AssignmentListResponse>(
    `/student/dashboard/${studentId}/assignments?limit=${maximumAssignmentsCount}`,
  );

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || "Failed to fetch pending assignments");
  }

  return apiResponse.data;
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
  );

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || "Failed to join class");
  }

  return apiResponse.data;
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
  );

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || "Failed to leave class");
  }

  return apiResponse.data;
}
