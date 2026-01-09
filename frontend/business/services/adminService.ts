import * as adminRepository from '@/data/repositories/adminRepository'
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
} from '@/business/models/admin/types'

// Re-export types for convenience
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


// ============ User Management ============

export async function getAllUsers(options: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
} = {}): Promise<PaginatedResponse<AdminUser>> {
    return await adminRepository.getAllUsers(options)
}

export async function getUserById(userId: number): Promise<AdminUser> {
    const response = await adminRepository.getUserById(userId)
    return response.user
}

export async function createUser(data: CreateUserData): Promise<AdminUser> {
    const response = await adminRepository.createUser(data)
    return response.user
}

export async function updateUserRole(userId: number, role: string): Promise<AdminUser> {
    const response = await adminRepository.updateUserRole(userId, role)
    return response.user
}

export async function updateUserDetails(userId: number, data: { firstName?: string; lastName?: string }): Promise<AdminUser> {
    const response = await adminRepository.updateUserDetails(userId, data)
    return response.user
}

export async function updateUserEmail(userId: number, email: string): Promise<AdminUser> {
    const response = await adminRepository.updateUserEmail(userId, email)
    return response.user
}

export async function toggleUserStatus(userId: number): Promise<AdminUser> {
    const response = await adminRepository.toggleUserStatus(userId)
    return response.user
}

export async function deleteUser(userId: number): Promise<void> {
    await adminRepository.deleteUser(userId)
}

// ============ Analytics ============

export async function getAdminStats(): Promise<AdminStats> {
    const response = await adminRepository.getAdminStats()
    return response.stats
}

export async function getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    const response = await adminRepository.getRecentActivity(limit)
    return response.activity
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
} = {}): Promise<PaginatedResponse<AdminClass>> {
    return await adminRepository.getAllClasses(options)
}

export async function getClassById(classId: number): Promise<AdminClass> {
    const response = await adminRepository.getClassById(classId)
    return response.class
}

export async function createClass(data: CreateClassData): Promise<AdminClass> {
    const response = await adminRepository.createClass(data)
    return response.class
}

export async function updateClass(classId: number, data: UpdateClassData): Promise<AdminClass> {
    const response = await adminRepository.updateClass(classId, data)
    return response.class
}

export async function deleteClass(classId: number): Promise<void> {
    await adminRepository.deleteClass(classId)
}

export async function reassignClassTeacher(classId: number, teacherId: number): Promise<AdminClass> {
    const response = await adminRepository.reassignClassTeacher(classId, teacherId)
    return response.class
}

export async function archiveClass(classId: number): Promise<AdminClass> {
    const response = await adminRepository.archiveClass(classId)
    return response.class
}

export async function getAllTeachers(): Promise<AdminUser[]> {
    const response = await adminRepository.getAllTeachers()
    return response.teachers
}

export async function getClassStudents(classId: number): Promise<EnrolledStudent[]> {
    const response = await adminRepository.getClassStudents(classId)
    return response.students
}

export async function getClassAssignments(classId: number): Promise<ClassAssignment[]> {
    const response = await adminRepository.getClassAssignments(classId)
    return response.assignments
}

export async function addStudentToClass(classId: number, studentId: number): Promise<void> {
    await adminRepository.addStudentToClass(classId, studentId)
}

export async function removeStudentFromClass(classId: number, studentId: number): Promise<void> {
    await adminRepository.removeStudentFromClass(classId, studentId)
}

export async function getAdminClassDetailData(classId: number): Promise<{
    classInfo: AdminClass;
    assignments: ClassAssignment[];
    students: EnrolledStudent[];
}> {
    const [classInfo, assignments, students] = await Promise.all([
        getClassById(classId),
        getClassAssignments(classId),
        getClassStudents(classId)
    ]);

    return {
        classInfo,
        assignments,
        students
    };
}
