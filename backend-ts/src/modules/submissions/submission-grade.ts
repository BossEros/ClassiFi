export interface SubmissionGradeComputationInput {
  grade: number | null | undefined
  originalGrade: number | null | undefined
  isGradeOverridden: boolean
  overrideGrade: number | null | undefined
  penaltyApplied: number | null | undefined
  similarityPenaltyApplied: number | null | undefined
  similarityScore: number | null | undefined
}

export interface GradeBreakdown {
  originalGrade: number | null
  latePenaltyPercent: number
  similarityPenaltyPercent: number
  similarityScore: number | null
  finalGrade: number | null
  effectiveGrade: number | null
  isOverridden: boolean
}

export interface SubmissionGradeComputationResult {
  automaticGrade: number | null
  effectiveGrade: number | null
  gradeBreakdown: GradeBreakdown
}

export function buildSubmissionGradeComputation(
  submission: SubmissionGradeComputationInput,
): SubmissionGradeComputationResult {
  const automaticGrade = submission.grade ?? null
  let effectiveGrade: number | null = automaticGrade

  if (submission.isGradeOverridden) {
    effectiveGrade = submission.overrideGrade ?? effectiveGrade
  }

  const gradeBreakdown: GradeBreakdown = {
    originalGrade: submission.originalGrade ?? null,
    latePenaltyPercent: submission.penaltyApplied ?? 0,
    similarityPenaltyPercent: submission.similarityPenaltyApplied ?? 0,
    similarityScore: submission.similarityScore ?? null,
    finalGrade: automaticGrade,
    effectiveGrade,
    isOverridden: submission.isGradeOverridden,
  }

  return {
    automaticGrade,
    effectiveGrade,
    gradeBreakdown,
  }
}
