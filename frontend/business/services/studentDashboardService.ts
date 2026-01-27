import type {
  StudentDashboardBackendResponse,
  JoinClassResponse,
} from "@/data/repositories/studentDashboardRepository";
import * as dashboardRepository from "@/data/repositories/studentDashboardRepository";
import { validateClassJoinCode } from "@/business/validation/classValidation";

/**
 * Fetches the complete dashboard overview for a specific student.
 * Aggregates data including enrolled classes and pending assignments.
 *
 * @param studentId - The unique identifier of the student.
 * @returns The comprehensive student dashboard data.
 * @throws Error if the dashboard data cannot be retrieved.
 */
export async function getDashboardData(
  studentId: number,
): Promise<StudentDashboardBackendResponse> {
  try {
    return await dashboardRepository.getCompleteDashboardDataForStudentId(studentId);
  } catch (error) {
    console.error("Error fetching student dashboard data:", error);
    throw error;
  }
}

/**
 * Retrieves a list of classes the student is currently enrolled in.
 *
 * @param studentId - The unique identifier of the student.
 * @param limit - Optional limit to the number of classes returned (e.g., for widget display).
 * @returns A list of enrolled classes.
 * @throws Error if the class list cannot be fetched.
 */
export async function getEnrolledClasses(
  studentId: number,
  limit?: number,
): Promise<dashboardRepository.ClassListResponse> {
  try {
    return await dashboardRepository.getAllEnrolledClassesForStudentId(studentId, limit);
  } catch (error) {
    console.error("Error fetching enrolled classes:", error);
    throw error;
  }
}

/**
 * Retrieves a list of pending assignments for the student.
 *
 * @param studentId - The unique identifier of the student.
 * @param limit - The maximum number of assignments to return (defaults to 10).
 * @returns A list of pending assignments sorted by deadline.
 * @throws Error if the assignments cannot be fetched.
 */
export async function getPendingAssignments(
  studentId: number,
  limit: number = 10,
): Promise<dashboardRepository.AssignmentListResponse> {
  try {
    return await dashboardRepository.getAllPendingAssignmentsForStudentId(studentId, limit);
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    throw error;
  }
}

/**
 * Attempts to enroll a student in a class using a unique class code.
 * Validates the class code format before attempting to join.
 *
 * @param studentId - The unique identifier of the student.
 * @param classCode - The unique 6-8 character alphanumeric code for the class.
 * @returns The response indicating success or failure with a message.
 */
export async function joinClass(
  studentId: number,
  classCode: string,
): Promise<JoinClassResponse> {
  try {
    // Validate class code format (6-8 alphanumeric characters)
    const codeError = validateClassJoinCode(classCode);

    if (codeError) {
      return {
        success: false,
        message: codeError,
      };
    }

    return await dashboardRepository.enrollStudentInClassWithCode(studentId, classCode);
  } catch (error) {
    console.error("Error joining class:", error);

    return {
      success: false,
      message: "Failed to join class. Please try again.",
    };
  }
}

/**
 * Unenrolls a student from a specific class.
 *
 * @param studentId - The unique identifier of the student.
 * @param classId - The unique identifier of the class to leave.
 * @returns A promise resolving to a success boolean and message.
 */
export async function leaveClass(
  studentId: number,
  classId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    return await dashboardRepository.unenrollStudentFromClassById(studentId, classId);
  } catch (error) {
    console.error("Error leaving class:", error);
    
    return {
      success: false,
      message: "Failed to leave class. Please try again.",
    };
  }
}
