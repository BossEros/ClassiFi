/**
 * Admin Repository
 * API calls for admin-only operations: users, analytics, and classes
 */
import { apiClient } from '../api/apiClient'

// ============ Types ============

export interface AdminUser {
    id: number
    email: string
    firstName: string
    lastName: string
    role: 'student' | 'teacher' | 'admin'
    avatarUrl: string | null
    isActive: boolean
    createdAt: string
}

export interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface AdminStats {
    totalUsers: number
    totalStudents: number
    totalTeachers: number
    totalAdmins: number
    totalClasses: number
    activeClasses: number
    totalSubmissions: number
    totalPlagiarismReports: number
}

export interface ActivityItem {
    id: string
    type: string
    description: string
    user: string
    target: string
    timestamp: string
}

export interface ClassSchedule {
    days: string[]
    startTime: string
    endTime: string
}

export interface AdminClass {
    id: number
    className: string
    classCode: string
    teacherId: number
    yearLevel: number
    semester: number
    academicYear: string
    schedule: ClassSchedule
    description: string | null
    isActive: boolean
    studentCount: number
    createdAt: string
    teacherName: string
}

export interface CreateUserData {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'student' | 'teacher' | 'admin'
}

export interface CreateClassData {
    teacherId: number
    className: string
    yearLevel: number
    semester: number
    academicYear: string
    schedule: ClassSchedule
    description?: string
}

export interface UpdateClassData {
    className?: string
    description?: string | null
    isActive?: boolean
    yearLevel?: number
    semester?: number
    academicYear?: string
    schedule?: ClassSchedule
    teacherId?: number
}

// ============ User Management ============

export async function getAllUsers(options: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
}): Promise<PaginatedResponse<AdminUser>> {
    const params = new URLSearchParams()
    if (options.page) params.set('page', options.page.toString())
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.search) params.set('search', options.search)
    if (options.role) params.set('role', options.role)
    if (options.status) params.set('status', options.status)

    const response = await apiClient.get<PaginatedResponse<AdminUser>>(
        `/admin/users?${params.toString()}`
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function getUserById(userId: number): Promise<{ success: boolean; user: AdminUser }> {
    const response = await apiClient.get<{ success: boolean; user: AdminUser }>(
        `/admin/users/${userId}`
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function createUser(data: CreateUserData): Promise<{ success: boolean; user: AdminUser }> {
    const response = await apiClient.post<{ success: boolean; user: AdminUser }>(
        '/admin/users',
        data
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function updateUserRole(userId: number, role: string): Promise<{ success: boolean; user: AdminUser }> {
    const response = await apiClient.patch<{ success: boolean; user: AdminUser }>(
        `/admin/users/${userId}/role`,
        { role }
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function updateUserDetails(userId: number, data: { firstName?: string; lastName?: string }): Promise<{ success: boolean; user: AdminUser }> {
    const response = await apiClient.patch<{ success: boolean; user: AdminUser }>(
        `/admin/users/${userId}/details`,
        data
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function updateUserEmail(userId: number, email: string): Promise<{ success: boolean; user: AdminUser }> {
    const response = await apiClient.patch<{ success: boolean; user: AdminUser }>(
        `/admin/users/${userId}/email`,
        { email }
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function toggleUserStatus(userId: number): Promise<{ success: boolean; user: AdminUser }> {
    const response = await apiClient.patch<{ success: boolean; user: AdminUser }>(
        `/admin/users/${userId}/status`,
        {}
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/admin/users/${userId}`
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

// ============ Analytics ============

export async function getAdminStats(): Promise<{ success: boolean; stats: AdminStats }> {
    const response = await apiClient.get<{ success: boolean; stats: AdminStats }>(
        '/admin/stats'
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function getRecentActivity(limit: number = 10): Promise<{ success: boolean; activity: ActivityItem[] }> {
    const response = await apiClient.get<{ success: boolean; activity: ActivityItem[] }>(
        `/admin/activity?limit=${limit}`
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

// ============ Class Management ============

export async function getAllClasses(options: {
    page?: number
    limit?: number
    search?: string
    teacherId?: number
    status?: string
    yearLevel?: number
    semester?: number
    academicYear?: string
}): Promise<PaginatedResponse<AdminClass>> {
    const params = new URLSearchParams()
    if (options.page) params.set('page', options.page.toString())
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.search) params.set('search', options.search)
    if (options.teacherId) params.set('teacherId', options.teacherId.toString())
    if (options.status) params.set('status', options.status)
    if (options.yearLevel) params.set('yearLevel', options.yearLevel.toString())
    if (options.semester) params.set('semester', options.semester.toString())
    if (options.academicYear) params.set('academicYear', options.academicYear)

    const response = await apiClient.get<PaginatedResponse<AdminClass>>(
        `/admin/classes?${params.toString()}`
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function getClassById(classId: number): Promise<{ success: boolean; class: AdminClass }> {
    const response = await apiClient.get<{ success: boolean; class: AdminClass }>(
        `/admin/classes/${classId}`
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function createClass(data: CreateClassData): Promise<{ success: boolean; class: AdminClass }> {
    const response = await apiClient.post<{ success: boolean; class: AdminClass }>(
        '/admin/classes',
        data
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function updateClass(classId: number, data: UpdateClassData): Promise<{ success: boolean; class: AdminClass }> {
    const response = await apiClient.put<{ success: boolean; class: AdminClass }>(
        `/admin/classes/${classId}`,
        data
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function deleteClass(classId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/admin/classes/${classId}`
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function reassignClassTeacher(classId: number, teacherId: number): Promise<{ success: boolean; class: AdminClass }> {
    const response = await apiClient.patch<{ success: boolean; class: AdminClass }>(
        `/admin/classes/${classId}/reassign`,
        { teacherId }
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function archiveClass(classId: number): Promise<{ success: boolean; class: AdminClass }> {
    const response = await apiClient.patch<{ success: boolean; class: AdminClass }>(
        `/admin/classes/${classId}/archive`,
        {}
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}

export async function getAllTeachers(): Promise<{ success: boolean; teachers: AdminUser[] }> {
    const response = await apiClient.get<{ success: boolean; teachers: AdminUser[] }>(
        '/admin/teachers'
    )

    if (response.error) {
        throw new Error(response.error)
    }

    return response.data!
}
