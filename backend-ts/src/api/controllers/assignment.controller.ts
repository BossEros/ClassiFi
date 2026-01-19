import type { FastifyInstance } from "fastify";
import { container } from "tsyringe";
import { AssignmentService } from "../../services/assignment.service.js";
import { toJsonSchema } from "../utils/swagger.js";
import { SuccessMessageSchema } from "../schemas/common.schema.js";
import { TeacherIdQuerySchema } from "../schemas/class.schema.js";
import {
  UpdateAssignmentRequestSchema,
  AssignmentIdParamSchema,
  GetAssignmentResponseSchema,
  UpdateAssignmentResponseSchema,
  type UpdateAssignmentRequest,
} from "../schemas/assignment.schema.js";

import { BadRequestError } from "../middlewares/error-handler.js";

/** Assignment routes - /api/v1/assignments/* */
export async function assignmentRoutes(app: FastifyInstance): Promise<void> {
  const assignmentService =
    container.resolve<AssignmentService>("AssignmentService");

  /**
   * GET /:assignmentId
   * Get assignment details
   */
  app.get<{
    Params: { assignmentId: string };
  }>("/:assignmentId", {
    schema: {
      tags: ["Assignments"],
      summary: "Get assignment details",
      params: toJsonSchema(AssignmentIdParamSchema),
      response: {
        200: toJsonSchema(GetAssignmentResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parseInt(request.params.assignmentId, 10);

      if (isNaN(assignmentId)) {
        throw new BadRequestError("Invalid assignment ID");
      }

      const assignment =
        await assignmentService.getAssignmentDetails(assignmentId);

      return reply.send({
        success: true,
        message: "Assignment retrieved successfully",
        assignment,
      });
    },
  });

  /**
   * PUT /:assignmentId
   * Update an assignment
   */
  app.put<{ Params: { assignmentId: string }; Body: UpdateAssignmentRequest }>(
    "/:assignmentId",
    {
      schema: {
        tags: ["Assignments"],
        summary: "Update an assignment",
        params: toJsonSchema(AssignmentIdParamSchema),
        body: toJsonSchema(UpdateAssignmentRequestSchema),
        response: {
          200: toJsonSchema(UpdateAssignmentResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parseInt(request.params.assignmentId, 10);

        if (isNaN(assignmentId)) {
          throw new BadRequestError("Invalid assignment ID");
        }

        const { teacherId, ...updateData } = request.body;

        // Validate deadline if provided
        let parsedDeadline: Date | undefined;
        if (updateData.deadline) {
          if (!isNaN(Date.parse(updateData.deadline))) {
            parsedDeadline = new Date(updateData.deadline);
          } else {
            throw new BadRequestError("Invalid deadline date format");
          }
        }

        // Validate scheduledDate if provided
        let parsedScheduledDate: Date | undefined;
        if (updateData.scheduledDate) {
          parsedScheduledDate = new Date(updateData.scheduledDate);
          if (isNaN(parsedScheduledDate.getTime())) {
            throw new BadRequestError("Invalid scheduled date format");
          }
        }

        const assignment = await assignmentService.updateAssignment(
          assignmentId,
          teacherId,
          {
            ...updateData,
            deadline: parsedDeadline,
            scheduledDate: parsedScheduledDate,
          },
        );

        return reply.send({
          success: true,
          message: "Assignment updated successfully",
          assignment,
        });
      },
    },
  );

  /**
   * DELETE /:assignmentId
   * Delete an assignment
   */
  app.delete<{
    Params: { assignmentId: string };
    Querystring: { teacherId: string };
  }>("/:assignmentId", {
    schema: {
      tags: ["Assignments"],
      summary: "Delete an assignment",
      params: toJsonSchema(AssignmentIdParamSchema),
      querystring: toJsonSchema(TeacherIdQuerySchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parseInt(request.params.assignmentId, 10);
      const teacherId = parseInt(request.query.teacherId, 10);

      if (isNaN(assignmentId) || isNaN(teacherId)) {
        throw new BadRequestError("Invalid parameters");
      }

      await assignmentService.deleteAssignment(assignmentId, teacherId);

      return reply.send({
        success: true,
        message: "Assignment deleted successfully",
      });
    },
  });
}
