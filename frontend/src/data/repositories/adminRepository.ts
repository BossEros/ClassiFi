import { apiClient, unwrapApiResponse } from "@/data/api/apiClient"
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
  AdminEnrollmentRecord,
  TransferStudentData,
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

  return unwrapApiResponse(apiResponse, "Failed to fetch users")
}

export async function getAdminUserDetailsById(
  userId: number,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.get<AdminUserResponse>(
    `/admin/users/${userId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch user details")
}

export async function createNewUserAccount(
  newUserData: CreateUserData,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.post<AdminUserResponse>(
    `/admin/users`,
    newUserData,
  )

  return unwrapApiResponse(apiResponse, "Failed to create user")
}

export async function updateUserRoleById(
  userId: number,
  newUserRole: string,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/role`,
    { role: newUserRole },
  )

  return unwrapApiResponse(apiResponse, "Failed to update user role")
}

export async function updateUserPersonalDetailsById(
  userId: number,
  updatedPersonalDetails: { firstName?: string; lastName?: string },
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/details`,
    updatedPersonalDetails,
  )

  return unwrapApiResponse(apiResponse, "Failed to update user details")
}

export async function updateUserEmailAddressById(
  userId: number,
  newEmailAddress: string,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/email`,
    { email: newEmailAddress },
  )

  return unwrapApiResponse(apiResponse, "Failed to update user email")
}

export async function toggleUserAccountStatusById(
  userId: number,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/status`,
    {},
  )

  return unwrapApiResponse(apiResponse, "Failed to toggle user status")
}

export async function deleteUserAccountById(
  userId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/users/${userId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to delete user")
}

// ============ Analytics ============

export async function getAdminDashboardStatistics(): Promise<AdminStatsResponse> {
  const apiResponse = await apiClient.get<AdminStatsResponse>("/admin/stats")

  return unwrapApiResponse(apiResponse, "Failed to fetch statistics")
}

export async function getRecentAdminActivityLog(
  maximumActivityCount: number = 10,
): Promise<AdminActivityResponse> {
  const apiResponse = await apiClient.get<AdminActivityResponse>(
    `/admin/activity?limit=${maximumActivityCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch activity log")
}

// ============ Class Management ============

export async function getAllClassesWithPaginationAndFilters(filterOptions: {
  pageNumber?: number
  itemsPerPage?: number
  searchQuery?: string
  teacherId?: number
  classStatus?: string
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
  if (filterOptions.semesterNumber)
    urlQueryParams.set("semester", filterOptions.semesterNumber.toString())
  if (filterOptions.academicYear)
    urlQueryParams.set("academicYear", filterOptions.academicYear)

  const apiResponse = await apiClient.get<PaginatedResponse<AdminClass>>(
    `/admin/classes?${urlQueryParams.toString()}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch classes")
}

export async function getAdminClassDetailsById(
  classId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.get<AdminClassResponse>(
    `/admin/classes/${classId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch class details")
}

export async function createNewClass(
  newClassData: CreateClassData,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.post<AdminClassResponse>(
    "/admin/classes",
    newClassData,
  )

  return unwrapApiResponse(apiResponse, "Failed to create class")
}

export async function updateClassDetailsById(
  classId: number,
  updatedClassData: UpdateClassData,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.put<AdminClassResponse>(
    `/admin/classes/${classId}`,
    updatedClassData,
  )

  return unwrapApiResponse(apiResponse, "Failed to update class")
}

export async function deleteClassById(classId: number): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to delete class")
}

export async function reassignClassTeacherById(
  classId: number,
  newTeacherId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.patch<AdminClassResponse>(
    `/admin/classes/${classId}/reassign`,
    { teacherId: newTeacherId },
  )

  return unwrapApiResponse(apiResponse, "Failed to reassign class teacher")
}

export async function archiveClassById(
  classId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.patch<AdminClassResponse>(
    `/admin/classes/${classId}/archive`,
    {},
  )

  return unwrapApiResponse(apiResponse, "Failed to archive class")
}

export async function getAllTeacherAccounts(): Promise<AdminTeachersResponse> {
  const apiResponse = await apiClient.get<AdminTeachersResponse>(
    "/admin/users/teachers",
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch teachers")
}

// ============ Enrollment Management ============

export async function getAllEnrollmentsWithPaginationAndFilters(filterOptions: {
  pageNumber?: number
  itemsPerPage?: number
  searchQuery?: string
  classId?: number
  teacherId?: number
  studentId?: number
  semesterNumber?: number
  academicYear?: string
}): Promise<PaginatedResponse<AdminEnrollmentRecord>> {
  const urlQueryParams = new URLSearchParams()

  if (filterOptions.pageNumber)
    urlQueryParams.set("page", filterOptions.pageNumber.toString())
  if (filterOptions.itemsPerPage)
    urlQueryParams.set("limit", filterOptions.itemsPerPage.toString())
  if (filterOptions.searchQuery)
    urlQueryParams.set("search", filterOptions.searchQuery)
  if (filterOptions.classId)
    urlQueryParams.set("classId", filterOptions.classId.toString())
  if (filterOptions.teacherId)
    urlQueryParams.set("teacherId", filterOptions.teacherId.toString())
  if (filterOptions.studentId)
    urlQueryParams.set("studentId", filterOptions.studentId.toString())
  if (filterOptions.semesterNumber)
    urlQueryParams.set("semester", filterOptions.semesterNumber.toString())
  if (filterOptions.academicYear)
    urlQueryParams.set("academicYear", filterOptions.academicYear)

  const apiResponse = await apiClient.get<PaginatedResponse<AdminEnrollmentRecord>>(
    `/admin/enrollments?${urlQueryParams.toString()}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch enrollments")
}

export async function transferStudentBetweenClasses(
  transferStudentData: TransferStudentData,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.post<AdminResponse>(
    "/admin/enrollments/transfer",
    transferStudentData,
  )

  return unwrapApiResponse(apiResponse, "Failed to transfer student")
}

// ============ Class Enrollment Management ============

export async function getEnrolledStudentsInClassById(
  classId: number,
): Promise<AdminStudentsResponse> {
  const apiResponse = await apiClient.get<AdminStudentsResponse>(
    `/admin/classes/${classId}/students`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch enrolled students")
}

export async function getAllAssignmentsInClassById(
  classId: number,
): Promise<AdminAssignmentsResponse> {
  const apiResponse = await apiClient.get<AdminAssignmentsResponse>(
    `/admin/classes/${classId}/assignments`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch assignments")
}

export async function enrollStudentInClassById(
  classId: number,
  studentId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.post<AdminResponse>(
    `/admin/classes/${classId}/students`,
    { studentId },
  )

  return unwrapApiResponse(apiResponse, "Failed to enroll student")
}

export async function unenrollStudentFromClassById(
  classId: number,
  studentId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}/students/${studentId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to unenroll student")
}







