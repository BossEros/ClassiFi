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
  BulkEnrollmentResult,
} from "@/data/api/admin.types"

// ============ User Management ============

/**
 * Retrieves users with optional pagination and filter criteria.
 *
 * @param filterOptions - Paging and filter options (search, role, status).
 * @returns Paginated user records for admin management screens.
 */
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

/**
 * Fetches complete details for a single user by ID.
 *
 * @param userId - The unique identifier of the user.
 * @returns Detailed admin user response.
 */
export async function getAdminUserDetailsById(
  userId: number,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.get<AdminUserResponse>(
    `/admin/users/${userId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch user details")
}

/**
 * Creates a new user account from the admin panel.
 *
 * @param newUserData - User profile and account data for creation.
 * @returns Created user response.
 */
export async function createNewUserAccount(
  newUserData: CreateUserData,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.post<AdminUserResponse>(
    `/admin/users`,
    newUserData,
  )

  return unwrapApiResponse(apiResponse, "Failed to create user")
}

/**
 * Updates an existing user's role.
 *
 * @param userId - The unique identifier of the user.
 * @param newUserRole - The new role to assign.
 * @returns Updated user response.
 */
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

/**
 * Updates basic personal details for a user.
 *
 * @param userId - The unique identifier of the user.
 * @param updatedPersonalDetails - First and last name values to update.
 * @returns Updated user response.
 */
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

/**
 * Updates a user's email address.
 *
 * @param userId - The unique identifier of the user.
 * @param newEmailAddress - The replacement email address.
 * @returns Updated user response.
 */
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

/**
 * Toggles a user account between active and inactive status.
 *
 * @param userId - The unique identifier of the user.
 * @returns Updated user response with the new status.
 */
export async function toggleUserAccountStatusById(
  userId: number,
): Promise<AdminUserResponse> {
  const apiResponse = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/status`,
    {},
  )

  return unwrapApiResponse(apiResponse, "Failed to toggle user status")
}

/**
 * Deletes a user account by ID.
 *
 * @param userId - The unique identifier of the user to delete.
 * @returns Generic admin operation response.
 */
export async function deleteUserAccountById(
  userId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/users/${userId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to delete user")
}

// ============ Analytics ============

/**
 * Fetches aggregate statistics for the admin dashboard.
 *
 * @returns Summary metrics used by the admin overview page.
 */
export async function getAdminDashboardStatistics(): Promise<AdminStatsResponse> {
  const apiResponse = await apiClient.get<AdminStatsResponse>("/admin/stats")

  return unwrapApiResponse(apiResponse, "Failed to fetch statistics")
}

/**
 * Retrieves recent admin activity entries.
 *
 * @param maximumActivityCount - Maximum number of activity items to return.
 * @returns Activity log response for dashboard display.
 */
export async function getRecentAdminActivityLog(
  maximumActivityCount: number = 10,
): Promise<AdminActivityResponse> {
  const apiResponse = await apiClient.get<AdminActivityResponse>(
    `/admin/activity?limit=${maximumActivityCount}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch activity log")
}

// ============ Class Management ============

/**
 * Retrieves classes with optional pagination and filter criteria.
 *
 * @param filterOptions - Paging and class filters (search, teacher, status, term).
 * @returns Paginated class records for admin management.
 */
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

/**
 * Fetches complete details for a class by ID.
 *
 * @param classId - The unique identifier of the class.
 * @returns Detailed class response.
 */
export async function getAdminClassDetailsById(
  classId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.get<AdminClassResponse>(
    `/admin/classes/${classId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch class details")
}

/**
 * Creates a new class from the admin panel.
 *
 * @param newClassData - Class payload for creation.
 * @returns Created class response.
 */
export async function createNewClass(
  newClassData: CreateClassData,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.post<AdminClassResponse>(
    "/admin/classes",
    newClassData,
  )

  return unwrapApiResponse(apiResponse, "Failed to create class")
}

/**
 * Updates class details by ID.
 *
 * @param classId - The unique identifier of the class.
 * @param updatedClassData - Class fields to update.
 * @returns Updated class response.
 */
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

/**
 * Deletes a class by ID.
 *
 * @param classId - The unique identifier of the class to delete.
 * @returns Generic admin operation response.
 */
export async function deleteClassById(classId: number): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to delete class")
}

/**
 * Reassigns a class to a different teacher.
 *
 * @param classId - The unique identifier of the class.
 * @param newTeacherId - The teacher ID that will become the new owner.
 * @returns Updated class response.
 */
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

/**
 * Archives a class without deleting historical records.
 *
 * @param classId - The unique identifier of the class to archive.
 * @returns Updated class response.
 */
export async function archiveClassById(
  classId: number,
): Promise<AdminClassResponse> {
  const apiResponse = await apiClient.patch<AdminClassResponse>(
    `/admin/classes/${classId}/archive`,
    {},
  )

  return unwrapApiResponse(apiResponse, "Failed to archive class")
}

/**
 * Retrieves all teacher accounts for class assignment flows.
 *
 * @returns Teacher list response for admin selectors.
 */
export async function getAllTeacherAccounts(): Promise<AdminTeachersResponse> {
  const apiResponse = await apiClient.get<AdminTeachersResponse>(
    "/admin/users/teachers",
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch teachers")
}

// ============ Enrollment Management ============

/**
 * Retrieves enrollment records with optional pagination and filter criteria.
 *
 * @param filterOptions - Paging and enrollment filters.
 * @returns Paginated enrollment records.
 */
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

/**
 * Transfers a student from one class to another.
 *
 * @param transferStudentData - Source class, target class, and student transfer payload.
 * @returns Generic admin operation response.
 */
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

/**
 * Retrieves all students currently enrolled in a class.
 *
 * @param classId - The unique identifier of the class.
 * @returns Enrolled students response.
 */
export async function getEnrolledStudentsInClassById(
  classId: number,
): Promise<AdminStudentsResponse> {
  const apiResponse = await apiClient.get<AdminStudentsResponse>(
    `/admin/classes/${classId}/students`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch enrolled students")
}

/**
 * Retrieves all assignments configured in a class.
 *
 * @param classId - The unique identifier of the class.
 * @returns Class assignment response.
 */
export async function getAllAssignmentsInClassById(
  classId: number,
): Promise<AdminAssignmentsResponse> {
  const apiResponse = await apiClient.get<AdminAssignmentsResponse>(
    `/admin/classes/${classId}/assignments`,
  )

  return unwrapApiResponse(apiResponse, "Failed to fetch assignments")
}

/**
 * Enrolls a student in a class from the admin panel.
 *
 * @param classId - The unique identifier of the class.
 * @param studentId - The unique identifier of the student.
 * @returns Generic admin operation response.
 */
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

/**
 * Bulk-enrolls multiple students in a class from the admin panel.
 *
 * @param classId - The unique identifier of the class.
 * @param studentIds - Array of student IDs to enroll.
 * @returns Bulk enrollment result with per-student outcomes and a summary.
 */
export async function bulkEnrollStudentsInClassById(
  classId: number,
  studentIds: number[],
): Promise<BulkEnrollmentResult & AdminResponse> {
  const apiResponse = await apiClient.post<BulkEnrollmentResult & AdminResponse>(
    `/admin/classes/${classId}/students/bulk`,
    { studentIds },
  )

  return unwrapApiResponse(apiResponse, "Failed to bulk-enroll students")
}

/**
 * Removes a student from a class from the admin panel.
 *
 * @param classId - The unique identifier of the class.
 * @param studentId - The unique identifier of the student.
 * @returns Generic admin operation response.
 */
export async function unenrollStudentFromClassById(
  classId: number,
  studentId: number,
): Promise<AdminResponse> {
  const apiResponse = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}/students/${studentId}`,
  )

  return unwrapApiResponse(apiResponse, "Failed to unenroll student")
}







