import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { ModuleService } from "@/modules/modules/module.service.js"
import { validateBody, validateParams, validateQuery } from "@/api/plugins/zod-validation.js"
import { ClassIdParamSchema, type ClassIdParam } from "@/modules/classes/class.schema.js"
import {
  CreateModuleRequestSchema,
  RenameModuleRequestSchema,
  ToggleModulePublishRequestSchema,
  DeleteModuleRequestSchema,
  ModuleIdParamSchema,
  type CreateModuleRequest,
  type RenameModuleRequest,
  type ToggleModulePublishRequest,
  type DeleteModuleRequest,
  type ModuleIdParam,
} from "@/modules/modules/module.schema.js"
import { z } from "zod"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/** Query schema for listing modules */
const GetModulesQuerySchema = z.object({
  isStudent: z.string().default("false").transform((val) => val === "true"),
})

type GetModulesQuery = z.infer<typeof GetModulesQuerySchema>

/**
 * Registers module routes nested under /api/v1/classes/:classId/modules
 * and standalone /api/v1/modules/:moduleId routes.
 *
 * @param app - Fastify application instance.
 */
export async function moduleClassRoutes(app: FastifyInstance): Promise<void> {
  const moduleService = container.resolve<ModuleService>(DI_TOKENS.services.module)

  /**
   * POST /:classId/modules
   * Create a new module in a class
   */
  app.post("/:classId/modules", {
    preHandler: [
      validateParams(ClassIdParamSchema),
      validateBody(CreateModuleRequestSchema),
    ],
    async handler(request, reply) {
      const { classId } = request.validatedParams as ClassIdParam
      const { teacherId, name } = request.validatedBody as CreateModuleRequest

      const createdModule = await moduleService.createModule({
        classId,
        teacherId,
        name,
      })

      return reply.status(201).send({
        success: true,
        message: "Module created successfully",
        module: createdModule,
      })
    },
  })

  /**
   * GET /:classId/modules
   * Get all modules for a class with their assignments
   */
  app.get("/:classId/modules", {
    preHandler: [
      validateParams(ClassIdParamSchema),
      validateQuery(GetModulesQuerySchema),
    ],
    async handler(request, reply) {
      const { classId } = request.validatedParams as ClassIdParam
      const { isStudent } = request.validatedQuery as GetModulesQuery

      const moduleList = await moduleService.getModulesWithAssignments(classId, isStudent)

      return reply.send({
        success: true,
        message: "Modules retrieved successfully",
        modules: moduleList,
      })
    },
  })
}

/**
 * Registers standalone module routes under /api/v1/modules/:moduleId.
 *
 * @param app - Fastify application instance.
 */
export async function moduleRoutes(app: FastifyInstance): Promise<void> {
  const moduleService = container.resolve<ModuleService>(DI_TOKENS.services.module)

  /**
   * PUT /:moduleId
   * Rename a module
   */
  app.put("/:moduleId", {
    preHandler: [
      validateParams(ModuleIdParamSchema),
      validateBody(RenameModuleRequestSchema),
    ],
    async handler(request, reply) {
      const { moduleId } = request.validatedParams as ModuleIdParam
      const { teacherId, name } = request.validatedBody as RenameModuleRequest

      const updatedModule = await moduleService.renameModule({
        moduleId,
        teacherId,
        name,
      })

      return reply.send({
        success: true,
        message: "Module renamed successfully",
        module: updatedModule,
      })
    },
  })

  /**
   * PATCH /:moduleId/publish
   * Toggle module publish state
   */
  app.patch("/:moduleId/publish", {
    preHandler: [
      validateParams(ModuleIdParamSchema),
      validateBody(ToggleModulePublishRequestSchema),
    ],
    async handler(request, reply) {
      const { moduleId } = request.validatedParams as ModuleIdParam
      const { teacherId, isPublished } = request.validatedBody as ToggleModulePublishRequest

      const updatedModule = await moduleService.toggleModulePublish({
        moduleId,
        teacherId,
        isPublished,
      })

      return reply.send({
        success: true,
        message: `Module ${isPublished ? "published" : "unpublished"} successfully`,
        module: updatedModule,
      })
    },
  })

  /**
   * DELETE /:moduleId
   * Delete a module and all its assignments
   */
  app.delete("/:moduleId", {
    preHandler: [
      validateParams(ModuleIdParamSchema),
      validateBody(DeleteModuleRequestSchema),
    ],
    async handler(request, reply) {
      const { moduleId } = request.validatedParams as ModuleIdParam
      const { teacherId } = request.validatedBody as DeleteModuleRequest

      await moduleService.deleteModule({ moduleId, teacherId })

      return reply.send({
        success: true,
        message: "Module deleted successfully",
      })
    },
  })
}
