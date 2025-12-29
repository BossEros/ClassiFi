/**
 * API Request and Response DTOs for class-related operations.
 * These types define the contract between frontend and backend API.
 */

import type { Class, Assignment, Task } from '@/business/models/dashboard/types'

// ============================================================================
// Class Request DTOs
// ============================================================================

export interface CreateClassRequest {
    teacherId: number
    className: string
    description?: string
}

export interface UpdateClassRequest {
    teacherId: number
    className?: string
    description?: string
    isActive?: boolean
}

// ============================================================================
// Assignment Request DTOs
// ============================================================================

export interface CreateAssignmentRequest {
    classId: number
    teacherId: number
    assignmentName: string
    description: string
    programmingLanguage: 'python' | 'java'
    deadline: Date | string
    allowResubmission: boolean
}

export interface UpdateAssignmentRequest {
    teacherId: number
    assignmentName?: string
    description?: string
    programmingLanguage?: 'python' | 'java'
    deadline?: string
    allowResubmission?: boolean
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
    assignment?: Assignment
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
