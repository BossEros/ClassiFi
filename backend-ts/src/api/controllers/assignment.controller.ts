import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ClassService } from '../../services/class.service.js';
import { UpdateAssignmentRequestSchema, type UpdateAssignmentRequest } from '../schemas/assignment.schema.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middlewares/error-handler.js';

const classService = new ClassService();

/** Assignment routes - /api/v1/assignments/* */
export async function assignmentRoutes(app: FastifyInstance): Promise<void> {
    /** GET /:assignmentId - Get assignment details */
    app.get('/:assignmentId', async (
        request: FastifyRequest<{ Params: { assignmentId: string }; Querystring: { userId: string } }>,
        reply: FastifyReply
    ) => {
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
    });

    /** PUT /:assignmentId - Update an assignment */
    app.put('/:assignmentId', async (
        request: FastifyRequest<{ Params: { assignmentId: string }; Body: UpdateAssignmentRequest }>,
        reply: FastifyReply
    ) => {
        const assignmentId = parseInt(request.params.assignmentId, 10);

        if (isNaN(assignmentId)) {
            throw new BadRequestError('Invalid assignment ID');
        }

        const parseResult = UpdateAssignmentRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request');
        }

        const { teacherId, ...updateData } = parseResult.data;

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
    });

    /** DELETE /:assignmentId - Delete an assignment */
    app.delete('/:assignmentId', async (
        request: FastifyRequest<{ Params: { assignmentId: string }; Querystring: { teacherId: string } }>,
        reply: FastifyReply
    ) => {
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
    });
}
