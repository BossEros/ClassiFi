import { z } from "zod"

export const DiffFragmentExplanationCategorySchema = z.enum([
  "identifier_renaming",
  "conditional_logic_changed",
  "loop_logic_changed",
  "output_logic_changed",
  "statement_added",
  "statement_removed",
  "comment_changed",
  "code_changed",
])

export const DiffFragmentExplanationSourceSchema = z.enum(["ai", "fallback"])
export const DiffFragmentExplanationTargetKindSchema = z.enum([
  "changed",
  "added",
  "removed",
])

export const DiffFragmentExplanationSchema = z
  .object({
    category: DiffFragmentExplanationCategorySchema,
    label: z.string().trim().min(1).max(80),
    reasons: z.array(z.string().trim().min(1).max(500)).min(1).max(3),
    confidence: z.number().min(0).max(1),
    source: DiffFragmentExplanationSourceSchema,
  })
  .strict()

export const DiffCodeSelectionSchema = z
  .object({
    startRow: z.number(),
    startCol: z.number(),
    endRow: z.number(),
    endCol: z.number(),
  })
  .strict()

export const DiffFragmentExplanationTargetSchema = z
  .object({
    targetId: z.string().trim().min(1),
    targetKind: DiffFragmentExplanationTargetKindSchema,
    leftSelection: DiffCodeSelectionSchema.nullable(),
    rightSelection: DiffCodeSelectionSchema.nullable(),
    explanation: DiffFragmentExplanationSchema,
  })
  .strict()

export type DiffFragmentExplanationCategory = z.infer<
  typeof DiffFragmentExplanationCategorySchema
>

export type DiffFragmentExplanationSource = z.infer<
  typeof DiffFragmentExplanationSourceSchema
>

export type DiffFragmentExplanationTargetKind = z.infer<
  typeof DiffFragmentExplanationTargetKindSchema
>

export type DiffFragmentExplanation = z.infer<
  typeof DiffFragmentExplanationSchema
>

export type DiffFragmentExplanationTarget = z.infer<
  typeof DiffFragmentExplanationTargetSchema
>
