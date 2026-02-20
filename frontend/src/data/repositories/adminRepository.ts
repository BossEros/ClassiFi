import { apiClient } from "@/data/api/apiClient"
import type {
  AdminUser,
  AdminClass,
  PaginatedResponse,
  CreateUserData,
  CreateClassData,
  UpdateClassData,
  AdminResponse,
  AdminUserResponse,
  AdminClassResponse,
  AdminStatsResponse,
  AdminActivityResponse,
  AdminStudentsResponse,
  AdminAssignmentsResponse,
  AdminTeachersResponse,
} from "@/data/api/admin.types"

// ============ User Management ============

export async function getAllUsersWithPaginationAndFilters(filterOptions: {
  pageNumber?: number
  itemsPerPage?: number
  searchQuery?: string
  userRole?: string
  accountStatus?: string
}): Promise<PaginatedResponse<AdminUser>> {
  const urlQueryParams = new URLSearchParams()

  if (filterOptions.pageNumber)
    urlQueryParams.set("page", filterOptions.pageNumber.toString())
  if (filterOptions.itemsPerPage)
    urlQueryParams.set("limit", filterOptions.itemsPerPage.toString())
  if (filterOptions.searchQuery)
    urlQueryParams.set("search", filterOptions.searchQuery)
  if (filterOptions.userRole) urlQueryParams.set("role", filterOptions.userRole)
  if (filterOptions.accountStatus)
    urlQueryParams.set("status", filterOptions.accountStatus)

  const apiResponse = await apiClient.get<PaginatedResponse<AdminUser>>(
    `/admin/users?${urlQueryParams.toString()}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function getAdminUserDetailsById(
  userId: number,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.get<AdminUserResponse>(
    `/admin/users/${userId}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function createNewUserAccount(
  newUserData: CreateUserData,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.post<AdminUserResponse>(
    `/admin/users`,
    newUserData,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function updateUserRoleById(
  userId: number,
  newUserRole: string,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/role`,
    { role: newUserRole },
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function updateUserPersonalDetailsById(
  userId: number,
  updatedPersonalDetails: { firstName?: string; lastName?: string },
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/details`,
    updatedPersonalDetails,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function updateUserEmailAddressById(
  userId: number,
  newEmailAddress: string,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/email`,
    { email: newEmailAddress },
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function toggleUserAccountStatusById(
  userId: number,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/status`,
    {},
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function deleteUserAccountById(
  userId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/users/${userId}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

// ============ Analytics ============

export async function getAdminDashboardStatistics(): Promise<AdminStatsResponse> {
  const apiResponse = await apiClient.get<AdminStatsResponse>("/admin/stats")

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function getRecentAdminActivityLog(
  maximumActivityCount: number = 10,
): Promise<AdminActivityResponse> {
  const apiResponse = await apiClient.get<AdminActivityResponse>(
    `/admin/activity?limit=${maximumActivityCount}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

// ============ Class Management ============

export async function getAllClassesWithPaginationAndFilters(filterOptions: {
  pageNumber?: number
  itemsPerPage?: number
  searchQuery?: string
  teacherId?: number
  classStatus?: string
  yearLevel?: number
  semesterNumber?: number
  academicYear?: string
}): Promise<PaginatedResponse<AdminClass>> {
  const urlQueryParams = new URLSearchParams()

  if (filterOptions.pageNumber)
    urlQueryParams.set("page", filterOptions.pageNumber.toString())
  if (filterOptions.itemsPerPage)
    urlQueryParams.set("limit", filterOptions.itemsPerPage.toString())
  if (filterOptions.searchQuery)
    urlQueryParams.set("search", filterOptions.searchQuery)
  if (filterOptions.teacherId)
    urlQueryParams.set("teacherId", filterOptions.teacherId.toString())
  if (filterOptions.classStatus)
    urlQueryParams.set("status", filterOptions.classStatus)
  if (filterOptions.yearLevel)
    urlQueryParams.set("yearLevel", filterOptions.yearLevel.toString())
  if (filterOptions.semesterNumber)
    urlQueryParams.set("semester", filterOptions.semesterNumber.toString())
  if (filterOptions.academicYear)
    urlQueryParams.set("academicYear", filterOptions.academicYear)

  const apiResponse = await apiClient.get<PaginatedResponse<AdminClass>>(
    `/admin/classes?${urlQueryParams.toString()}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function getAdminClassDetailsById(
  classId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.get<AdminClassResponse>(
    `/admin/classes/${classId}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function createNewClass(
  newClassData: CreateClassData,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.post<AdminClassResponse>(
    "/admin/classes",
    newClassData,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function updateClassDetailsById(
  classId: number,
  updatedClassData: UpdateClassData,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.put<AdminClassResponse>(
    `/admin/classes/${classId}`,
    updatedClassData,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function deleteClassById(classId: number): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function reassignClassTeacherById(
  classId: number,
  newTeacherId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.patch<AdminClassResponse>(
    `/admin/classes/${classId}/reassign`,
    { teacherId: newTeacherId },
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function archiveClassById(
  classId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.patch<AdminClassResponse>(
    `/admin/classes/${classId}/archive`,
    {},
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function getAllTeacherAccounts(): Promise<AdminTeachersResponse> {
  const apiResponse = await apiClient.get<AdminTeachersResponse>(
    "/admin/users/teachers",
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

// ============ Class Enrollment Management ============

export async function getEnrolledStudentsInClassById(
  classId: number,
): Promise<AdminStudentsResponse> {
  const apiResponse = await apiClient.get<AdminStudentsResponse>(
    `/admin/classes/${classId}/students`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function getAllAssignmentsInClassById(
  classId: number,
): Promise<AdminAssignmentsResponse> {
  const apiResponse = await apiClient.get<AdminAssignmentsResponse>(
    `/admin/classes/${classId}/assignments`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function enrollStudentInClassById(
  classId: number,
  studentId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.post<AdminResponse>(
    `/admin/classes/${classId}/students`,
    { studentId },
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}

export async function unenrollStudentFromClassById(
  classId: number,
  studentId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}/students/${studentId}`,
  )

  if (apiResponse.error) {
    throw new Error(apiResponse.error)
  }

  return apiResponse.data!
}
