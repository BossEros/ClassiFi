import type { User, Class, Assignment, Submission } from '../models/index.js';
export interface UserDTO {
    id: number;
    supabaseUserId: string | null;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    avatarUrl: string | null;
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
    assignmentName?: string;
    className?: string;
}
export declare function toSubmissionDTO(submission: Submission, extras?: {
    studentName?: string;
    assignmentName?: string;
    className?: string;
}): SubmissionDTO;
export interface StudentDTO {
    id: number;
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
    isActive: boolean;
    yearLevel: number;
    semester: number;
    academicYear: string;
    schedule: any;
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
import type { Pair, Fragment } from '../lib/plagiarism/index.js';
/** Configuration for plagiarism detection */
export declare const PLAGIARISM_CONFIG: {
    /** Default similarity threshold for flagging suspicious pairs */
    readonly DEFAULT_THRESHOLD: 0.5;
    /** Default k-gram length for fingerprinting */
    readonly DEFAULT_KGRAM_LENGTH: 23;
    /** Default number of k-grams in a window */
    readonly DEFAULT_KGRAMS_IN_WINDOW: 17;
    /** Minimum number of files required for analysis */
    readonly MINIMUM_FILES_REQUIRED: 2;
};
/** Supported languages for plagiarism detection */
export declare const PLAGIARISM_LANGUAGE_MAP: Record<string, 'python' | 'java' | 'c'>;
/** DTO for a file in plagiarism results */
export interface PlagiarismFileDTO {
    id: number;
    path: string;
    filename: string;
    lineCount: number;
    studentId?: string;
    studentName?: string;
}
/** DTO for a plagiarism pair comparison */
export interface PlagiarismPairDTO {
    id: number;
    leftFile: PlagiarismFileDTO;
    rightFile: PlagiarismFileDTO;
    structuralScore: number;
    semanticScore: number;
    hybridScore: number;
    overlap: number;
    longest: number;
}
/** DTO for a code fragment match */
export interface PlagiarismFragmentDTO {
    id: number;
    leftSelection: {
        startRow: number;
        startCol: number;
        endRow: number;
        endCol: number;
    };
    rightSelection: {
        startRow: number;
        startCol: number;
        endRow: number;
        endCol: number;
    };
    length: number;
}
/** DTO for plagiarism analysis summary */
export interface PlagiarismSummaryDTO {
    totalFiles: number;
    totalPairs: number;
    suspiciousPairs: number;
    averageSimilarity: number;
    maxSimilarity: number;
}
/** Convert a Pair to PlagiarismPairDTO */
export declare function toPlagiarismPairDTO(pair: Pair, resultId?: number): PlagiarismPairDTO;
/** Convert a Fragment to PlagiarismFragmentDTO */
export declare function toPlagiarismFragmentDTO(fragment: Fragment, index: number): PlagiarismFragmentDTO;
//# sourceMappingURL=mappers.d.ts.map