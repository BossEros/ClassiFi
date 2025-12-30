import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ClassService } from '../../services/class.service.js';
import {
    UpdateAssignmentRequestSchema,
    AssignmentResponseSchema,
    AssignmentDetailResponseSchema,
    type UpdateAssignmentRequest
} from '../schemas/assignment.schema.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middlewares/error-handler.js';

const classService = new ClassService();

// Helper to convert Zod schema to JSON Schema for Swagger
const toJsonSchema = (schema: z.ZodType) => zodToJsonSchema(schema, { target: 'openApi3' });

// Param schemas
const AssignmentIdParamSchema = z.object({
    assignmentId: z.string(),
});

// Query schemas
const UserIdQuerySchema = z.object({
    userId: z.string(),
});

const TeacherIdQuerySchema = z.object({
    teacherId: z.string(),
});

// Response schemas
const GetAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentDetailResponseSchema,
});

const UpdateAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentResponseSchema,
});

const SuccessMessageSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});

/** Assignment routes - /api/v1/assignments/* */
export async function assignmentRoutes(app: FastifyInstance): Promise<void> {

    /**
     * GET /:assignmentId
     * Get assignment details
     */
    app.get<{ Params: { assignmentId: string }; Querystring: { userId: string } }>('/:assignmentId', {
        schema: {
            tags: ['Assignments'],
            summary: 'Get assignment details',
            params: toJsonSchema(AssignmentIdParamSchema),
            querystring: toJsonSchema(UserIdQuerySchema),
            response: {
                200: toJsonSchema(GetAssignmentResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const assignmentId = parseInt(request.params.assignmentId, 10);
            const userId = parseInt(request.query.userId, 10);

            if (isNaN(assignmentId) || isNaN(userId)) {
                throw new BadRequestError('Invalid parameters');
            }

            const result = await classService.getAssignmentDetails(assignmentId, userId);

            if (!result.success) {
                if (result.message.includes('not found')) {
                    throw new NotFoundError(result.message);
                }
                if (result.message.includes('Unauthorized')) {
                    throw new ForbiddenError(result.message);
                }
                throw new BadRequestError(result.message);
            }

            return reply.send({
                success: true,
                message: result.message,
                assignment: result.assignment,
            });
        },
    });

    /**
     * PUT /:assignmentId
     * Update an assignment
     */
    app.put<{ Params: { assignmentId: string }; Body: UpdateAssignmentRequest }>('/:assignmentId', {
        schema: {
            tags: ['Assignments'],
            summary: 'Update an assignment',
            params: toJsonSchema(AssignmentIdParamSchema),
            body: toJsonSchema(UpdateAssignmentRequestSchema),
            response: {
                200: toJsonSchema(UpdateAssignmentResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const assignmentId = parseInt(request.params.assignmentId, 10);

            if (isNaN(assignmentId)) {
                throw new BadRequestError('Invalid assignment ID');
            }

            const { teacherId, ...updateData } = request.body;

            const result = await classService.updateAssignment(assignmentId, teacherId, {
                ...updateData,
                deadline: updateData.deadline ? new Date(updateData.deadline) : undefined,
            });

            if (!result.success) {
                if (result.message.includes('not found')) {
                    throw new NotFoundError(result.message);
                }
                if (result.message.includes('Unauthorized')) {
                    throw new ForbiddenError(result.message);
                }
                throw new BadRequestError(result.message);
            }

            return reply.send({
                success: true,
                message: result.message,
                assignment: result.assignment,
            });
        },
    });

    /**
     * DELETE /:assignmentId
     * Delete an assignment
     */
    app.delete<{ Params: { assignmentId: string }; Querystring: { teacherId: string } }>('/:assignmentId', {
        schema: {
            tags: ['Assignments'],
            summary: 'Delete an assignment',
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
                throw new BadRequestError('Invalid parameters');
            }

            const result = await classService.deleteAssignment(assignmentId, teacherId);

            if (!result.success) {
                if (result.message.includes('not found')) {
                    throw new NotFoundError(result.message);
                }
                if (result.message.includes('Unauthorized')) {
                    throw new ForbiddenError(result.message);
                }
                throw new BadRequestError(result.message);
            }

            return reply.send({
                success: true,
                message: result.message,
            });
        },
    });
}
