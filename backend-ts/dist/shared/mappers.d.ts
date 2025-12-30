/**
 * DTO Mappers
 * Convert between database entities and API response objects
 */
import type { User, Class, Assignment, Submission } from '../models/index.js';
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
export declare function toUserDTO(user: User): UserDTO;
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
export declare function toClassDTO(classData: Class, extras?: {
    studentCount?: number;
    teacherName?: string;
    assignmentCount?: number;
}): ClassDTO;
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
export declare function toAssignmentDTO(assignment: Assignment, extras?: {
    submissionCount?: number;
    hasSubmitted?: boolean;
    className?: string;
}): AssignmentDTO;
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
export declare function toSubmissionDTO(submission: Submission, extras?: {
    studentName?: string;
    studentUsername?: string;
    assignmentName?: string;
    className?: string;
}): SubmissionDTO;
export interface StudentDTO {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
}
export declare function toStudentDTO(user: User): StudentDTO;
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
export declare function toDashboardClassDTO(classData: Class, extras?: {
    studentCount?: number;
    assignmentCount?: number;
    teacherName?: string;
}): DashboardClassDTO;
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
//# sourceMappingURL=mappers.d.ts.map