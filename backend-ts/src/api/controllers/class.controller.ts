import type { FastifyInstance } from "fastify";
import { container } from "tsyringe";
import { ClassService } from "@/services/class.service.js";
import { AssignmentService } from "@/services/assignment.service.js";
import { toJsonSchema } from "@/api/utils/swagger.js";
import {
  CreateClassRequestSchema,
  UpdateClassRequestSchema,
  DeleteClassRequestSchema,
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
  type DeleteClassRequest,
} from "@/api/schemas/class.schema.js";
import {
  CreateAssignmentRequestSchema,
  AssignmentListResponseSchema,
  CreateAssignmentResponseSchema,
  type CreateAssignmentRequest,
} from "@/api/schemas/assignment.schema.js";
import { BadRequestError } from "@/api/middlewares/error-handler.js";

/** Class routes - /api/v1/classes/* */
export async function classRoutes(app: FastifyInstance): Promise<void> {
  const classService = container.resolve<ClassService>("ClassService");
  const assignmentService =
    container.resolve<AssignmentService>("AssignmentService");

  /**
   * POST /
   * Create a new class
   */
  app.post<{ Body: CreateClassRequest }>("/", {
    schema: {
      tags: ["Classes"],
      summary: "Create a new class",
      body: toJsonSchema(CreateClassRequestSchema),
      response: {
        201: toJsonSchema(CreateClassResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const classData = await classService.createClass(request.body);

      return reply.status(201).send({
        success: true,
        message: "Class created successfully",
        class: classData,
      });
    },
  });

  /**
   * GET /generate-code
   * Generate a unique class code
   */
  app.get("/generate-code", {
    schema: {
      tags: ["Classes"],
      summary: "Generate a unique class code",
      response: {
        200: toJsonSchema(GenerateCodeResponseSchema),
      },
    },
    handler: async (_request, reply) => {
      const code = await classService.generateClassCode();

      return reply.send({
        success: true,
        code,
        message: "Class code generated successfully",
      });
    },
  });

  /**
   * GET /teacher/:teacherId
   * Get all classes for a teacher
   */
  app.get<{
    Params: { teacherId: string };
    Querystring: { activeOnly?: string };
  }>("/teacher/:teacherId", {
    schema: {
      tags: ["Classes"],
      summary: "Get all classes for a teacher",
      params: toJsonSchema(TeacherIdParamSchema),
      querystring: toJsonSchema(GetClassesQuerySchema),
      response: {
        200: toJsonSchema(ClassListResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const teacherId = parseInt(request.params.teacherId, 10);
      const activeOnly = request.query.activeOnly !== "false";

      if (isNaN(teacherId)) {
        throw new BadRequestError("Invalid teacher ID");
      }

      const classes = await classService.getClassesByTeacher(
        teacherId,
        activeOnly,
      );

      return reply.send({
        success: true,
        message: "Classes retrieved successfully",
        classes,
      });
    },
  });

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
        params: toJsonSchema(ClassIdParamSchema),
        querystring: toJsonSchema(GetClassByIdQuerySchema),
        response: {
          200: toJsonSchema(GetClassResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const classId = parseInt(request.params.classId, 10);
        const teacherId = request.query.teacherId
          ? parseInt(request.query.teacherId, 10)
          : undefined;

        if (isNaN(classId)) {
          throw new BadRequestError("Invalid class ID");
        }

        if (teacherId !== undefined && isNaN(teacherId)) {
          throw new BadRequestError("Invalid teacher ID");
        }

        const classData = await classService.getClassById(classId, teacherId);

        return reply.send({
          success: true,
          message: "Class retrieved successfully",
          class: classData,
        });
      },
    },
  );

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
        params: toJsonSchema(ClassIdParamSchema),
        body: toJsonSchema(UpdateClassRequestSchema),
        response: {
          200: toJsonSchema(UpdateClassResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
          throw new BadRequestError("Invalid class ID");
        }

        const {
          teacherId,
          className,
          description,
          isActive,
          yearLevel,
          semester,
          academicYear,
          schedule,
        } = request.body;

        const classData = await classService.updateClass(classId, teacherId, {
          className,
          description,
          isActive,
          yearLevel,
          semester,
          academicYear,
          schedule,
        });

        return reply.send({
          success: true,
          message: "Class updated successfully",
          class: classData,
        });
      },
    },
  );

  /**
   * DELETE /:classId
   * Delete a class
   */
  app.delete<{ Params: { classId: string }; Body: DeleteClassRequest }>(
    "/:classId",
    {
      schema: {
        tags: ["Classes"],
        summary: "Delete a class",
        params: toJsonSchema(ClassIdParamSchema),
        body: toJsonSchema(DeleteClassRequestSchema),
        response: {
          200: toJsonSchema(SuccessMessageSchema),
        },
      },
      handler: async (request, reply) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
          throw new BadRequestError("Invalid class ID");
        }

        const { teacherId } = request.body;
        await classService.deleteClass(classId, teacherId);

        return reply.send({
          success: true,
          message: "Class deleted successfully",
        });
      },
    },
  );

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
        params: toJsonSchema(ClassIdParamSchema),
        body: toJsonSchema(CreateAssignmentRequestSchema),
        response: {
          201: toJsonSchema(CreateAssignmentResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
          throw new BadRequestError("Invalid class ID");
        }

        const {
          teacherId,
          assignmentName,
          description,
          programmingLanguage,
          deadline,
          allowResubmission,
          maxAttempts,
          templateCode,
          totalScore,
          scheduledDate,
        } = request.body;

        const parsedDeadline = new Date(deadline);
        if (isNaN(parsedDeadline.getTime())) {
          throw new BadRequestError("Invalid deadline date");
        }

        let parsedScheduledDate: Date | null = null;
        if (scheduledDate) {
          const date = new Date(scheduledDate);
          if (isNaN(date.getTime())) {
            throw new BadRequestError("Invalid scheduled date");
          }
          parsedScheduledDate = date;
        }

        const assignment = await assignmentService.createAssignment(
          classId,
          teacherId,
          {
            assignmentName,
            description,
            programmingLanguage,
            deadline: parsedDeadline,
            allowResubmission,
            maxAttempts,
            templateCode,
            totalScore,
            scheduledDate: parsedScheduledDate,
          },
        );

        return reply.status(201).send({
          success: true,
          message: "Assignment created successfully",
          assignment,
        });
      },
    },
  );

  /**
   * GET /:classId/assignments
   * Get all assignments for a class
   */
  app.get<{ Params: { classId: string } }>("/:classId/assignments", {
    schema: {
      tags: ["Classes"],
      summary: "Get all assignments for a class",
      params: toJsonSchema(ClassIdParamSchema),
      response: {
        200: toJsonSchema(AssignmentListResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const classId = parseInt(request.params.classId, 10);

      if (isNaN(classId)) {
        throw new BadRequestError("Invalid class ID");
      }

      const assignments = await classService.getClassAssignments(classId);

      return reply.send({
        success: true,
        message: "Assignments retrieved successfully",
        assignments,
      });
    },
  });

  /**
   * GET /:classId/students
   * Get all students in a class
   */
  app.get<{ Params: { classId: string } }>("/:classId/students", {
    schema: {
      tags: ["Classes"],
      summary: "Get all students in a class",
      params: toJsonSchema(ClassIdParamSchema),
      response: {
        200: toJsonSchema(ClassStudentsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const classId = parseInt(request.params.classId, 10);

      if (isNaN(classId)) {
        throw new BadRequestError("Invalid class ID");
      }

      const students = await classService.getClassStudents(classId);

      return reply.send({
        success: true,
        message: "Students retrieved successfully",
        students,
      });
    },
  });

  /**
   * DELETE /:classId/students/:studentId
   * Remove a student from a class
   */
  app.delete<{
    Params: { classId: string; studentId: string };
    Querystring: { teacherId: string };
  }>("/:classId/students/:studentId", {
    schema: {
      tags: ["Classes"],
      summary: "Remove a student from a class",
      params: toJsonSchema(ClassStudentParamsSchema),
      querystring: toJsonSchema(TeacherIdQuerySchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const classId = parseInt(request.params.classId, 10);
      const studentId = parseInt(request.params.studentId, 10);
      const teacherId = parseInt(request.query.teacherId, 10);

      if (isNaN(classId) || isNaN(studentId) || isNaN(teacherId)) {
        throw new BadRequestError("Invalid ID parameters");
      }

      await classService.removeStudent({ classId, studentId, teacherId });

      return reply.send({
        success: true,
        message: "Student removed successfully",
      });
    },
  });
}
