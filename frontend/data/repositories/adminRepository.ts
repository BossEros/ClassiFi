import { apiClient } from "@/data/api/apiClient";
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
} from "@/data/api/types";

// ============ User Management ============

export async function getAllUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<PaginatedResponse<AdminUser>> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", options.page.toString());
  if (options.limit) params.set("limit", options.limit.toString());
  if (options.search) params.set("search", options.search);
  if (options.role) params.set("role", options.role);
  if (options.status) params.set("status", options.status);

  const response = await apiClient.get<PaginatedResponse<AdminUser>>(
    `/admin/users?${params.toString()}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function getUserById(userId: number): Promise<AdminUserResponse> {
  const response = await apiClient.get<AdminUserResponse>(
    `/admin/users/${userId}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function createUser(
  data: CreateUserData,
): Promise<AdminUserResponse> {
  const response = await apiClient.post<AdminUserResponse>(
    `/admin/users`,
    data,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function updateUserRole(
  userId: number,
  role: string,
): Promise<AdminUserResponse> {
  const response = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/role`,
    { role },
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function updateUserDetails(
  userId: number,
  data: { firstName?: string; lastName?: string },
): Promise<AdminUserResponse> {
  const response = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/details`,
    data,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function updateUserEmail(
  userId: number,
  email: string,
): Promise<AdminUserResponse> {
  const response = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/email`,
    { email },
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function toggleUserStatus(
  userId: number,
): Promise<AdminUserResponse> {
  const response = await apiClient.patch<AdminUserResponse>(
    `/admin/users/${userId}/status`,
    {},
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function deleteUser(userId: number): Promise<AdminResponse> {
  const response = await apiClient.delete<AdminResponse>(
    `/admin/users/${userId}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

// ============ Analytics ============

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const response = await apiClient.get<AdminStatsResponse>("/admin/stats");

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function getRecentActivity(
  limit: number = 10,
): Promise<AdminActivityResponse> {
  const response = await apiClient.get<AdminActivityResponse>(
    `/admin/activity?limit=${limit}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

// ============ Class Management ============

export async function getAllClasses(options: {
  page?: number;
  limit?: number;
  search?: string;
  teacherId?: number;
  status?: string;
  yearLevel?: number;
  semester?: number;
  academicYear?: string;
}): Promise<PaginatedResponse<AdminClass>> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", options.page.toString());
  if (options.limit) params.set("limit", options.limit.toString());
  if (options.search) params.set("search", options.search);
  if (options.teacherId) params.set("teacherId", options.teacherId.toString());
  if (options.status) params.set("status", options.status);
  if (options.yearLevel) params.set("yearLevel", options.yearLevel.toString());
  if (options.semester) params.set("semester", options.semester.toString());
  if (options.academicYear) params.set("academicYear", options.academicYear);

  const response = await apiClient.get<PaginatedResponse<AdminClass>>(
    `/admin/classes?${params.toString()}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function getClassById(
  classId: number,
): Promise<AdminClassResponse> {
  const response = await apiClient.get<AdminClassResponse>(
    `/admin/classes/${classId}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function createClass(
  data: CreateClassData,
): Promise<AdminClassResponse> {
  const response = await apiClient.post<AdminClassResponse>(
    "/admin/classes",
    data,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function updateClass(
  classId: number,
  data: UpdateClassData,
): Promise<AdminClassResponse> {
  const response = await apiClient.put<AdminClassResponse>(
    `/admin/classes/${classId}`,
    data,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function deleteClass(classId: number): Promise<AdminResponse> {
  const response = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function reassignClassTeacher(
  classId: number,
  teacherId: number,
): Promise<AdminClassResponse> {
  const response = await apiClient.patch<AdminClassResponse>(
    `/admin/classes/${classId}/reassign`,
    { teacherId },
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function archiveClass(
  classId: number,
): Promise<AdminClassResponse> {
  const response = await apiClient.patch<AdminClassResponse>(
    `/admin/classes/${classId}/archive`,
    {},
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function getAllTeachers(): Promise<AdminTeachersResponse> {
  const response =
    await apiClient.get<AdminTeachersResponse>("/admin/teachers");

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

// ============ Class Enrollment Management ============

export async function getClassStudents(
  classId: number,
): Promise<AdminStudentsResponse> {
  const response = await apiClient.get<AdminStudentsResponse>(
    `/admin/classes/${classId}/students`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function getClassAssignments(
  classId: number,
): Promise<AdminAssignmentsResponse> {
  const response = await apiClient.get<AdminAssignmentsResponse>(
    `/admin/classes/${classId}/assignments`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function addStudentToClass(
  classId: number,
  studentId: number,
): Promise<AdminResponse> {
  const response = await apiClient.post<AdminResponse>(
    `/admin/classes/${classId}/students`,
    { studentId },
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}

export async function removeStudentFromClass(
  classId: number,
  studentId: number,
): Promise<AdminResponse> {
  const response = await apiClient.delete<AdminResponse>(
    `/admin/classes/${classId}/students/${studentId}`,
  );

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
}
