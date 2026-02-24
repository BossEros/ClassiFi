import type {
  GradeEntry,
  GradebookAssignment,
  GradebookStudent,
  LatePenaltyConfig,
  PenaltyResult,
  PenaltyTier,
  StudentClassGrades,
  StudentGradeEntry,
  ClassGradebook,
  StudentRank,
} from "@/shared/types/gradebook"

export type {
  PenaltyTier,
  LatePenaltyConfig,
  PenaltyResult,
  StudentGradeEntry,
  StudentClassGrades,
  ClassGradebook,
  GradebookStudent,
  GradebookAssignment,
  GradeEntry,
  StudentRank,
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
