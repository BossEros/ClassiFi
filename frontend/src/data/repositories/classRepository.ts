import { apiClient, unwrapApiResponse } from "@/data/api/apiClient"
import type { Class, Assignment, EnrolledStudent } from "@/shared/types/class"
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

export async function deleteClassByIdForTeacher(
  classId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}?teacherId=${teacherId}`,
  )
  unwrapApiResponse(apiResponse, "Failed to delete class")
}

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
