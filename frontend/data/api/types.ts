/**
 * API Request and Response DTOs for class-related operations.
 * These types define the contract between frontend and backend API.
 */

import type { Class, Task } from '@/business/models/dashboard/types'

// ============================================================================
// Shared Types
// ============================================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface Schedule {
    days: DayOfWeek[]
    startTime: string // HH:MM format
    endTime: string   // HH:MM format
}

// ============================================================================
// Class Request DTOs
// ============================================================================

export interface CreateClassRequest {
    teacherId: number
    className: string
    description?: string
    classCode: string
    yearLevel: 1 | 2 | 3 | 4
    semester: 1 | 2
    academicYear: string // Format: YYYY-YYYY (e.g., "2024-2025")
    schedule: Schedule
}

export interface UpdateClassRequest {
    teacherId: number
    className?: string
    description?: string
    isActive?: boolean
    yearLevel?: 1 | 2 | 3 | 4
    semester?: 1 | 2
    academicYear?: string
    schedule?: Schedule
}

// ============================================================================
// Assignment Request DTOs
// ============================================================================

export interface CreateAssignmentRequest {
    classId: number
    teacherId: number
    assignmentName: string
    description: string
    programmingLanguage: 'python' | 'java' | 'c'
    deadline: Date | string
    allowResubmission: boolean
    maxAttempts?: number | null
    templateCode?: string | null
    totalScore: number
    scheduledDate?: Date | string | null
}

export interface UpdateAssignmentRequest {
    teacherId: number
    assignmentName?: string
    description?: string
    programmingLanguage?: 'python' | 'java' | 'c'
    deadline?: string
    allowResubmission?: boolean
    maxAttempts?: number | null
    templateCode?: string | null
    totalScore?: number
    scheduledDate?: Date | string | null
}

// ============================================================================
// Class Response DTOs
// ============================================================================

export interface CreateClassResponse {
    success: boolean
    message?: string
    class?: Class
}

export interface CreateAssignmentResponse {
    success: boolean
    message?: string
    assignment?: Task
}

// ============================================================================
// Dashboard Response DTOs
// ============================================================================

export interface DashboardResponse {
    success: boolean
    message?: string
    recentClasses: Class[]
    pendingTasks: Task[]
}

export interface StudentDashboardData {
    enrolledClasses: Class[]
    pendingAssignments: Task[]
}
