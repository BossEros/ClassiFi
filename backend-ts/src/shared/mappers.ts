/**
 * DTO Mappers
 * Convert between database entities and API response objects
 */

import type { User, Class, Assignment, Submission, Enrollment } from '../models/index.js';

// ============ User Mappers ============

export interface UserDTO {
    id: number;
    supabaseUserId: string | null;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: string;
}

export function toUserDTO(user: User): UserDTO {
    return {
        id: user.id,
        supabaseUserId: user.supabaseUserId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
    };
}

// ============ Class Mappers ============

export interface ClassDTO {
    id: number;
    teacherId: number;
    className: string;
    classCode: string;
    description: string | null;
    yearLevel: number;
    semester: number;
    academicYear: string;
    schedule: any;
    createdAt: string;
    isActive: boolean;
    studentCount?: number;
    teacherName?: string;
    assignmentCount?: number;
}

export function toClassDTO(
    classData: Class,
    extras?: { studentCount?: number; teacherName?: string; assignmentCount?: number }
): ClassDTO {
    return {
        id: classData.id,
        teacherId: classData.teacherId,
        className: classData.className,
        classCode: classData.classCode,
        description: classData.description,
        yearLevel: classData.yearLevel,
        semester: classData.semester,
        academicYear: classData.academicYear,
        schedule: classData.schedule,
        createdAt: classData.createdAt?.toISOString() ?? new Date().toISOString(),
        isActive: classData.isActive ?? true,
        ...extras,
    };
}

// ============ Assignment Mappers ============

export interface AssignmentDTO {
    id: number;
    classId: number;
    assignmentName: string;
    description: string;
    programmingLanguage: string;
    deadline: string;
    allowResubmission: boolean;
    maxAttempts: number | null;
    createdAt: string;
    isActive: boolean;
    submissionCount?: number;
    hasSubmitted?: boolean;
    className?: string;
}

export function toAssignmentDTO(
    assignment: Assignment,
    extras?: { submissionCount?: number; hasSubmitted?: boolean; className?: string }
): AssignmentDTO {
    return {
        id: assignment.id,
        classId: assignment.classId,
        assignmentName: assignment.assignmentName,
        description: assignment.description,
        programmingLanguage: assignment.programmingLanguage,
        deadline: assignment.deadline?.toISOString() ?? '',
        allowResubmission: assignment.allowResubmission ?? true,
        maxAttempts: assignment.maxAttempts ?? null,
        createdAt: assignment.createdAt?.toISOString() ?? new Date().toISOString(),
        isActive: assignment.isActive ?? true,
        ...extras,
    };
}

// ============ Submission Mappers ============

export interface SubmissionDTO {
    id: number;
    assignmentId: number;
    studentId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    submissionNumber: number;
    submittedAt: string;
    isLatest: boolean;
    studentName?: string;
    studentUsername?: string;
    assignmentName?: string;
    className?: string;
}

export function toSubmissionDTO(
    submission: Submission,
    extras?: { studentName?: string; studentUsername?: string; assignmentName?: string; className?: string }
): SubmissionDTO {
    return {
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        fileName: submission.fileName,
        filePath: submission.filePath,
        fileSize: submission.fileSize,
        submissionNumber: submission.submissionNumber,
        submittedAt: submission.submittedAt?.toISOString() ?? new Date().toISOString(),
        isLatest: submission.isLatest ?? false,
        ...extras,
    };
}

// ============ Student Info Mapper ============

export interface StudentDTO {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
}

export function toStudentDTO(user: User): StudentDTO {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
    };
}

// ============ Dashboard Mappers ============

export interface DashboardClassDTO {
    id: number;
    className: string;
    classCode: string;
    description: string | null;
    studentCount?: number;
    assignmentCount?: number;
    teacherName?: string;
    createdAt: string;
}

export function toDashboardClassDTO(
    classData: Class,
    extras?: { studentCount?: number; assignmentCount?: number; teacherName?: string }
): DashboardClassDTO {
    return {
        id: classData.id,
        className: classData.className,
        classCode: classData.classCode,
        description: classData.description,
        createdAt: classData.createdAt?.toISOString() ?? new Date().toISOString(),
        ...extras,
    };
}

export interface PendingAssignmentDTO {
    id: number;
    assignmentName: string;
    className: string;
    classId: number;
    deadline: string;
    hasSubmitted: boolean;
    programmingLanguage: string;
}

export interface PendingTaskDTO {
    id: number;
    assignmentName: string;
    className: string;
    classId: number;
    deadline: string;
    submissionCount: number;
    totalStudents: number;
}
