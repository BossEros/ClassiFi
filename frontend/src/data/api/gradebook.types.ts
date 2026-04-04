export interface GradeEntry {
  assignmentId: number
  submissionId: number | null
  grade: number | null
  isOverridden: boolean
  submittedAt: string | null
}

export interface PenaltyTier {
  id: string
  hoursLate: number
  penaltyPercent: number
}

export interface LatePenaltyConfig {
  tiers: PenaltyTier[]
  rejectAfterHours: number | null
}

export interface PenaltyResult {
  isLate: boolean
  hoursLate: number
  penaltyPercent: number
  gradeMultiplier: number
  tierLabel: string
}

export interface StudentGradeEntry {
  assignmentId: number
  assignmentName: string
  totalScore: number
  deadline: string | null
  grade: number | null
  isOverridden: boolean
  feedback: string | null
  submittedAt: string | null
  isLate?: boolean
  penaltyApplied?: number
}

export interface StudentClassGrades {
  classId: number
  className: string
  teacherName: string
  assignments: StudentGradeEntry[]
}

export interface GradebookAssignment {
  id: number
  name: string
  totalScore: number
  deadline: string | null
}

export interface GradebookStudent {
  id: number
  name: string
  email: string
  grades: GradeEntry[]
}

export interface ClassGradebook {
  assignments: GradebookAssignment[]
  students: GradebookStudent[]
}

export interface StudentRank {
  rank: number | null
  totalStudents: number | null
  percentile: number | null
}

export interface ClassGradebookResponse {
  success: boolean
  assignments: GradebookAssignment[]
  students: GradebookStudent[]
}

export interface StudentGradesResponse {
  success: boolean
  grades: StudentClassGrades[]
}

export interface StudentRankResponse {
  success: boolean
  rank: number | null
  totalStudents: number | null
  percentile: number | null
}

export interface LatePenaltyConfigResponse {
  success: boolean
  enabled: boolean
  config: LatePenaltyConfig | null
}

export interface GradeOverrideRequest {
  grade: number
  feedback?: string | null
}

export interface LatePenaltyUpdateRequest {
  enabled: boolean
  config?: LatePenaltyConfig
}

export interface SimilarityPenaltyBand {
  id: string
  minHybridScore: number
  penaltyPercent: number
}

export interface SimilarityPenaltyConfig {
  warningThreshold: number
  deductionBands: SimilarityPenaltyBand[]
  maxPenaltyPercent: number
  applyHighestPairOnly: boolean
}

export interface SimilarityPenaltyConfigResponse {
  success: boolean
  enabled: boolean
  config: SimilarityPenaltyConfig | null
}

export interface SimilarityPenaltyUpdateRequest {
  enabled: boolean
  config?: SimilarityPenaltyConfig
}
