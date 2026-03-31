import { z } from "zod"

// ============================================================================
// Param Schemas
// ============================================================================

/** Assignment ID param for cross-class analysis trigger */
export const CrossClassAssignmentIdParamSchema = z.object({
  assignmentId: z.coerce.number().int().min(1),
})

export type CrossClassAssignmentIdParam = z.infer<typeof CrossClassAssignmentIdParamSchema>

/** Report ID param for cross-class reports */
export const CrossClassReportIdParamSchema = z.object({
  reportId: z.coerce.number().int().min(1),
})

export type CrossClassReportIdParam = z.infer<typeof CrossClassReportIdParamSchema>

/** Result ID param for cross-class result details */
export const CrossClassResultIdParamSchema = z.object({
  resultId: z.coerce.number().int().min(1),
})

export type CrossClassResultIdParam = z.infer<typeof CrossClassResultIdParamSchema>
