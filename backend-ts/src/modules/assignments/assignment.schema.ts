import { z } from "zod"
import { PROGRAMMING_LANGUAGES } from "@/shared/constants.js"

/** Programming language enum - derived from shared constant */
export const ProgrammingLanguageSchema = z.enum(PROGRAMMING_LANGUAGES)
export type ProgrammingLanguage = z.infer<typeof ProgrammingLanguageSchema>

/** Late penalty tier schema */
export const LatePenaltyTierSchema = z.object({
  id: z.string().optional(),
  hoursLate: z.number().min(0),
  penaltyPercent: z.number().min(0).max(100),
})

/** Late penalty configuration schema */
export const LatePenaltyConfigSchema = z.object({
  tiers: z.array(LatePenaltyTierSchema),
  rejectAfterHours: z.number().min(0).nullable(),
})

/** Create assignment request schema */
export const CreateAssignmentRequestSchema = z.object({
  teacherId: z.number().int().min(1),
  assignmentName: z.string().min(1).max(150),
  instructions: z.string().max(5000).default(""),
  instructionsImageUrl: z.string().url().max(2000).nullable().optional(),
  programmingLanguage: ProgrammingLanguageSchema,
  deadline: z.string().datetime().nullable().optional(),
  allowResubmission: z.boolean().default(true),
  maxAttempts: z.number().int().min(1).max(99).nullable().optional(),
  templateCode: z.string().max(50000).nullable().optional(),
  totalScore: z.number().int().min(1).default(100),
  scheduledDate: z.string().datetime().nullable().optional(),
  allowLateSubmissions: z.boolean().default(false),
  latePenaltyConfig: LatePenaltyConfigSchema.nullable().optional(),
})

export type CreateAssignmentRequest = z.infer<
  typeof CreateAssignmentRequestSchema
>

/** Update assignment request schema */
export const UpdateAssignmentRequestSchema = z.object({
  teacherId: z.number().int().min(1),
  assignmentName: z.string().min(1).max(150).optional(),
  instructions: z.string().max(5000).optional(),
  instructionsImageUrl: z.string().url().max(2000).nullable().optional(),
  programmingLanguage: ProgrammingLanguageSchema.optional(),
  deadline: z.string().datetime().nullable().optional(),
  allowResubmission: z.boolean().optional(),
  maxAttempts: z.number().int().min(1).max(99).nullable().optional(),
  templateCode: z.string().max(50000).nullable().optional(),
  totalScore: z.number().int().min(1).optional(),
  scheduledDate: z.string().datetime().nullable().optional(),
  allowLateSubmissions: z.boolean().optional(),
  latePenaltyConfig: LatePenaltyConfigSchema.nullable().optional(),
})

export type UpdateAssignmentRequest = z.infer<
  typeof UpdateAssignmentRequestSchema
>

/** Assignment response schema */
export const AssignmentResponseSchema = z.object({
  id: z.number(),
  classId: z.number(),
  assignmentName: z.string(),
  instructions: z.string(),
  instructionsImageUrl: z.string().nullable().optional(),
  programmingLanguage: z.string(),
  deadline: z.string().nullable(),
  allowResubmission: z.boolean(),
  maxAttempts: z.number().nullable().optional(),
  createdAt: z.string(),
  isActive: z.boolean(),
  templateCode: z.string().nullable().optional(),
  hasTemplateCode: z.boolean().optional(),
  totalScore: z.number().optional(),
  scheduledDate: z.string().nullable().optional(),
  allowLateSubmissions: z.boolean().optional(),
  latePenaltyConfig: LatePenaltyConfigSchema.nullable().optional(),
  submissionCount: z.number().optional(),
  hasSubmitted: z.boolean().optional(),
  submittedAt: z.string().nullable().optional(),
  grade: z.number().nullable().optional(),
  maxGrade: z.number().optional(),
})

export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>

/** Assignment detail response schema */
export const AssignmentDetailResponseSchema = AssignmentResponseSchema.extend({
  className: z.string().optional(),
  teacherName: z.string().optional(),
})

export type AssignmentDetailResponse = z.infer<
  typeof AssignmentDetailResponseSchema
>

// ============================================================================
// Param & Query Schemas
// ============================================================================

/** Assignment ID param schema */
export const AssignmentIdParamSchema = z.object({
  assignmentId: z.coerce.number().int().min(1),
})

export type AssignmentIdParam = z.infer<typeof AssignmentIdParamSchema>

// ============================================================================
// Response Schemas (for controller routes)
// ============================================================================

/** Get assignment response schema */
export const GetAssignmentResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  assignment: AssignmentDetailResponseSchema,
})

export type GetAssignmentResponse = z.infer<typeof GetAssignmentResponseSchema>

/** Update assignment response schema */
export const UpdateAssignmentResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  assignment: AssignmentResponseSchema,
})

export type UpdateAssignmentResponse = z.infer<
  typeof UpdateAssignmentResponseSchema
>

/** Assignment list response schema */
export const AssignmentListResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  assignments: z.array(AssignmentResponseSchema),
})

export type AssignmentListResponse = z.infer<
  typeof AssignmentListResponseSchema
>

/** Create assignment response schema */
export const CreateAssignmentResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  assignment: AssignmentResponseSchema,
})

export type CreateAssignmentResponse = z.infer<
  typeof CreateAssignmentResponseSchema
>
