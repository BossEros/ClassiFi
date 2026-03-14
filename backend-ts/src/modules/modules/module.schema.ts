import { z } from "zod"

/** Create module request schema */
export const CreateModuleRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
})

export type CreateModuleRequest = z.infer<typeof CreateModuleRequestSchema>

/** Rename module request schema */
export const RenameModuleRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
})

export type RenameModuleRequest = z.infer<typeof RenameModuleRequestSchema>

/** Toggle module publish request schema */
export const ToggleModulePublishRequestSchema = z.object({
  isPublished: z.boolean(),
})

export type ToggleModulePublishRequest = z.infer<typeof ToggleModulePublishRequestSchema>

/** Delete module request schema */
export const DeleteModuleRequestSchema = z.object({})

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
