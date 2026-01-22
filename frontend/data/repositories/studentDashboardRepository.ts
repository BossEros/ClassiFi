import { apiClient } from "@/data/api/apiClient";
import type {
  ClassResponse,
  AssignmentResponse,
  StudentDashboardBackendResponse,
  JoinClassResponse,
  LeaveClassResponse,
} from "@/data/api/types";
import type {
  ClassListResponse,
  AssignmentListResponse,
} from "@/shared/types/class";

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

/**
 * Fetches complete dashboard data for a student
 * @returns Raw backend response data
 */
export async function getDashboardData(
  studentId: number,
  enrolledClassesLimit: number = 12,
  pendingAssignmentsLimit: number = 10,
): Promise<StudentDashboardBackendResponse> {
  const response = await apiClient.get<StudentDashboardBackendResponse>(
    `/student/dashboard/${studentId}?enrolledClassesLimit=${enrolledClassesLimit}&pendingAssignmentsLimit=${pendingAssignmentsLimit}`,
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch dashboard data");
  }

  return response.data;
}

/**
 * Fetches enrolled classes for a student
 * @returns Raw backend response data
 */
export async function getEnrolledClasses(
  studentId: number,
  limit?: number,
): Promise<ClassListResponse> {
  let url = `/student/dashboard/${studentId}/classes`;
  if (limit) {
    url += `?limit=${limit}`;
  }

  const response = await apiClient.get<ClassListResponse>(url);

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch enrolled classes");
  }

  return response.data;
}

/**
 * Fetches pending assignments for a student
 * @returns Raw backend response data
 */
export async function getPendingAssignments(
  studentId: number,
  limit: number = 10,
): Promise<AssignmentListResponse> {
  const response = await apiClient.get<AssignmentListResponse>(
    `/student/dashboard/${studentId}/assignments?limit=${limit}`,
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to fetch pending assignments");
  }

  return response.data;
}

/**
 * Join a class using a class code
 * @returns Raw backend response data
 */
export async function joinClass(
  studentId: number,
  classCode: string,
): Promise<JoinClassResponse> {
  const response = await apiClient.post<JoinClassResponse>(
    "/student/dashboard/join",
    {
      studentId,
      classCode,
    },
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to join class");
  }

  return response.data;
}

/**
 * Leave a class
 * @returns Raw backend response data
 */
export async function leaveClass(
  studentId: number,
  classId: number,
): Promise<LeaveClassResponse> {
  const response = await apiClient.post<LeaveClassResponse>(
    "/student/dashboard/leave",
    {
      studentId,
      classId,
    },
  );

  if (response.error || !response.data) {
    throw new Error(response.error || "Failed to leave class");
  }

  return response.data;
}
