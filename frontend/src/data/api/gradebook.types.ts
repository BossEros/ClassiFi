import type {
  ClassStatistics,
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

/** Penalty tier for late submissions */
export type { PenaltyTier }

/** Late penalty configuration */
export type { LatePenaltyConfig }

/** Penalty calculation result */
export type { PenaltyResult }

/** Single grade entry in gradebook */
export type { GradeEntry }

/** Assignment info in gradebook */
export type { GradebookAssignment }

/** Student row in gradebook */
export type { GradebookStudent }

/** Class gradebook data */
export type { ClassGradebook }

/** Student grade for an assignment */
export type { StudentGradeEntry }

/** Student grades for a class */
export type { StudentClassGrades }

/** Class statistics */
export type { ClassStatistics }

/** Student rank in class */
export type { StudentRank }

export interface ClassGradebookResponse {
  success: boolean
  assignments: GradebookAssignment[]
  students: GradebookStudent[]
}

export interface StudentGradesResponse {
  success: boolean
  grades: StudentClassGrades[]
}

export interface ClassStatisticsResponse {
  success: boolean
  statistics: ClassStatistics
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
