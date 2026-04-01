export interface SubmissionGradeComputationInput {
  grade: number | null | undefined
  isGradeOverridden: boolean
  overrideGrade: number | null | undefined
}

export interface SubmissionGradeComputationResult {
  automaticGrade: number | null
  effectiveGrade: number | null
}

export function buildSubmissionGradeComputation(
  submission: SubmissionGradeComputationInput,
): SubmissionGradeComputationResult {
  const automaticGrade = submission.grade ?? null
  let effectiveGrade: number | null = automaticGrade

  if (submission.isGradeOverridden) {
    effectiveGrade = submission.overrideGrade ?? effectiveGrade
  }

  return {
    automaticGrade,
    effectiveGrade,
  }
}
