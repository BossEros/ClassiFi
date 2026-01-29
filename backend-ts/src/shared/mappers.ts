import type {
  User,
  Class,
  Assignment,
  Submission,
  ClassSchedule,
} from "../models/index.js"

/** Default total score for assignments */
const DEFAULT_TOTAL_SCORE = 100

// ============ User Mappers ============

export interface UserDTO {
  id: number
  supabaseUserId: string | null
  email: string
  firstName: string
  lastName: string
  role: string
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    supabaseUserId: user.supabaseUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

// ============ Class Mappers ============

export interface ClassDTO {
  id: number
  teacherId: number
  className: string
  classCode: string
  description: string | null
  yearLevel: number
  semester: number
  academicYear: string
  schedule: ClassSchedule
  createdAt: string
  isActive: boolean
  studentCount?: number
  teacherName?: string
  assignmentCount?: number
}

export function toClassDTO(
  classData: Class,
  extras?: {
    studentCount?: number
    teacherName?: string
    assignmentCount?: number
  },
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
  }
}

// ============ Assignment Mappers ============

export interface AssignmentDTO {
  id: number
  classId: number
  assignmentName: string
  description: string
  programmingLanguage: string
  deadline: string
  allowResubmission: boolean
  maxAttempts: number | null
  createdAt: string
  isActive: boolean
  templateCode: string | null
  hasTemplateCode: boolean
  totalScore: number
  scheduledDate: string | null
  submissionCount?: number
  hasSubmitted?: boolean
  className?: string
  testCases?: { id: number; name: string; isHidden: boolean }[]
}

export function toAssignmentDTO(
  assignment: Assignment,
  extras?: {
    submissionCount?: number
    hasSubmitted?: boolean
    className?: string
    testCases?: { id: number; name: string; isHidden: boolean }[]
  },
): AssignmentDTO {
  return {
    id: assignment.id,
    classId: assignment.classId,
    assignmentName: assignment.assignmentName,
    description: assignment.description,
    programmingLanguage: assignment.programmingLanguage,
    deadline: assignment.deadline?.toISOString() ?? "",
    allowResubmission: assignment.allowResubmission ?? true,
    maxAttempts: assignment.maxAttempts ?? null,
    createdAt: assignment.createdAt?.toISOString() ?? new Date().toISOString(),
    isActive: assignment.isActive ?? true,
    templateCode: assignment.templateCode ?? null,
    hasTemplateCode: !!assignment.templateCode,
    totalScore: assignment.totalScore ?? DEFAULT_TOTAL_SCORE,
    scheduledDate: assignment.scheduledDate?.toISOString() ?? null,
    ...extras,
  }
}

// ============ Submission Mappers ============

export interface SubmissionDTO {
  id: number
  assignmentId: number
  studentId: number
  fileName: string
  filePath: string
  fileSize: number
  submissionNumber: number
  submittedAt: string
  isLatest: boolean
  grade: number | null
  studentName?: string
  assignmentName?: string
  className?: string
}

export function toSubmissionDTO(
  submission: Submission,
  extras?: {
    studentName?: string
    assignmentName?: string
    className?: string
  },
): SubmissionDTO {
  return {
    id: submission.id,
    assignmentId: submission.assignmentId,
    studentId: submission.studentId,
    fileName: submission.fileName,
    filePath: submission.filePath,
    fileSize: submission.fileSize,
    submissionNumber: submission.submissionNumber,
    submittedAt:
      submission.submittedAt?.toISOString() ?? new Date().toISOString(),
    isLatest: submission.isLatest ?? false,
    grade: submission.grade ?? null,
    ...extras,
  }
}

// ============ Student Info Mapper ============

export interface StudentDTO {
  id: number
  email: string
  firstName: string
  lastName: string
  fullName: string
}

export function toStudentDTO(user: User): StudentDTO {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
  }
}

// ============ Dashboard Mappers ============

export interface DashboardClassDTO {
  id: number
  className: string
  classCode: string
  description: string | null
  studentCount?: number
  assignmentCount?: number
  teacherName?: string
  createdAt: string
  isActive: boolean
  yearLevel: number
  semester: number
  academicYear: string
  schedule: ClassSchedule
}

export function toDashboardClassDTO(
  classData: Class,
  extras?: {
    studentCount?: number
    assignmentCount?: number
    teacherName?: string
  },
): DashboardClassDTO {
  return {
    id: classData.id,
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
  }
}

export interface PendingAssignmentDTO {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: string
  hasSubmitted: boolean
  programmingLanguage: string
}

export interface PendingTaskDTO {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: string
  submissionCount: number
  totalStudents: number
}

// ============ Plagiarism Mappers ============

import type { Pair, Fragment } from "@/lib/plagiarism/index.js"

/** Configuration for plagiarism detection */
export const PLAGIARISM_CONFIG = {
  /** Default similarity threshold for flagging suspicious pairs */
  DEFAULT_THRESHOLD: 0.5,
  /** Default k-gram length for fingerprinting */
  DEFAULT_KGRAM_LENGTH: 23,
  /** Default number of k-grams in a window */
  DEFAULT_KGRAMS_IN_WINDOW: 17,
  /** Minimum number of files required for analysis */
  MINIMUM_FILES_REQUIRED: 2,
} as const

/** Supported languages for plagiarism detection */
export const PLAGIARISM_LANGUAGE_MAP: Record<string, "python" | "java" | "c"> =
  {
    python: "python",
    java: "java",
    c: "c",
  }

/** DTO for a file in plagiarism results */
export interface PlagiarismFileDTO {
  id: number
  path: string
  filename: string
  lineCount: number
  studentId?: string
  studentName?: string
}

/** DTO for a plagiarism pair comparison */
export interface PlagiarismPairDTO {
  id: number
  leftFile: PlagiarismFileDTO
  rightFile: PlagiarismFileDTO
  structuralScore: number
  semanticScore: number
  hybridScore: number
  overlap: number
  longest: number
}

/** DTO for a code fragment match */
export interface PlagiarismFragmentDTO {
  id: number
  leftSelection: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
  rightSelection: {
    startRow: number
    startCol: number
    endRow: number
    endCol: number
  }
  length: number
}

/** DTO for plagiarism analysis summary */
export interface PlagiarismSummaryDTO {
  totalFiles: number
  totalPairs: number
  suspiciousPairs: number
  averageSimilarity: number
  maxSimilarity: number
}

/** Convert a Pair to PlagiarismPairDTO */
export function toPlagiarismPairDTO(
  pair: Pair,
  resultId?: number,
): PlagiarismPairDTO {
  return {
    id: resultId ?? pair.id,
    leftFile: {
      id: pair.leftFile.id,
      path: pair.leftFile.path,
      filename: pair.leftFile.filename,
      lineCount: pair.leftFile.lineCount,
      studentId: pair.leftFile.info?.studentId,
      studentName: pair.leftFile.info?.studentName,
    },
    rightFile: {
      id: pair.rightFile.id,
      path: pair.rightFile.path,
      filename: pair.rightFile.filename,
      lineCount: pair.rightFile.lineCount,
      studentId: pair.rightFile.info?.studentId,
      studentName: pair.rightFile.info?.studentName,
    },
    structuralScore: pair.similarity,
    semanticScore: 0,
    hybridScore: 0,
    overlap: pair.overlap,
    longest: pair.longest,
  }
}

/** Convert a Fragment to PlagiarismFragmentDTO */
export function toPlagiarismFragmentDTO(
  fragment: Fragment,
  index: number,
): PlagiarismFragmentDTO {
  return {
    id: index,
    leftSelection: {
      startRow: fragment.leftSelection.startRow,
      startCol: fragment.leftSelection.startCol,
      endRow: fragment.leftSelection.endRow,
      endCol: fragment.leftSelection.endCol,
    },
    rightSelection: {
      startRow: fragment.rightSelection.startRow,
      startCol: fragment.rightSelection.startCol,
      endRow: fragment.rightSelection.endRow,
      endCol: fragment.rightSelection.endCol,
    },
    length: fragment.length,
  }
}

// ============ Gradebook Mappers ============

export interface GradebookAssignmentDTO {
  id: number
  name: string
  totalScore: number
  deadline: string
}

export interface GradebookGradeDTO {
  assignmentId: number
  submissionId: number | null
  grade: number | null
  isOverridden: boolean
  submittedAt: string | null
}

export interface GradebookStudentDTO {
  id: number
  name: string
  email: string
  grades: GradebookGradeDTO[]
}

export interface ClassGradebookDTO {
  assignments: GradebookAssignmentDTO[]
  students: GradebookStudentDTO[]
}

export interface StudentGradeAssignmentDTO {
  assignmentId: number
  assignmentName: string
  totalScore: number
  deadline: string
  grade: number | null
  isOverridden: boolean
  feedback: string | null
  submittedAt: string | null
}

export interface StudentGradeClassDTO {
  classId: number
  className: string
  teacherName: string
  assignments: StudentGradeAssignmentDTO[]
}

export function toClassGradebookDTO(gradebook: {
  assignments: Array<{
    id: number
    name: string
    totalScore: number
    deadline: Date
  }>
  students: Array<{
    id: number
    name: string
    email: string
    grades: Array<{
      assignmentId: number
      submissionId: number | null
      grade: number | null
      isOverridden: boolean
      submittedAt: Date | null
    }>
  }>
}): ClassGradebookDTO {
  return {
    assignments: gradebook.assignments.map((a) => ({
      id: a.id,
      name: a.name,
      totalScore: a.totalScore,
      deadline: a.deadline.toISOString() ?? "",
    })),
    students: gradebook.students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      grades: s.grades.map((g) => ({
        assignmentId: g.assignmentId,
        submissionId: g.submissionId,
        grade: g.grade,
        isOverridden: g.isOverridden,
        submittedAt: g.submittedAt?.toISOString() ?? null,
      })),
    })),
  }
}

export function toStudentGradesDTO(
  grades: Array<{
    classId: number
    className: string
    teacherName: string
    assignments: Array<{
      assignmentId: number
      assignmentName: string
      totalScore: number
      deadline: Date
      grade: number | null
      isOverridden: boolean
      feedback: string | null
      submittedAt: Date | null
    }>
  }>,
): StudentGradeClassDTO[] {
  return grades.map((c) => ({
    classId: c.classId,
    className: c.className,
    teacherName: c.teacherName,
    assignments: c.assignments.map((a) => ({
      assignmentId: a.assignmentId,
      assignmentName: a.assignmentName,
      totalScore: a.totalScore,
      deadline: a.deadline.toISOString() ?? "",
      grade: a.grade,
      isOverridden: a.isOverridden,
      feedback: a.feedback,
      submittedAt: a.submittedAt?.toISOString() ?? null,
    })),
  }))
}
