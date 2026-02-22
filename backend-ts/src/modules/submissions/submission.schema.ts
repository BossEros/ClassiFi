import { z } from "zod"

/** Submission response schema */
export const SubmissionResponseSchema = z.object({
  id: z.number(),
  assignmentId: z.number(),
  studentId: z.number(),
  fileName: z.string(),
  filePath: z.string(),
  fileSize: z.number(),
  submissionNumber: z.number(),
  submittedAt: z.string(),
  isLatest: z.boolean(),
  grade: z.number().nullable(),
  studentName: z.string().optional(),
  assignmentName: z.string().optional(),
})

export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>

/** Submit assignment response schema */
export const SubmitAssignmentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  submission: SubmissionResponseSchema.optional(),
})

export type SubmitAssignmentResponse = z.infer<
  typeof SubmitAssignmentResponseSchema
>

/** Submission list response schema */
export const SubmissionListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  submissions: z.array(SubmissionResponseSchema),
})

export type SubmissionListResponse = z.infer<
  typeof SubmissionListResponseSchema
>

/** Submission history response schema */
export const SubmissionHistoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  submissions: z.array(SubmissionResponseSchema),
  totalSubmissions: z.number(),
})

export type SubmissionHistoryResponse = z.infer<
  typeof SubmissionHistoryResponseSchema
>

/** Submission detail response schema */
export const SubmissionDetailResponseSchema = SubmissionResponseSchema.extend({
  assignmentName: z.string().optional(),
  className: z.string().optional(),
})

export type SubmissionDetailResponse = z.infer<
  typeof SubmissionDetailResponseSchema
>

// ============================================================================
// Param Schemas (from controller)
// ============================================================================

/** Submission ID param schema */
export const SubmissionIdParamSchema = z.object({
  submissionId: z.coerce.number().int().min(1),
})

export type SubmissionIdParam = z.infer<typeof SubmissionIdParamSchema>

/** History params schema (assignmentId + studentId) */
export const HistoryParamsSchema = z.object({
  assignmentId: z.coerce.number().int().min(1),
  studentId: z.coerce.number().int().min(1),
})

export type HistoryParams = z.infer<typeof HistoryParamsSchema>

// ============================================================================
// Response Schemas (from controller)
// ============================================================================

/** Download response schema */
export const DownloadResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  downloadUrl: z.string(),
})

export type DownloadResponse = z.infer<typeof DownloadResponseSchema>

/** Submission content response schema */
export const SubmissionContentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  content: z.string(),
  language: z.string().optional(),
})

export type SubmissionContentResponse = z.infer<
  typeof SubmissionContentResponseSchema
>
