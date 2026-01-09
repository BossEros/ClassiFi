/**
 * Admin Types
 * Type definitions for admin-related operations
 */

// ============ User Types ============

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

export interface CreateUserData {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'student' | 'teacher' | 'admin'
}

// ============ Class Types ============

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

// ============ Enrollment Types ============

export interface EnrolledStudent {
    id: number
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
    enrolledAt: string
    fullName?: string
}

export interface ClassAssignment {
    id: number
    title: string
    description: string
    deadline: string | null
    createdAt: string
    submissionCount: number
}

// ============ Analytics Types ============

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

// ============ Response Types ============

export interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}
