import * as adminRepository from "@/data/repositories/adminRepository"
import type {
  AdminUser,
  AdminStats,
  ActivityItem,
  AdminClass,
  PaginatedResponse,
  CreateUserData,
  CreateClassData,
  UpdateClassData,
  EnrolledStudent,
  ClassAssignment,
} from "@/business/models/admin/types"

// Re-export common types for consumers
export type {
  AdminUser,
  AdminStats,
  ActivityItem,
  AdminClass,
  PaginatedResponse,
  CreateUserData,
  CreateClassData,
  UpdateClassData,
  EnrolledStudent,
  ClassAssignment,
}

import { validateId } from "@/business/validation/commonValidation"
import {
  validateEmail,
  validateRole,
} from "@/business/validation/authValidation"

// ============ User Management ============

/**
 * Retrieves a paginated list of all users based on search and filter criteria.
 *
 * @param options - Filtering and pagination options including page, limit, search, role, and status.
 * @returns A paginated response object containing the list of users and metadata.
 */
export async function getAllUsers(
  options: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  } = {},
): Promise<PaginatedResponse<AdminUser>> {
  return await adminRepository.getAllUsersWithPaginationAndFilters({
    pageNumber: options.page,
    itemsPerPage: options.limit,
    searchQuery: options.search,
    userRole: options.role,
    accountStatus: options.status,
  })
}

/**
 * Retrieves a single user's detailed information by their unique ID.
 *
 * @param userId - The unique identifier of the user to retrieve.
 * @returns The user object if found.
 * @throws Error if the user is not found.
 */
export async function getUserById(userId: number): Promise<AdminUser> {
  validateId(userId, "user")

  const response = await adminRepository.getAdminUserDetailsById(userId)

  if (!response.user) {
    throw new Error(`User with ID ${userId} not found`)
  }

  return response.user
}

/**
 * Creates a new user account with the provided data.
 *
 * @param data - The data required to create a new user (email, password, role, etc.).
 * @returns The newly created user object.
 * @throws Error if creation fails.
 */
export async function createUser(data: CreateUserData): Promise<AdminUser> {
  const emailError = validateEmail(data.email)
  if (emailError) throw new Error(emailError)

  const roleError = validateRole(data.role)
  if (roleError) throw new Error(roleError)

  const response = await adminRepository.createNewUserAccount(data)

  if (!response.user) {
    throw new Error("Failed to create user: no user returned")
  }

  return response.user
}

/**
 * Updates the role of a specific user.
 *
 * @param userId - The unique identifier of the user.
 * @param role - The new role to assign to the user (e.g., 'student', 'teacher', 'admin').
 * @returns The updated user object.
 */
export async function updateUserRole(
  userId: number,
  role: string,
): Promise<AdminUser> {
  validateId(userId, "user")
  const roleError = validateRole(role)
  if (roleError) throw new Error(roleError)

  const response = await adminRepository.updateUserRoleById(userId, role)

  if (!response.user) {
    throw new Error(`Failed to update role for user ${userId}`)
  }

  return response.user
}

/**
 * Updates basic profile details for a user.
 *
 * @param userId - The unique identifier of the user.
 * @param data - An object containing the fields to update (firstName, lastName).
 * @returns The updated user object.
 */
export async function updateUserDetails(
  userId: number,
  data: { firstName?: string; lastName?: string },
): Promise<AdminUser> {
  validateId(userId, "user")

  const response = await adminRepository.updateUserPersonalDetailsById(
    userId,
    data,
  )

  if (!response.user) {
    throw new Error(`Failed to update details for user ${userId}`)
  }

  return response.user
}

/**
 * Updates the email address of a specific user.
 *
 * @param userId - The unique identifier of the user.
 * @param email - The new email address to assign.
 * @returns The updated user object.
 */
export async function updateUserEmail(
  userId: number,
  email: string,
): Promise<AdminUser> {
  validateId(userId, "user")
  const emailError = validateEmail(email)
  if (emailError) throw new Error(emailError)

  const response = await adminRepository.updateUserEmailAddressById(
    userId,
    email,
  )

  if (!response.user) {
    throw new Error(`Failed to update email for user ${userId}`)
  }

  return response.user
}

/**
 * Toggles the active status of a user account (active/inactive).
 *
 * @param userId - The unique identifier of the user.
 * @returns The updated user object with the new status.
 */
export async function toggleUserStatus(userId: number): Promise<AdminUser> {
  validateId(userId, "user")

  const response = await adminRepository.toggleUserAccountStatusById(userId)

  if (!response.user) {
    throw new Error(`Failed to toggle status for user ${userId}`)
  }

  return response.user
}

/**
 * Permanently deletes a user account.
 *
 * @param userId - The unique identifier of the user to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteUser(userId: number): Promise<void> {
  validateId(userId, "user")

  await adminRepository.deleteUserAccountById(userId)
}

// ============ Analytics ============

/**
 * Retrieves high-level statistics for the admin dashboard.
 *
 * @returns An object containing counts for users, classes, submissions, etc.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const response = await adminRepository.getAdminDashboardStatistics()

  if (!response.stats) {
    throw new Error("getAdminStats: missing stats in response")
  }

  return response.stats
}

/**
 * Retrieves a list of recent system activities.
 *
 * @param limit - The maximum number of activity items to return (default: 10).
 * @returns An array of activity items describing recent actions.
 */
export async function getRecentActivity(
  limit: number = 10,
): Promise<ActivityItem[]> {
  const response = await adminRepository.getRecentAdminActivityLog(limit)

  if (!response.activity || !Array.isArray(response.activity)) {
    throw new Error("getRecentActivity: missing activity in response")
  }

  return response.activity
}

// ============ Class Management ============

/**
 * Retrieves a paginated list of classes based on search and filter criteria.
 *
 * @param options - Filtering options including page, limit, search queries, and filters for teacher, status, year level, etc.
 * @returns A paginated response object containing the list of classes.
 */
export async function getAllClasses(
  options: {
    page?: number
    limit?: number
    search?: string
    teacherId?: number
    status?: string
    yearLevel?: number
    semester?: number
    academicYear?: string
  } = {},
): Promise<PaginatedResponse<AdminClass>> {
  return await adminRepository.getAllClassesWithPaginationAndFilters({
    pageNumber: options.page,
    itemsPerPage: options.limit,
    searchQuery: options.search,
    teacherId: options.teacherId,
    classStatus: options.status,
    yearLevel: options.yearLevel,
    semesterNumber: options.semester,
    academicYear: options.academicYear,
  })
}

/**
 * Retrieves detailed information for a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @returns The class object containing all details.
 * @throws Error if the class is not found.
 */
export async function getClassById(classId: number): Promise<AdminClass> {
  validateId(classId, "class")

  const response = await adminRepository.getAdminClassDetailsById(classId)

  if (!response.class) {
    throw new Error(`getClassById: class with ID ${classId} not found`)
  }

  return response.class
}

/**
 * Creates a new class with the provided details.
 *
 * @param data - The configuration data for the new class (name, teacher, schedule, etc.).
 * @returns The newly created class object.
 */
export async function createClass(data: CreateClassData): Promise<AdminClass> {
  const response = await adminRepository.createNewClass(data)

  if (!response.class) {
    throw new Error("createClass: failed to create class, no class returned")
  }

  return response.class
}

/**
 * Updates the details of an existing class.
 *
 * @param classId - The unique identifier of the class to update.
 * @param data - An object containing the fields to update.
 * @returns The updated class object.
 */
export async function updateClass(
  classId: number,
  data: UpdateClassData,
): Promise<AdminClass> {
  validateId(classId, "class")

  const response = await adminRepository.updateClassDetailsById(classId, data)

  if (!response.class) {
    throw new Error(`updateClass: failed to update class ${classId}`)
  }

  return response.class
}

/**
 * Permanently deletes a class.
 *
 * @param classId - The unique identifier of the class to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteClass(classId: number): Promise<void> {
  validateId(classId, "class")

  await adminRepository.deleteClassById(classId)
}

/**
 * Assigns a new teacher to an existing class.
 *
 * @param classId - The unique identifier of the class.
 * @param teacherId - The unique identifier of the new teacher.
 * @returns The updated class object with the new teacher assigned.
 */
export async function reassignClassTeacher(
  classId: number,
  teacherId: number,
): Promise<AdminClass> {
  validateId(classId, "class")
  validateId(teacherId, "teacher")

  const response = await adminRepository.reassignClassTeacherById(
    classId,
    teacherId,
  )

  if (!response.class) {
    throw new Error(
      `reassignClassTeacher: failed to reassign teacher for class ${classId}`,
    )
  }

  return response.class
}

/**
 * Archives a class, making it inactive/read-only.
 *
 * @param classId - The unique identifier of the class to archive.
 * @returns The archived class object.
 */
export async function archiveClass(classId: number): Promise<AdminClass> {
  validateId(classId, "class")

  const response = await adminRepository.archiveClassById(classId)

  if (!response.class) {
    throw new Error(`archiveClass: failed to archive class ${classId}`)
  }

  return response.class
}

/**
 * Retrieves a list of all users with the 'teacher' role.
 *
 * @returns An array of teacher user objects.
 */
export async function getAllTeachers(): Promise<AdminUser[]> {
  const response = await adminRepository.getAllTeacherAccounts()

  if (!response.teachers) {
    throw new Error("Failed to fetch teachers list")
  }

  return response.teachers
}

/**
 * Retrieves the list of students enrolled in a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @returns An array of enrolled student objects, including their full names.
 */
export async function getClassStudents(
  classId: number,
): Promise<EnrolledStudent[]> {
  validateId(classId, "class")

  const response = await adminRepository.getEnrolledStudentsInClassById(classId)

  if (!response.students) {
    return []
  }

  // Add fullName transformation in service layer
  return response.students.map((student) => ({
    ...student,
    fullName: `${student.firstName} ${student.lastName}`.trim(),
  }))
}

/**
 * Retrieves the list of assignments created for a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @returns An array of assignment objects for the class.
 */
export async function getClassAssignments(
  classId: number,
): Promise<ClassAssignment[]> {
  validateId(classId, "class")

  const response = await adminRepository.getAllAssignmentsInClassById(classId)

  if (!response.assignments) {
    return []
  }

  return response.assignments
}

/**
 * Enrolls a student in a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @param studentId - The unique identifier of the student to enroll.
 * @returns A promise that resolves when the student is added.
 */
export async function addStudentToClass(
  classId: number,
  studentId: number,
): Promise<void> {
  validateId(classId, "class")
  validateId(studentId, "student")

  await adminRepository.enrollStudentInClassById(classId, studentId)
}

/**
 * Removes a student from a specific class.
 *
 * @param classId - The unique identifier of the class.
 * @param studentId - The unique identifier of the student to remove.
 * @returns A promise that resolves when the student is removed.
 */
export async function removeStudentFromClass(
  classId: number,
  studentId: number,
): Promise<void> {
  validateId(classId, "class")
  validateId(studentId, "student")

  await adminRepository.unenrollStudentFromClassById(classId, studentId)
}

/**
 * Aggregates all detailed data for a specific class, including info, assignments, and enrolled students.
 * Useful for populating meaningful class detail views.
 *
 * @param classId - The unique identifier of the class.
 * @returns An object containing the class info, list of assignments, and list of enrolled students.
 */
export async function getAdminClassDetailData(classId: number): Promise<{
  classInfo: AdminClass
  assignments: ClassAssignment[]
  students: EnrolledStudent[]
}> {
  validateId(classId, "class")

  const [classInfo, assignments, students] = await Promise.all([
    getClassById(classId),
    getClassAssignments(classId),
    getClassStudents(classId),
  ])

  return {
    classInfo,
    assignments,
    students,
  }
}
