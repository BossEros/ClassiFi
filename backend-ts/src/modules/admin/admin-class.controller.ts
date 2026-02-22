import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminClassService } from "@/modules/admin/admin-class.service.js"
import { adminMiddleware } from "@/api/middlewares/admin.middleware.js"
import {
  validateQuery,
  validateParams,
  validateBody,
} from "@/api/plugins/zod-validation.js"
import {
  ClassFilterQuerySchema,
  ClassParamsSchema,
  CreateClassSchema,
  UpdateClassSchema,
  ReassignTeacherSchema,
  type ClassFilterQuery,
  type ClassParams,
  type CreateClass,
  type UpdateClass,
  type ReassignTeacher,
} from "@/modules/admin/admin.schema.js"
import type { UpdateClassData } from "@/modules/admin/admin.types.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Maps UpdateClass DTO from the API schema to UpdateClassData expected by the service.
 *
 * @param dto - The UpdateClass data from the request body.
 * @returns The mapped UpdateClassData for the service layer.
 */
function mapUpdateClassDtoToServiceData(dto: UpdateClass): UpdateClassData {
  return {
    className: dto.className,
    description: dto.description,
    isActive: dto.isActive,
    yearLevel: dto.yearLevel,
    semester: dto.semester,
    academicYear: dto.academicYear,
    schedule: dto.schedule,
    teacherId: dto.teacherId,
  }
}

/**
 * Registers admin class management routes for class CRUD operations.
 *
 * Provides endpoints for administrators to create, read, update, and delete classes,
 * as well as manage teacher assignments, archive classes, and retrieve class assignments.
 * All routes require authentication and admin privileges.
 *
 * @param app - The Fastify application instance to register routes on.
 * @returns A promise that resolves when all routes are registered.
 */
export async function adminClassRoutes(app: FastifyInstance): Promise<void> {
  const adminClassService = container.resolve<AdminClassService>(
    DI_TOKENS.services.adminClass,
  )
  const preHandlerMiddlewares = [adminMiddleware]

  /**
   * GET /classes
   * List all classes with filtering
   */
  app.get("/classes", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateQuery(ClassFilterQuerySchema),
    ],
    handler: async (request, reply) => {
      const filterQuery = request.validatedQuery as ClassFilterQuery

      const paginatedClassesResult =
        await adminClassService.getAllClasses(filterQuery)

      return reply.send({ success: true, ...paginatedClassesResult })
    },
  })

  /**
   * GET /classes/:id
   * Get class details by ID
   */
  app.get("/classes/:id", {
    preHandler: [...preHandlerMiddlewares, validateParams(ClassParamsSchema)],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams

      const classDetails = await adminClassService.getClassById(classId)

      return reply.send({ success: true, class: classDetails })
    },
  })

  /**
   * POST /classes
   * Create a new class
   */
  app.post("/classes", {
    preHandler: [...preHandlerMiddlewares, validateBody(CreateClassSchema)],
    handler: async (request, reply) => {
      const newClassData = request.validatedBody as CreateClass

      const createdClass = await adminClassService.createClass(newClassData)

      const createdClassDetails = await adminClassService.getClassById(
        createdClass.id,
      )

      return reply.status(201).send({
        success: true,
        class: createdClassDetails,
      })
    },
  })

  /**
   * PUT /classes/:id
   * Update class information
   */
  app.put("/classes/:id", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateParams(ClassParamsSchema),
      validateBody(UpdateClassSchema),
    ],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams
      const updatedClassDto = request.validatedBody as UpdateClass
      const serviceData = mapUpdateClassDtoToServiceData(updatedClassDto)

      await adminClassService.updateClass(classId, serviceData)

      const updatedClassDetails = await adminClassService.getClassById(classId)

      return reply.send({ success: true, class: updatedClassDetails })
    },
  })

  /**
   * DELETE /classes/:id
   * Delete a class
   */
  app.delete("/classes/:id", {
    preHandler: [...preHandlerMiddlewares, validateParams(ClassParamsSchema)],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams

      await adminClassService.deleteClass(classId)

      return reply.send({
        success: true,
        message: "Class deleted successfully",
      })
    },
  })

  /**
   * PATCH /classes/:id/reassign
   * Reassign class teacher
   */
  app.patch("/classes/:id/reassign", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateParams(ClassParamsSchema),
      validateBody(ReassignTeacherSchema),
    ],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams
      const { teacherId: newTeacherId } =
        request.validatedBody as ReassignTeacher

      const reassignedClassDetails =
        await adminClassService.reassignClassTeacher(classId, newTeacherId)

      return reply.send({ success: true, class: reassignedClassDetails })
    },
  })

  /**
   * PATCH /classes/:id/archive
   * Archive a class
   */
  app.patch("/classes/:id/archive", {
    preHandler: [...preHandlerMiddlewares, validateParams(ClassParamsSchema)],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams

      const archivedClassDetails = await adminClassService.archiveClass(classId)

      return reply.send({ success: true, class: archivedClassDetails })
    },
  })

  /**
   * GET /classes/:id/assignments
   * Get class assignments
   */
  app.get("/classes/:id/assignments", {
    preHandler: [...preHandlerMiddlewares, validateParams(ClassParamsSchema)],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams

      const classAssignmentsList =
        await adminClassService.getClassAssignments(classId)

      return reply.send({ success: true, assignments: classAssignmentsList })
    },
  })
}
