import { apiClient } from "@/data/api/apiClient"
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
} from "@/data/api/types"

export async function createNewClass(
  newClassData: CreateClassRequest,
): Promise<Class> {
  const apiResponse = await apiClient.post<ClassDetailResponse>(
    "/classes",
    newClassData,
  )

  if (
    apiResponse.error ||
    !apiResponse.data?.success ||
    !apiResponse.data.class
  ) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to create class",
    )
  }

  return apiResponse.data.class
}

export async function generateUniqueClassCode(): Promise<string> {
  const apiResponse = await apiClient.get<GenerateCodeResponse>(
    "/classes/generate-code",
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to generate class code",
    )
  }

  return apiResponse.data.code
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

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to fetch classes",
    )
  }

  return apiResponse.data.classes
}

export async function getClassDetailsById(
  classId: number,
  teacherId?: number,
): Promise<Class> {
  const apiUrl = teacherId
    ? `/classes/${classId}?teacherId=${teacherId}`
    : `/classes/${classId}`
  const apiResponse = await apiClient.get<ClassDetailResponse>(apiUrl)

  if (
    apiResponse.error ||
    !apiResponse.data?.success ||
    !apiResponse.data.class
  ) {
    throw new Error(
      apiResponse.error || apiResponse.data?.message || "Failed to fetch class",
    )
  }

  return apiResponse.data.class
}

export async function getAllAssignmentsForClassId(
  classId: number,
): Promise<Assignment[]> {
  const apiResponse = await apiClient.get<AssignmentListResponse>(
    `/classes/${classId}/assignments`,
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to fetch assignments",
    )
  }

  return apiResponse.data.assignments
}

export async function getAllEnrolledStudentsForClassId(
  classId: number,
): Promise<EnrolledStudent[]> {
  const apiResponse = await apiClient.get<StudentListResponse>(
    `/classes/${classId}/students`,
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to fetch students",
    )
  }

  return apiResponse.data.students
}

export async function deleteClassByIdForTeacher(
  classId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}?teacherId=${teacherId}`,
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to delete class",
    )
  }
}

export async function updateClassDetailsById(
  classId: number,
  updatedClassData: UpdateClassRequest,
): Promise<Class> {
  const apiResponse = await apiClient.put<{
    success: boolean
    message?: string
    classInfo?: Class
  }>(`/classes/${classId}`, updatedClassData)

  if (
    apiResponse.error ||
    !apiResponse.data?.success ||
    !apiResponse.data.classInfo
  ) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to update class",
    )
  }

  return apiResponse.data.classInfo
}

export async function unenrollStudentFromClassByTeacher(
  classId: number,
  studentId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/classes/${classId}/students/${studentId}?teacherId=${teacherId}`,
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to remove student",
    )
  }
}
