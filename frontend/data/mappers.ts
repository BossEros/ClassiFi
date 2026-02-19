import type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
} from "@/shared/types/submission"
import type {
  SubmissionDTO,
  AssignmentDetailDTO,
  AssignmentDetail,
  ProgrammingLanguage,
} from "@/data/api/types"
import { VALID_PROGRAMMING_LANGUAGES } from "@/data/api/types"

/**
 * Maps a raw submission DTO to a domain Submission model.
 */
export function mapSubmission(sub: SubmissionDTO): Submission {
  return {
    id: sub.id,
    assignmentId: sub.assignmentId,
    studentId: sub.studentId,
    fileName: sub.fileName,
    fileSize: sub.fileSize,
    submissionNumber: sub.submissionNumber,
    submittedAt:
      typeof sub.submittedAt === "string"
        ? sub.submittedAt
        : sub.submittedAt.toISOString(),
    isLatest: sub.isLatest,
    grade: sub.grade ?? undefined,
  }
}

/**
 * Maps a raw submission with assignment name (used in student views).
 * Throws an error if required assignmentName is missing.
 */
export function mapSubmissionWithAssignment(
  sub: SubmissionDTO,
): SubmissionWithAssignment {
  if (!sub.assignmentName) {
    throw new Error(
      `[mapSubmissionWithAssignment] Missing required property 'assignmentName' for submission ID ${sub.id}`,
    )
  }

  return {
    ...mapSubmission(sub),
    assignmentName: sub.assignmentName!,
  }
}

/**
 * Maps a raw submission with student name (used in teacher views).
 * Throws an error if required studentName is missing.
 */
export function mapSubmissionWithStudent(
  sub: SubmissionDTO,
): SubmissionWithStudent {
  if (!sub.studentName) {
    throw new Error(
      `[mapSubmissionWithStudent] Missing required property 'studentName' for submission ID ${sub.id}`,
    )
  }

  return {
    ...mapSubmission(sub),
    studentName: sub.studentName,
  }
}

/**
 * Validates if a string is a valid programming language.
 */
function isValidProgrammingLanguage(lang: string): lang is ProgrammingLanguage {
  return (VALID_PROGRAMMING_LANGUAGES as readonly string[]).includes(lang)
}

/**
 * Maps assignment detail DTO to domain model with proper type validation and defaults.
 */
export function mapAssignmentDetail(
  dto: AssignmentDetailDTO,
): AssignmentDetail {
  // Validate programming language with runtime check
  const programmingLanguage = isValidProgrammingLanguage(
    dto.programmingLanguage,
  )
    ? dto.programmingLanguage
    : "python" // Safe fallback to default language

  if (!isValidProgrammingLanguage(dto.programmingLanguage)) {
    console.warn(
      `[mapAssignmentDetail] Invalid programming language "${dto.programmingLanguage}" for assignment ID ${dto.id}. Defaulting to "python".`,
    )
  }

  return {
    id: dto.id,
    classId: dto.classId,
    className: dto.className,
    assignmentName: dto.assignmentName,
    instructions: dto.instructions,
    instructionsImageUrl: dto.instructionsImageUrl ?? null,
    programmingLanguage,
    deadline: dto.deadline,
    allowResubmission: dto.allowResubmission,
    maxAttempts: dto.maxAttempts ?? null,
    isActive: dto.isActive,
    createdAt: dto.createdAt,
    templateCode: dto.templateCode ?? null,
    hasTemplateCode: dto.hasTemplateCode ?? false,
    totalScore: dto.totalScore,
    scheduledDate: dto.scheduledDate ?? null,
    allowLateSubmissions: dto.allowLateSubmissions ?? false,
    latePenaltyConfig: dto.latePenaltyConfig ?? null,
    testCases: dto.testCases ?? [],
  }
}
