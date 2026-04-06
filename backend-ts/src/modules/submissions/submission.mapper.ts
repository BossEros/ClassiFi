import type { Submission } from "@/modules/submissions/submission.model.js"
import { buildSubmissionGradeComputation, type GradeBreakdown } from "@/modules/submissions/submission-grade.js"

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
  gradeBreakdown: GradeBreakdown
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
    similarityScore?: number | null
  },
): SubmissionDTO {
  const submissionGradeComputation = buildSubmissionGradeComputation({
    grade: submission.grade,
    originalGrade: submission.originalGrade,
    isGradeOverridden: submission.isGradeOverridden,
    overrideGrade: submission.overrideGrade,
    penaltyApplied: submission.penaltyApplied,
    similarityPenaltyApplied: submission.similarityPenaltyApplied,
    similarityScore: extras?.similarityScore ?? null,
  })

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
    grade: submissionGradeComputation.effectiveGrade,
    gradeBreakdown: submissionGradeComputation.gradeBreakdown,
    isGradeOverridden: submission.isGradeOverridden ?? false,
    overrideReason: submission.overrideReason ?? null,
    overriddenAt: submission.overriddenAt?.toISOString() ?? null,
    teacherFeedback: submission.teacherFeedback ?? null,
    feedbackGivenAt: submission.feedbackGivenAt?.toISOString() ?? null,
    ...extras,
  }
}
