import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { z } from "zod"
import { ClassService } from "@/services/class.service.js"
import { AssignmentService } from "@/services/assignment.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import { parseDate, parseOptionalDate } from "@/shared/utils.js"
import {
  CreateClassRequestSchema,
  UpdateClassRequestSchema,
  ClassIdParamSchema,
  TeacherIdParamSchema,
  GetClassesQuerySchema,
  GetClassByIdQuerySchema,
  TeacherIdQuerySchema,
  CreateClassResponseSchema,
  GetClassResponseSchema,
  UpdateClassResponseSchema,
  ClassListResponseSchema,
  GenerateCodeResponseSchema,
  ClassStudentsResponseSchema,
  SuccessMessageSchema,
  ClassStudentParamsSchema,
  type CreateClassRequest,
  type UpdateClassRequest,
} from "@/api/schemas/class.schema.js"
import {
  CreateAssignmentRequestSchema,
  AssignmentListResponseSchema,
  CreateAssignmentResponseSchema,
  type CreateAssignmentRequest,
} from "@/api/schemas/assignment.schema.js"
import { BadRequestError, ApiError } from "@/shared/errors.js"
import type { AssignmentDTO } from "@/shared/mappers.js"

/**
 * Registers all class-related API routes.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function classRoutes(app: FastifyInstance): Promise<void> {
  const classService = container.resolve<ClassService>("ClassService")
  const assignmentService =
    container.resolve<AssignmentService>("AssignmentService")

  /**
   * POST /
   * Create a new class
   */
  app.post<{ Body: CreateClassRequest }>("/", {
    schema: {
      tags: ["Classes"],
      summary: "Create a new class",
      description:
        "Creates a new class with the provided details and returns the created class data",
      security: [{ bearerAuth: [] }],
      body: toJsonSchema(CreateClassRequestSchema),
      response: {
        201: toJsonSchema(CreateClassResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const createdClassData = await classService.createClass(request.body)

      return reply.status(201).send({
        success: true,
        message: "Class created successfully",
        class: createdClassData,
      })
    },
  })

  /**
   * GET /generate-code
   * Generate a unique class code
   */
  app.get("/generate-code", {
    schema: {
      tags: ["Classes"],
      summary: "Generate a unique class code",
      description:
        "Generates a unique 6-character alphanumeric code for class enrollment",
      security: [{ bearerAuth: [] }],
      response: {
        200: toJsonSchema(GenerateCodeResponseSchema),
      },
    },
    handler: async (_request, reply) => {
      const generatedClassCode = await classService.generateClassCode()

      return reply.send({
        success: true,
        code: generatedClassCode,
        message: "Class code generated successfully",
      })
    },
  })

  /**
   * GET /teacher/:teacherId
   * Get all classes for a teacher
   */
  app.get<{
    Params: { teacherId: string }
    Querystring: { activeOnly?: string }
  }>("/teacher/:teacherId", {
    schema: {
      tags: ["Classes"],
      summary: "Get all classes for a teacher",
      description:
        "Retrieves all classes taught by a specific teacher, optionally filtered to active classes only",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(TeacherIdParamSchema),
      querystring: toJsonSchema(GetClassesQuerySchema),
      response: {
        200: toJsonSchema(ClassListResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const parsedTeacherId = parseInt(request.params.teacherId, 10)
      const shouldFilterActiveOnly = request.query.activeOnly !== "false"

      if (isNaN(parsedTeacherId)) {
        throw new BadRequestError("Invalid teacher ID")
      }

      const teacherClassList = await classService.getClassesByTeacher(
        parsedTeacherId,
        shouldFilterActiveOnly,
      )

      return reply.send({
        success: true,
        message: "Classes retrieved successfully",
        classes: teacherClassList,
      })
    },
  })

  /**
   * GET /:classId
   * Get a class by ID
   */
  app.get<{ Params: { classId: string }; Querystring: { teacherId?: string } }>(
    "/:classId",
    {
      schema: {
        tags: ["Classes"],
        summary: "Get a class by ID",
        description:
          "Retrieves detailed information about a specific class, optionally verifying teacher ownership",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(ClassIdParamSchema),
        querystring: toJsonSchema(GetClassByIdQuerySchema),
        response: {
          200: toJsonSchema(GetClassResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedClassId = parseInt(request.params.classId, 10)
        const parsedTeacherId = request.query.teacherId
          ? parseInt(request.query.teacherId, 10)
          : undefined

        if (isNaN(parsedClassId)) {
          throw new BadRequestError("Invalid class ID")
        }

        if (parsedTeacherId !== undefined && isNaN(parsedTeacherId)) {
          throw new BadRequestError("Invalid teacher ID")
        }

        const retrievedClassData = await classService.getClassById(
          parsedClassId,
          parsedTeacherId,
        )

        return reply.send({
          success: true,
          message: "Class retrieved successfully",
          class: retrievedClassData,
        })
      },
    },
  )

  /**
   * PUT /:classId
   * Update a class
   */
  app.put<{ Params: { classId: string }; Body: UpdateClassRequest }>(
    "/:classId",
    {
      schema: {
        tags: ["Classes"],
        summary: "Update a class",
        description:
          "Updates class details such as name, description, schedule, or active status",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(ClassIdParamSchema),
        body: toJsonSchema(UpdateClassRequestSchema),
        response: {
          200: toJsonSchema(UpdateClassResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedClassId = parseInt(request.params.classId, 10)

        if (isNaN(parsedClassId)) {
          throw new BadRequestError("Invalid class ID")
        }

        const updatedClassData = await classService.updateClass({
          classId: parsedClassId,
          ...request.body,
        })

        return reply.send({
          success: true,
          message: "Class updated successfully",
          class: updatedClassData,
        })
      },
    },
  )

  /**
   * DELETE /:classId
   * Delete a class
   */
  app.delete<{
    Params: { classId: string }
    Querystring: { teacherId: string }
  }>("/:classId", {
    schema: {
      tags: ["Classes"],
      summary: "Delete a class",
      description:
        "Permanently deletes a class and all associated data after verifying teacher ownership",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassIdParamSchema),
      querystring: toJsonSchema(TeacherIdQuerySchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const parsedClassId = parseInt(request.params.classId, 10)
      const parsedTeacherId = parseInt(request.query.teacherId, 10)

      if (isNaN(parsedClassId) || isNaN(parsedTeacherId)) {
        throw new BadRequestError("Invalid ID parameters")
      }

      await classService.deleteClass(parsedClassId, parsedTeacherId)

      return reply.send({
        success: true,
        message: "Class deleted successfully",
      })
    },
  })

  /**
   * POST /:classId/assignments
   * Create an assignment for a class
   */
  app.post<{ Params: { classId: string }; Body: CreateAssignmentRequest }>(
    "/:classId/assignments",
    {
      schema: {
        tags: ["Classes"],
        summary: "Create an assignment for a class",
        description:
          "Creates a new assignment with test cases, deadline, and optional scheduled release date",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(ClassIdParamSchema),
        body: toJsonSchema(CreateAssignmentRequestSchema),
        response: {
          201: toJsonSchema(CreateAssignmentResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedClassId = parseInt(request.params.classId, 10)

        if (isNaN(parsedClassId)) {
          throw new BadRequestError("Invalid class ID")
        }

        // Destructure to separate date strings from other fields
        const { deadline, scheduledDate, ...assignmentData } = request.body

        try {
          const parsedDeadlineDate = parseDate(deadline, "deadline date")
          const parsedScheduledDate = parseOptionalDate(
            scheduledDate,
            "scheduled date",
          )

          const createdAssignment = await assignmentService.createAssignment({
            classId: parsedClassId,
            ...assignmentData,
            deadline: parsedDeadlineDate,
            scheduledDate: parsedScheduledDate,
          })

          return reply.status(201).send({
            success: true,
            message: "Assignment created successfully",
            assignment: createdAssignment,
          })
        } catch (error) {
          // Re-throw BadRequestError and other ApiErrors to preserve status codes
          if (error instanceof ApiError) {
            throw error
          }

          // Wrap unknown errors as internal server errors
          throw new ApiError("Failed to create assignment", 500)
        }
      },
    },
  )

  /**
   * GET /:classId/assignments
   * Get all assignments for a class
   */
  app.get<{ Params: { classId: string }; Querystring: { studentId?: string } }>(
    "/:classId/assignments",
    {
      schema: {
        tags: ["Classes"],
        summary: "Get all assignments for a class",
        description:
          "Retrieves all assignments associated with a specific class. If studentId is provided, includes submission status, grade, and submission timestamp for that student.",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(ClassIdParamSchema),
        querystring: toJsonSchema(
          z.object({
            studentId: z.string().optional(),
          }),
        ),
        response: {
          200: toJsonSchema(AssignmentListResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedClassId = parseInt(request.params.classId, 10)
        const parsedStudentId = request.query.studentId
          ? parseInt(request.query.studentId, 10)
          : undefined

        if (isNaN(parsedClassId)) {
          throw new BadRequestError("Invalid class ID")
        }

        if (parsedStudentId !== undefined && isNaN(parsedStudentId)) {
          throw new BadRequestError("Invalid student ID")
        }

        let classAssignmentList: AssignmentDTO[]

        if (parsedStudentId !== undefined) {
          // Fetch assignments with student-specific data
          classAssignmentList =
            await classService.getClassAssignmentsForStudent(
              parsedClassId,
              parsedStudentId,
            )
        } else {
          // Fetch assignments without student data
          classAssignmentList =
            await classService.getClassAssignments(parsedClassId)
        }

        return reply.send({
          success: true,
          message: "Assignments retrieved successfully",
          assignments: classAssignmentList,
        })
      },
    },
  )

  /**
   * GET /:classId/students
   * Get all students in a class
   */
  app.get<{ Params: { classId: string } }>("/:classId/students", {
    schema: {
      tags: ["Classes"],
      summary: "Get all students in a class",
      description:
        "Retrieves all enrolled students with their enrollment details for a specific class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassIdParamSchema),
      response: {
        200: toJsonSchema(ClassStudentsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const parsedClassId = parseInt(request.params.classId, 10)

      if (isNaN(parsedClassId)) {
        throw new BadRequestError("Invalid class ID")
      }

      const enrolledStudentList =
        await classService.getClassStudents(parsedClassId)

      return reply.send({
        success: true,
        message: "Students retrieved successfully",
        students: enrolledStudentList,
      })
    },
  })

  /**
   * DELETE /:classId/students/:studentId
   * Remove a student from a class
   */
  app.delete<{
    Params: { classId: string; studentId: string }
    Querystring: { teacherId: string }
  }>("/:classId/students/:studentId", {
    schema: {
      tags: ["Classes"],
      summary: "Remove a student from a class",
      description:
        "Removes a student's enrollment from a class after verifying teacher ownership",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassStudentParamsSchema),
      querystring: toJsonSchema(TeacherIdQuerySchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const parsedClassId = parseInt(request.params.classId, 10)
      const parsedStudentId = parseInt(request.params.studentId, 10)
      const parsedTeacherId = parseInt(request.query.teacherId, 10)

      if (
        isNaN(parsedClassId) ||
        isNaN(parsedStudentId) ||
        isNaN(parsedTeacherId)
      ) {
        throw new BadRequestError("Invalid ID parameters")
      }

      await classService.removeStudent({
        classId: parsedClassId,
        studentId: parsedStudentId,
        teacherId: parsedTeacherId,
      })

      return reply.send({
        success: true,
        message: "Student removed successfully",
      })
    },
  })
}
