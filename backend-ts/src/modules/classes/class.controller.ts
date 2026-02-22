import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { z } from "zod"
import { ClassService } from "@/modules/classes/class.service.js"
import { AssignmentService } from "@/modules/assignments/assignment.service.js"
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/api/plugins/zod-validation.js"
import { parseOptionalDate } from "@/shared/utils.js"
import {
  CreateClassRequestSchema,
  UpdateClassRequestSchema,
  ClassIdParamSchema,
  TeacherIdParamSchema,
  GetClassesQuerySchema,
  GetClassByIdQuerySchema,
  TeacherIdQuerySchema,
  ClassStudentParamsSchema,
  type CreateClassRequest,
  type UpdateClassRequest,
  type ClassIdParam,
  type TeacherIdParam,
  type GetClassesQuery,
  type GetClassByIdQuery,
  type TeacherIdQuery,
  type ClassStudentParams,
} from "@/modules/classes/class.schema.js"
import {
  CreateAssignmentRequestSchema,
  type CreateAssignmentRequest,
} from "@/modules/assignments/assignment.schema.js"
import { BadRequestError, ApiError } from "@/shared/errors.js"
import type { AssignmentDTO } from "@/modules/assignments/assignment.mapper.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers all class-related API routes.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function classRoutes(app: FastifyInstance): Promise<void> {
  const classService = container.resolve<ClassService>(DI_TOKENS.services.class)
  const assignmentService = container.resolve<AssignmentService>(
    DI_TOKENS.services.assignment,
  )

  /**
   * POST /
   * Create a new class
   */
  app.post("/", {
    preHandler: validateBody(CreateClassRequestSchema),
    handler: async (request, reply) => {
      const createdClassData = await classService.createClass(
        request.validatedBody as CreateClassRequest,
      )

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
  app.get("/teacher/:teacherId", {
    preHandler: [
      validateParams(TeacherIdParamSchema),
      validateQuery(GetClassesQuerySchema),
    ],
    handler: async (request, reply) => {
      const { teacherId: parsedTeacherId } =
        request.validatedParams as TeacherIdParam
      const { activeOnly } = request.validatedQuery as GetClassesQuery

      const shouldFilterActiveOnly = activeOnly !== "false"

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
  app.get("/:classId", {
    preHandler: [
      validateParams(ClassIdParamSchema),
      validateQuery(GetClassByIdQuerySchema),
    ],
    handler: async (request, reply) => {
      const { classId: parsedClassId } = request.validatedParams as ClassIdParam
      const { teacherId: rawTeacherId } =
        request.validatedQuery as GetClassByIdQuery

      const parsedTeacherId = rawTeacherId
        ? parseInt(rawTeacherId, 10)
        : undefined

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
  })

  /**
   * PUT /:classId
   * Update a class
   */
  app.put("/:classId", {
    preHandler: [
      validateParams(ClassIdParamSchema),
      validateBody(UpdateClassRequestSchema),
    ],
    handler: async (request, reply) => {
      const { classId: parsedClassId } = request.validatedParams as ClassIdParam
      const updatePayload = request.validatedBody as UpdateClassRequest

      const updatedClassData = await classService.updateClass({
        classId: parsedClassId,
        ...updatePayload,
      })

      return reply.send({
        success: true,
        message: "Class updated successfully",
        class: updatedClassData,
      })
    },
  })

  /**
   * DELETE /:classId
   * Delete a class
   */
  app.delete("/:classId", {
    preHandler: [
      validateParams(ClassIdParamSchema),
      validateQuery(TeacherIdQuerySchema),
    ],
    handler: async (request, reply) => {
      const { classId: parsedClassId } = request.validatedParams as ClassIdParam
      const { teacherId: parsedTeacherId } =
        request.validatedQuery as TeacherIdQuery

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
  app.post("/:classId/assignments", {
    preHandler: [
      validateParams(ClassIdParamSchema),
      validateBody(CreateAssignmentRequestSchema),
    ],
    handler: async (request, reply) => {
      const { classId: parsedClassId } = request.validatedParams as ClassIdParam
      const assignmentPayload = request.validatedBody as CreateAssignmentRequest

      // Destructure to separate date strings from other fields
      const { deadline, scheduledDate, ...assignmentData } = assignmentPayload

      try {
        const parsedDeadlineDate = parseOptionalDate(deadline, "deadline date")
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
  })

  /**
   * GET /:classId/assignments
   * Get all assignments for a class
   */
  app.get("/:classId/assignments", {
    preHandler: [
      validateParams(ClassIdParamSchema),
      validateQuery(
        z.object({
          studentId: z.string().optional(),
        }),
      ),
    ],
    handler: async (request, reply) => {
      const { classId: parsedClassId } = request.validatedParams as ClassIdParam
      const { studentId: rawStudentId } = request.validatedQuery as {
        studentId?: string
      }

      const parsedStudentId = rawStudentId
        ? parseInt(rawStudentId, 10)
        : undefined

      if (parsedStudentId !== undefined && isNaN(parsedStudentId)) {
        throw new BadRequestError("Invalid student ID")
      }

      let classAssignmentList: AssignmentDTO[]

      if (parsedStudentId !== undefined) {
        // Fetch assignments with student-specific data
        classAssignmentList = await classService.getClassAssignmentsForStudent(
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
  })

  /**
   * GET /:classId/students
   * Get all students in a class
   */
  app.get("/:classId/students", {
    preHandler: validateParams(ClassIdParamSchema),
    handler: async (request, reply) => {
      const { classId: parsedClassId } = request.validatedParams as ClassIdParam

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
  app.delete("/:classId/students/:studentId", {
    preHandler: [
      validateParams(ClassStudentParamsSchema),
      validateQuery(TeacherIdQuerySchema),
    ],
    handler: async (request, reply) => {
      const { classId: parsedClassId, studentId: parsedStudentId } =
        request.validatedParams as ClassStudentParams
      const { teacherId: parsedTeacherId } =
        request.validatedQuery as TeacherIdQuery

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
