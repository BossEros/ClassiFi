import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminClassService } from "../../../services/admin/admin-class.service.js"
import { authMiddleware } from "../../middlewares/auth.middleware.js"
import { adminMiddleware } from "../../middlewares/admin.middleware.js"
import { toJsonSchema } from "../../utils/swagger.js"
import {
  ClassFilterQuerySchema,
  ClassParamsSchema,
  CreateClassSchema,
  UpdateClassSchema,
  ReassignTeacherSchema,
  PaginatedClassesResponseSchema,
  SingleClassResponseSchema,
  SuccessResponseSchema,
  ClassAssignmentsResponseSchema,
  type ClassFilterQuery,
  type ClassParams,
  type CreateClass,
  type UpdateClass,
  type ReassignTeacher,
} from "../../schemas/admin.schema.js"
import type { UpdateClassData } from "../../../services/admin/admin.types.js"
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
  const adminClassService =
    container.resolve<AdminClassService>(DI_TOKENS.services.adminClass)
  const preHandlerMiddlewares = [authMiddleware, adminMiddleware]

  /**
   * GET /classes
   * List all classes with filtering
   */
  app.get<{ Querystring: ClassFilterQuery }>("/classes", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Classes"],
      summary: "List all classes with filtering",
      description:
        "Retrieves a paginated list of classes with optional search and filter options",
      security: [{ bearerAuth: [] }],
      querystring: toJsonSchema(ClassFilterQuerySchema),
      response: { 200: toJsonSchema(PaginatedClassesResponseSchema) },
    },
    handler: async (request, reply) => {
      const filterQuery = request.query

      const paginatedClassesResult =
        await adminClassService.getAllClasses(filterQuery)

      return reply.send({ success: true, ...paginatedClassesResult })
    },
  })

  /**
   * GET /classes/:id
   * Get class details by ID
   */
  app.get<{ Params: ClassParams }>("/classes/:id", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Get class details by ID",
      description: "Retrieves detailed information for a specific class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: { 200: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      const classId = request.params.id

      const classDetails = await adminClassService.getClassById(classId)

      return reply.send({ success: true, class: classDetails })
    },
  })

  /**
   * POST /classes
   * Create a new class
   */
  app.post<{ Body: CreateClass }>("/classes", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Create a new class",
      description:
        "Creates a new class with specified details and assigns a teacher",
      security: [{ bearerAuth: [] }],
      body: toJsonSchema(CreateClassSchema),
      response: { 201: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      const newClassData = request.body

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
  app.put<{ Params: ClassParams; Body: UpdateClass }>("/classes/:id", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Update class information",
      description:
        "Updates class details such as name, description, and schedule",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      body: toJsonSchema(UpdateClassSchema),
      response: { 200: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      const classId = request.params.id
      const updatedClassDto = request.body
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
  app.delete<{ Params: ClassParams }>("/classes/:id", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Delete a class",
      description: "Permanently deletes a class and all associated data",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: { 200: toJsonSchema(SuccessResponseSchema) },
    },
    handler: async (request, reply) => {
      const classId = request.params.id

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
  app.patch<{ Params: ClassParams; Body: ReassignTeacher }>(
    "/classes/:id/reassign",
    {
      preHandler: preHandlerMiddlewares,
      schema: {
        tags: ["Admin - Classes"],
        summary: "Reassign class teacher",
        description: "Assigns a different teacher to the class",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(ClassParamsSchema),
        body: toJsonSchema(ReassignTeacherSchema),
        response: { 200: toJsonSchema(SingleClassResponseSchema) },
      },
      handler: async (request, reply) => {
        const classId = request.params.id
        const newTeacherId = request.body.teacherId

        const reassignedClassDetails =
          await adminClassService.reassignClassTeacher(classId, newTeacherId)

        return reply.send({ success: true, class: reassignedClassDetails })
      },
    },
  )

  /**
   * PATCH /classes/:id/archive
   * Archive a class
   */
  app.patch<{ Params: ClassParams }>("/classes/:id/archive", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Archive a class",
      description: "Marks a class as archived (soft delete)",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: { 200: toJsonSchema(SingleClassResponseSchema) },
    },
    handler: async (request, reply) => {
      const classId = request.params.id

      const archivedClassDetails = await adminClassService.archiveClass(classId)

      return reply.send({ success: true, class: archivedClassDetails })
    },
  })

  /**
   * GET /classes/:id/assignments
   * Get class assignments
   */
  app.get<{ Params: ClassParams }>("/classes/:id/assignments", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Classes"],
      summary: "Get class assignments",
      description: "Retrieves all assignments for a specific class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: { 200: toJsonSchema(ClassAssignmentsResponseSchema) },
    },
    handler: async (request, reply) => {
      const classId = request.params.id

      const classAssignmentsList =
        await adminClassService.getClassAssignments(classId)

      return reply.send({ success: true, assignments: classAssignmentsList })
    },
  })
}