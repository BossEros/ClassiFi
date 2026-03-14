import { z } from "zod"

/** Create module request schema */
export const CreateModuleRequestSchema = z.object({
  teacherId: z.number().int().min(1),
  name: z.string().min(1).max(255).trim(),
})

export type CreateModuleRequest = z.infer<typeof CreateModuleRequestSchema>

/** Rename module request schema */
export const RenameModuleRequestSchema = z.object({
  teacherId: z.number().int().min(1),
  name: z.string().min(1).max(255).trim(),
})

export type RenameModuleRequest = z.infer<typeof RenameModuleRequestSchema>

/** Toggle module publish request schema */
export const ToggleModulePublishRequestSchema = z.object({
  teacherId: z.number().int().min(1),
  isPublished: z.boolean(),
})

export type ToggleModulePublishRequest = z.infer<typeof ToggleModulePublishRequestSchema>

/** Delete module request schema */
export const DeleteModuleRequestSchema = z.object({
  teacherId: z.number().int().min(1),
})

export type DeleteModuleRequest = z.infer<typeof DeleteModuleRequestSchema>

/** Module ID param schema */
export const ModuleIdParamSchema = z.object({
  moduleId: z.coerce.number().int().min(1),
})

export type ModuleIdParam = z.infer<typeof ModuleIdParamSchema>

/** Module response schema */
export const ModuleResponseSchema = z.object({
  id: z.number(),
  classId: z.number(),
  name: z.string(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
