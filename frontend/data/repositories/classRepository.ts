import { apiClient } from "@/data/api/apiClient";
import type {
  Class,
  Assignment,
  EnrolledStudent,
} from "@/shared/types/class";
import type {
  CreateClassRequest,
  UpdateClassRequest,
  ClassDetailResponse,
  ClassListResponse,
  AssignmentListResponse,
  StudentListResponse,
  DeleteResponse,
  GenerateCodeResponse,
} from "@/data/api/types";

/**
 * Creates a new class
 */
export async function createClass(request: CreateClassRequest): Promise<Class> {
  const response = await apiClient.post<ClassDetailResponse>("/classes", request);

  if (response.error || !response.data?.success || !response.data.class) {
    throw new Error(
      response.error || response.data?.message || "Failed to create class",
    );
  }

  return response.data.class;
}

/**
 * Generates a unique class code
 */
export async function generateClassCode(): Promise<string> {
  const response = await apiClient.get<GenerateCodeResponse>(
    "/classes/generate-code",
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error ||
        response.data?.message ||
        "Failed to generate class code",
    );
  }

  return response.data.code;
}

/**
 * Fetches all classes for a teacher
 */
export async function getAllClasses(
  teacherId: number,
  activeOnly?: boolean,
): Promise<Class[]> {
  // Build query parameter for filtering active classes only
  // If activeOnly is defined (true or false), append it as a query parameter
  // Otherwise, use an empty string for no filtering
  const query = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : "";

  const response = await apiClient.get<ClassListResponse>(
    `/classes/teacher/${teacherId}${query}`,
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error || response.data?.message || "Failed to fetch classes",
    );
  }

  return response.data.classes;
}

/**
 * Fetches a class by ID
 */
export async function getClassById(
  classId: number,
  teacherId?: number,
): Promise<Class> {
  const url = teacherId
    ? `/classes/${classId}?teacherId=${teacherId}`
    : `/classes/${classId}`;
  const response = await apiClient.get<ClassDetailResponse>(url);

  if (response.error || !response.data?.success || !response.data.class) {
    throw new Error(
      response.error || response.data?.message || "Failed to fetch class",
    );
  }

  return response.data.class;
}

/**
 * Fetches all assignments for a class
 */
export async function getClassAssignments(
  classId: number,
): Promise<Assignment[]> {
  const response = await apiClient.get<AssignmentListResponse>(
    `/classes/${classId}/assignments`,
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error || response.data?.message || "Failed to fetch assignments",
    );
  }

  return response.data.assignments;
}

/**
 * Fetches all students enrolled in a class.
 * Returns raw API response without transformation.
 * Business layer should handle fullName computation.
 */
export async function getClassStudents(
  classId: number,
): Promise<EnrolledStudent[]> {
  const response = await apiClient.get<StudentListResponse>(
    `/classes/${classId}/students`,
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error || response.data?.message || "Failed to fetch students",
    );
  }

  // Return raw students without transformation
  return response.data.students;
}

/**
 * Deletes a class
 */
export async function deleteClass(
  classId: number,
  teacherId: number,
): Promise<void> {
  const response = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}`,
    { teacherId },
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error || response.data?.message || "Failed to delete class",
    );
  }
}

/**
 * Updates a class
 */
export async function updateClass(
  classId: number,
  request: UpdateClassRequest,
): Promise<Class> {
  const response = await apiClient.put<{
    success: boolean;
    message?: string;
    classInfo?: Class;
  }>(`/classes/${classId}`, request);

  if (response.error || !response.data?.success || !response.data.classInfo) {
    throw new Error(
      response.error || response.data?.message || "Failed to update class",
    );
  }

  return response.data.classInfo;
}

/**
 * Removes a student from a class
 */
export async function removeStudent(
  classId: number,
  studentId: number,
  teacherId: number,
): Promise<void> {
  const response = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}/students/${studentId}?teacherId=${teacherId}`,
  );

  if (response.error || !response.data?.success) {
    throw new Error(
      response.error || response.data?.message || "Failed to remove student",
    );
  }
}
