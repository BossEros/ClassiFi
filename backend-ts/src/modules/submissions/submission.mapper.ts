import type { Submission } from "@/models/index.js"

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
  isGradeOverridden: boolean
  overrideReason: string | null
  overriddenAt: string | null
  teacherFeedback: string | null
  feedbackGivenAt: string | null
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
    isGradeOverridden: submission.isGradeOverridden ?? false,
    overrideReason: submission.overrideReason ?? null,
    overriddenAt: submission.overriddenAt?.toISOString() ?? null,
    teacherFeedback: submission.teacherFeedback ?? null,
    feedbackGivenAt: submission.feedbackGivenAt?.toISOString() ?? null,
    ...extras,
  }
}
