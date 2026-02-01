import { z } from "zod"
import { SuccessResponseSchema } from "./common.schema.js"

// Re-export for backwards compatibility
export { SuccessResponseSchema }

// ============================================================================
// Late Penalty Configuration Schemas
// ============================================================================

/** Penalty tier schema */
export const PenaltyTierSchema = z.object({
  hoursAfterGrace: z.number().min(0),
  penaltyPercent: z.number().min(0).max(100),
})

export type PenaltyTier = z.infer<typeof PenaltyTierSchema>

/** Late penalty configuration schema */
export const LatePenaltyConfigSchema = z.object({
  gracePeriodHours: z.number().min(0),
  tiers: z.array(PenaltyTierSchema),
  rejectAfterHours: z.number().nullable(),
})

export type LatePenaltyConfigInput = z.infer<typeof LatePenaltyConfigSchema>

/** Penalty result schema */
export const PenaltyResultSchema = z.object({
  isLate: z.boolean(),
  hoursLate: z.number(),
  penaltyPercent: z.number(),
  gradeMultiplier: z.number(),
  tierLabel: z.string(),
})

export type PenaltyResult = z.infer<typeof PenaltyResultSchema>

// ============================================================================
// Grade Entry Schemas
// ============================================================================

/** Single grade entry for a student-assignment pair */
export const GradeEntrySchema = z.object({
  assignmentId: z.number(),
  submissionId: z.number().nullable(),
  grade: z.number().nullable(),
  isOverridden: z.boolean(),
  submittedAt: z.string().nullable(),
})

export type GradeEntry = z.infer<typeof GradeEntrySchema>

/** Assignment info in gradebook */
export const GradebookAssignmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  totalScore: z.number(),
  deadline: z.string(),
})

export type GradebookAssignment = z.infer<typeof GradebookAssignmentSchema>

/** Student row in gradebook */
export const GradebookStudentSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  grades: z.array(GradeEntrySchema),
})

export type GradebookStudent = z.infer<typeof GradebookStudentSchema>

// ============================================================================
// Response Schemas
// ============================================================================

/** Class gradebook response */
export const ClassGradebookResponseSchema = z.object({
  success: z.boolean(),
  assignments: z.array(GradebookAssignmentSchema),
  students: z.array(GradebookStudentSchema),
})

export type ClassGradebookResponse = z.infer<
  typeof ClassGradebookResponseSchema
>

/** Student grades response */
export const StudentGradesResponseSchema = z.object({
  success: z.boolean(),
  grades: z.array(
    z.object({
      classId: z.number(),
      className: z.string(),
      teacherName: z.string(),
      assignments: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          totalScore: z.number(),
          deadline: z.string(),
          grade: z.number().nullable(),
          isOverridden: z.boolean(),
          feedback: z.string().nullable(),
          submittedAt: z.string().nullable(),
        }),
      ),
    }),
  ),
})

export type StudentGradesResponse = z.infer<typeof StudentGradesResponseSchema>

/** Class statistics response */
export const ClassStatisticsResponseSchema = z.object({
  success: z.boolean(),
  statistics: z.object({
    classAverage: z.number().nullable(),
    submissionRate: z.number(),
    totalStudents: z.number(),
    totalAssignments: z.number(),
  }),
})

export type ClassStatisticsResponse = z.infer<
  typeof ClassStatisticsResponseSchema
>

/** Student rank response */
export const StudentRankResponseSchema = z.object({
  success: z.boolean(),
  rank: z.number().nullable(),
  totalStudents: z.number().nullable(),
  percentile: z.number().nullable(),
})

export type StudentRankResponse = z.infer<typeof StudentRankResponseSchema>

/** Late penalty config response */
export const LatePenaltyConfigResponseSchema = z.object({
  success: z.boolean(),
  enabled: z.boolean(),
  config: LatePenaltyConfigSchema.nullable(),
})

export type LatePenaltyConfigResponse = z.infer<
  typeof LatePenaltyConfigResponseSchema
>

// ============================================================================
// Request Body Schemas
// ============================================================================

/** Grade override request body */
export const GradeOverrideBodySchema = z.object({
  grade: z.number().min(0),
  feedback: z.string().nullable().optional(),
})

export type GradeOverrideBody = z.infer<typeof GradeOverrideBodySchema>

/** Late penalty config update request body */
export const LatePenaltyUpdateBodySchema = z.object({
  enabled: z.boolean(),
  config: LatePenaltyConfigSchema.optional(),
})

export type LatePenaltyUpdateBody = z.infer<typeof LatePenaltyUpdateBodySchema>

// ============================================================================
// Param Schemas
// ============================================================================

/** Class ID param */
export const ClassIdParamSchema = z.object({
  classId: z.string(),
})

export type ClassIdParam = z.infer<typeof ClassIdParamSchema>

/** Student ID param */
export const StudentIdParamSchema = z.object({
  studentId: z.string(),
})

export type StudentIdParam = z.infer<typeof StudentIdParamSchema>

/** Student + Class ID params */
export const StudentClassParamsSchema = z.object({
  studentId: z.string(),
  classId: z.string(),
})

export type StudentClassParams = z.infer<typeof StudentClassParamsSchema>

/** Submission ID param */
export const SubmissionIdParamSchema = z.object({
  submissionId: z.string(),
})

export type SubmissionIdParam = z.infer<typeof SubmissionIdParamSchema>

/** Assignment ID param */
export const AssignmentIdParamSchema = z.object({
  id: z.string(),
})

export type AssignmentIdParam = z.infer<typeof AssignmentIdParamSchema>

// ============================================================================
// Export CSV Response Schema
// ============================================================================

/** CSV export response */
export const ExportCSVResponseSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
  contentType: z.string(),
  data: z.string(),
})

export type ExportCSVResponse = z.infer<typeof ExportCSVResponseSchema>

// Note: SuccessResponseSchema is imported from common.schema.ts
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>
