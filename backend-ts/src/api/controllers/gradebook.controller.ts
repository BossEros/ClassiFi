import type { FastifyInstance } from "fastify";
import { container } from "tsyringe";
import { GradebookService } from "../../services/gradebook.service.js";
import { LatePenaltyService } from "../../services/latePenalty.service.js";
import { toJsonSchema } from "../utils/swagger.js";
import {
  ClassIdParamSchema,
  StudentIdParamSchema,
  StudentClassParamsSchema,
  SubmissionIdParamSchema,
  AssignmentIdParamSchema,
  GradeOverrideBodySchema,
  LatePenaltyUpdateBodySchema,
  ClassGradebookResponseSchema,
  StudentGradesResponseSchema,
  ClassStatisticsResponseSchema,
  StudentRankResponseSchema,
  LatePenaltyConfigResponseSchema,
  SuccessResponseSchema,
  type GradeOverrideBody,
  type LatePenaltyUpdateBody,
} from "../schemas/gradebook.schema.js";
import { BadRequestError } from "../middlewares/error-handler.js";

/** Gradebook routes - /api/v1/gradebook/* */
export async function gradebookRoutes(app: FastifyInstance): Promise<void> {
  const gradebookService =
    container.resolve<GradebookService>("GradebookService");
  const latePenaltyService =
    container.resolve<LatePenaltyService>("LatePenaltyService");

  // ==========================================================================
  // Class Gradebook Endpoints
  // ==========================================================================

  /**
   * GET /classes/:classId
   * Get the complete gradebook for a class
   */
  app.get<{ Params: { classId: string } }>("/classes/:classId", {
    schema: {
      tags: ["Gradebook"],
      summary: "Get class gradebook",
      description:
        "Returns all students with their grades for all assignments in the class",
      params: toJsonSchema(ClassIdParamSchema),
      response: {
        200: toJsonSchema(ClassGradebookResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const classId = parseInt(request.params.classId, 10);

      if (isNaN(classId)) {
        throw new BadRequestError("Invalid class ID");
      }

      const gradebook = await gradebookService.getClassGradebook(classId);

      // Transform dates to strings for response
      return reply.send({
        success: true,
        assignments: gradebook.assignments.map((a) => ({
          ...a,
          deadline: a.deadline.toISOString(),
        })),
        students: gradebook.students.map((s) => ({
          ...s,
          grades: s.grades.map((g) => ({
            ...g,
            submittedAt: g.submittedAt?.toISOString() ?? null,
          })),
        })),
      });
    },
  });

  /**
   * GET /classes/:classId/export
   * Export class gradebook as CSV
   */
  app.get<{ Params: { classId: string } }>("/classes/:classId/export", {
    schema: {
      tags: ["Gradebook"],
      summary: "Export class gradebook as CSV",
      params: toJsonSchema(ClassIdParamSchema),
    },
    handler: async (request, reply) => {
      const classId = parseInt(request.params.classId, 10);

      if (isNaN(classId)) {
        throw new BadRequestError("Invalid class ID");
      }

      const csvContent = await gradebookService.exportGradebookCSV(classId);

      return reply
        .header("Content-Type", "text/csv")
        .header(
          "Content-Disposition",
          `attachment; filename="gradebook-class-${classId}.csv"`
        )
        .send(csvContent);
    },
  });

  /**
   * GET /classes/:classId/statistics
   * Get class statistics
   */
  app.get<{ Params: { classId: string } }>("/classes/:classId/statistics", {
    schema: {
      tags: ["Gradebook"],
      summary: "Get class statistics",
      params: toJsonSchema(ClassIdParamSchema),
      response: {
        200: toJsonSchema(ClassStatisticsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const classId = parseInt(request.params.classId, 10);

      if (isNaN(classId)) {
        throw new BadRequestError("Invalid class ID");
      }

      const statistics = await gradebookService.getClassStatistics(classId);

      return reply.send({
        success: true,
        statistics,
      });
    },
  });

  // ==========================================================================
  // Student Grades Endpoints
  // ==========================================================================

  /**
   * GET /students/:studentId
   * Get all grades for a student across all classes
   */
  app.get<{ Params: { studentId: string } }>("/students/:studentId", {
    schema: {
      tags: ["Gradebook"],
      summary: "Get student grades",
      description:
        "Returns all grades for a student across all enrolled classes",
      params: toJsonSchema(StudentIdParamSchema),
      response: {
        200: toJsonSchema(StudentGradesResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const studentId = parseInt(request.params.studentId, 10);

      if (isNaN(studentId)) {
        throw new BadRequestError("Invalid student ID");
      }

      const grades = await gradebookService.getStudentGrades(studentId);

      // Transform dates to strings
      return reply.send({
        success: true,
        grades: grades.map((c) => ({
          ...c,
          assignments: c.assignments.map((a) => ({
            ...a,
            deadline: a.deadline.toISOString(),
            submittedAt: a.submittedAt?.toISOString() ?? null,
          })),
        })),
      });
    },
  });

  /**
   * GET /students/:studentId/classes/:classId
   * Get student grades for a specific class
   */
  app.get<{ Params: { studentId: string; classId: string } }>(
    "/students/:studentId/classes/:classId",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Get student grades for a class",
        params: toJsonSchema(StudentClassParamsSchema),
        response: {
          200: toJsonSchema(StudentGradesResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const studentId = parseInt(request.params.studentId, 10);
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(studentId) || isNaN(classId)) {
          throw new BadRequestError("Invalid ID parameters");
        }

        const grades = await gradebookService.getStudentGrades(
          studentId,
          classId
        );

        return reply.send({
          success: true,
          grades: grades.map((c) => ({
            ...c,
            assignments: c.assignments.map((a) => ({
              ...a,
              deadline: a.deadline.toISOString(),
              submittedAt: a.submittedAt?.toISOString() ?? null,
            })),
          })),
        });
      },
    }
  );

  /**
   * GET /students/:studentId/classes/:classId/rank
   * Get student's rank in a class
   */
  app.get<{ Params: { studentId: string; classId: string } }>(
    "/students/:studentId/classes/:classId/rank",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Get student rank in class",
        params: toJsonSchema(StudentClassParamsSchema),
        response: {
          200: toJsonSchema(StudentRankResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const studentId = parseInt(request.params.studentId, 10);
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(studentId) || isNaN(classId)) {
          throw new BadRequestError("Invalid ID parameters");
        }

        const rankData = await gradebookService.getStudentRank(
          studentId,
          classId
        );

        return reply.send({
          success: true,
          rank: rankData?.rank ?? null,
          totalStudents: rankData?.totalStudents ?? null,
          percentile: rankData?.percentile ?? null,
        });
      },
    }
  );

  // ==========================================================================
  // Grade Override Endpoints
  // ==========================================================================

  /**
   * POST /submissions/:submissionId/override
   * Override a grade for a submission
   */
  app.post<{ Params: { submissionId: string }; Body: GradeOverrideBody }>(
    "/submissions/:submissionId/override",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Override a grade",
        description: "Manually set a grade for a submission (teacher only)",
        params: toJsonSchema(SubmissionIdParamSchema),
        body: toJsonSchema(GradeOverrideBodySchema),
        response: {
          200: toJsonSchema(SuccessResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const submissionId = parseInt(request.params.submissionId, 10);

        if (isNaN(submissionId)) {
          throw new BadRequestError("Invalid submission ID");
        }

        const { grade, feedback } = request.body;

        await gradebookService.overrideGrade(
          submissionId,
          grade,
          feedback ?? null
        );

        return reply.send({
          success: true,
          message: "Grade overridden successfully",
        });
      },
    }
  );

  /**
   * DELETE /submissions/:submissionId/override
   * Remove a grade override
   */
  app.delete<{ Params: { submissionId: string } }>(
    "/submissions/:submissionId/override",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Remove grade override",
        description: "Revert to auto-calculated grade based on test results",
        params: toJsonSchema(SubmissionIdParamSchema),
        response: {
          200: toJsonSchema(SuccessResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const submissionId = parseInt(request.params.submissionId, 10);

        if (isNaN(submissionId)) {
          throw new BadRequestError("Invalid submission ID");
        }

        await gradebookService.removeOverride(submissionId);

        return reply.send({
          success: true,
          message: "Grade override removed successfully",
        });
      },
    }
  );

  // ==========================================================================
  // Late Penalty Configuration Endpoints
  // ==========================================================================

  /**
   * GET /assignments/:id/late-penalty
   * Get late penalty configuration for an assignment
   */
  app.get<{ Params: { id: string } }>("/assignments/:id/late-penalty", {
    schema: {
      tags: ["Gradebook"],
      summary: "Get late penalty config",
      params: toJsonSchema(AssignmentIdParamSchema),
      response: {
        200: toJsonSchema(LatePenaltyConfigResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parseInt(request.params.id, 10);

      if (isNaN(assignmentId)) {
        throw new BadRequestError("Invalid assignment ID");
      }

      const config = await latePenaltyService.getAssignmentConfig(assignmentId);

      return reply.send({
        success: true,
        enabled: config.enabled,
        config: config.config,
      });
    },
  });

  /**
   * PUT /assignments/:id/late-penalty
   * Update late penalty configuration for an assignment
   */
  app.put<{ Params: { id: string }; Body: LatePenaltyUpdateBody }>(
    "/assignments/:id/late-penalty",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Update late penalty config",
        params: toJsonSchema(AssignmentIdParamSchema),
        body: toJsonSchema(LatePenaltyUpdateBodySchema),
        response: {
          200: toJsonSchema(SuccessResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parseInt(request.params.id, 10);

        if (isNaN(assignmentId)) {
          throw new BadRequestError("Invalid assignment ID");
        }

        const { enabled, config } = request.body;

        // Use default config if enabling but no config provided
        const penaltyConfig = config ?? latePenaltyService.getDefaultConfig();

        await latePenaltyService.setAssignmentConfig(
          assignmentId,
          enabled,
          penaltyConfig
        );

        return reply.send({
          success: true,
          message: "Late penalty configuration updated successfully",
        });
      },
    }
  );
}
