import { apiClient, unwrapApiResponse } from "@/data/api/apiClient"
import type { Class, Assignment, EnrolledStudent } from "@/data/api/class.types"
import type {
  CreateClassRequest,
  UpdateClassRequest,
  ClassDetailResponse,
  ClassListResponse,
  AssignmentListResponse,
  StudentListResponse,
  DeleteResponse,
  GenerateCodeResponse,
} from "@/data/api/class.types"

/**
 * Creates a new class by sending the class data to the backend API.
 *
 * @param newClassData - The data for the class to be created (name, code, schedule, etc.).
 * @returns The fully populated Class object returned by the API.
 * @throws Error if the API call fails or the created class is missing from the response.
 */
export async function createNewClass(
  newClassData: CreateClassRequest,
): Promise<Class> {
  const apiResponse = await apiClient.post<ClassDetailResponse>(
    "/classes",
    newClassData,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to create class", "class")
  const createdClass = data.class

  if (!createdClass) {
    throw new Error("Failed to create class: missing class")
  }

  return createdClass
}

/**
 * Requests a server-generated unique class enrollment code.
 * Used when the teacher creates a new class and needs a code for students to join.
 *
 * @returns A unique alphanumeric class code string.
 * @throws Error if the API call fails or the code is missing from the response.
 */
export async function generateUniqueClassCode(): Promise<string> {
  const apiResponse = await apiClient.get<GenerateCodeResponse>(
    "/classes/generate-code",
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to generate class code",
    "code",
  )

  return data.code
}

/**
 * Fetches all classes belonging to a specific teacher, optionally filtered to active classes only.
 *
 * @param teacherId - The unique identifier of the teacher.
 * @param shouldReturnActiveClassesOnly - If true, only active classes are returned. If undefined, all classes are returned.
 * @returns An array of Class objects for the given teacher.
 * @throws Error if the API call fails.
 */
export async function getAllClassesForTeacherId(
  teacherId: number,
  shouldReturnActiveClassesOnly?: boolean,
): Promise<Class[]> {
  const urlQueryString =
    shouldReturnActiveClassesOnly !== undefined
      ? `?activeOnly=${shouldReturnActiveClassesOnly}`
      : ""

  const apiResponse = await apiClient.get<ClassListResponse>(
    `/classes/teacher/${teacherId}${urlQueryString}`,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch classes",
    "classes",
  )

  return data.classes
}

/**
 * Fetches the full details of a single class by its ID.
 * Optionally scopes the request to a specific teacher for ownership validation.
 *
 * @param classId - The unique identifier of the class.
 * @param teacherId - Optional teacher ID to scope the query (used for ownership checks).
 * @returns The Class object with full detail.
 * @throws Error if the API call fails or the class is not found.
 */
export async function getClassDetailsById(
  classId: number,
  teacherId?: number,
): Promise<Class> {
  const apiUrl = teacherId
    ? `/classes/${classId}?teacherId=${teacherId}`
    : `/classes/${classId}`
  const apiResponse = await apiClient.get<ClassDetailResponse>(apiUrl)
  const data = unwrapApiResponse(apiResponse, "Failed to fetch class", "class")
  const classDetails = data.class

  if (!classDetails) {
    throw new Error("Failed to fetch class: missing class")
  }

  return classDetails
}

/**
 * Retrieves all assignments for a class, optionally filtered by student.
 *
 * @param {number} classId - The class identifier.
 * @param {number} [studentId] - Optional student identifier to filter assignments.
 * @returns {Promise<Assignment[]>} A promise resolving to an array of Assignment objects.
 */
export async function getAllAssignmentsForClassId(
  classId: number,
  studentId?: number,
): Promise<Assignment[]> {
  const assignmentApiUrl =
    studentId !== undefined
      ? `/classes/${classId}/assignments?studentId=${studentId}`
      : `/classes/${classId}/assignments`
  const apiResponse = await apiClient.get<AssignmentListResponse>(
    assignmentApiUrl,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch assignments",
    "assignments",
  )

  return data.assignments
}

/**
 * Fetches all students currently enrolled in a class.
 *
 * @param classId - The unique identifier of the class.
 * @returns An array of EnrolledStudent objects.
 * @throws Error if the API call fails.
 */
export async function getAllEnrolledStudentsForClassId(
  classId: number,
): Promise<EnrolledStudent[]> {
  const apiResponse = await apiClient.get<StudentListResponse>(
    `/classes/${classId}/students`,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch students",
    "students",
  )

  return data.students
}

/**
 * Permanently deletes a class. Requires the teacher's ID for authorization.
 *
 * @param classId - The unique identifier of the class to delete.
 * @param teacherId - The teacher's ID, used to verify ownership before deletion.
 * @throws Error if the API call fails.
 */
export async function deleteClassByIdForTeacher(
  classId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}?teacherId=${teacherId}`,
  )
  unwrapApiResponse(apiResponse, "Failed to delete class")
}

/**
 * Updates one or more fields of an existing class.
 *
 * @param classId - The unique identifier of the class to update.
 * @param updatedClassData - Partial or full class data with the fields to update.
 * @returns The updated Class object as returned by the API.
 * @throws Error if the API call fails or the updated class is missing from the response.
 */
export async function updateClassDetailsById(
  classId: number,
  updatedClassData: UpdateClassRequest,
): Promise<Class> {
  const apiResponse = await apiClient.put<ClassDetailResponse>(
    `/classes/${classId}`,
    updatedClassData,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to update class", "class")
  const updatedClass = data.class

  if (!updatedClass) {
    throw new Error("Failed to update class: missing class")
  }

  return updatedClass
}

/**
 * Removes a student from a class. Requires the teacher's ID for authorization.
 *
 * @param classId - The unique identifier of the class.
 * @param studentId - The unique identifier of the student to remove.
 * @param teacherId - The teacher's ID, used to verify ownership before the action.
 * @throws Error if the API call fails.
 */
export async function unenrollStudentFromClassByTeacher(
  classId: number,
  studentId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}/students/${studentId}?teacherId=${teacherId}`, 
  )
  unwrapApiResponse(apiResponse, "Failed to remove student")
}
