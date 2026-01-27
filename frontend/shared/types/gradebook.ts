export interface GradeEntry {
  assignmentId: number;
  submissionId: number | null;
  grade: number | null;
  isOverridden: boolean;
  submittedAt: string | null;
}

/** Penalty tier for late submissions */
export interface PenaltyTier {
  id: string;
  hoursAfterGrace: number;
  penaltyPercent: number;
}

/** Late penalty configuration */
export interface LatePenaltyConfig {
  gracePeriodHours: number;
  tiers: PenaltyTier[];
  rejectAfterHours: number | null;
}

/** Penalty calculation result */
export interface PenaltyResult {
  isLate: boolean;
  hoursLate: number;
  penaltyPercent: number;
  gradeMultiplier: number;
  tierLabel: string;
}

/** Student grade for an assignment */
export interface StudentGradeEntry {
  assignmentId: number;
  assignmentName: string;
  totalScore: number;
  deadline: string;
  grade: number | null;
  isOverridden: boolean;
  feedback: string | null;
  submittedAt: string | null;
  isLate?: boolean;
  penaltyApplied?: number;
}

/** Student grades for a class */
export interface StudentClassGrades {
  classId: number;
  className: string;
  teacherName: string;
  assignments: StudentGradeEntry[];
}

/** Assignment info in gradebook */
export interface GradebookAssignment {
  id: number;
  name: string;
  totalScore: number;
  deadline: string;
}

/** Student row in gradebook */
export interface GradebookStudent {
  id: number;
  name: string;
  email: string;
  grades: GradeEntry[];
}

/** Class gradebook data */
export interface ClassGradebook {
  assignments: GradebookAssignment[];
  students: GradebookStudent[];
}

/** Class statistics */
export interface ClassStatistics {
  classAverage: number | null;
  submissionRate: number;
  totalStudents: number;
  totalAssignments: number;
}

/** Student rank in class */
export interface StudentRank {
  rank: number | null;
  totalStudents: number | null;
  percentile: number | null;
}
