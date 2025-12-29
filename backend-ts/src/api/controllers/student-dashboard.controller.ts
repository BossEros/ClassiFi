import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StudentDashboardService } from '@/services/student-dashboard.service.js';
import { JoinClassRequestSchema, LeaveClassRequestSchema, type JoinClassRequest, type LeaveClassRequest } from '@/api/schemas/dashboard.schema.js';
import { BadRequestError } from '@/api/middlewares/error-handler.js';
const dashboardService = new StudentDashboardService();

/** Student dashboard routes - /api/v1/student/dashboard/* */
export async function studentDashboardRoutes(app: FastifyInstance): Promise<void> {
    /** GET /:studentId - Get complete dashboard data */
    app.get('/:studentId', async (
        request: FastifyRequest<{
            Params: { studentId: string };
            Querystring: { enrolledClassesLimit?: string; pendingAssignmentsLimit?: string };
        }>,
        reply: FastifyReply
    ) => {
        const studentId = parseInt(request.params.studentId, 10);
        const enrolledClassesLimit = parseInt(request.query.enrolledClassesLimit ?? '12', 10);
        const pendingAssignmentsLimit = parseInt(request.query.pendingAssignmentsLimit ?? '10', 10);

        if (isNaN(studentId)) {
            throw new BadRequestError('Invalid student ID');
        }

        const result = await dashboardService.getDashboardData(
            studentId,
            enrolledClassesLimit,
            pendingAssignmentsLimit
        );

        if (!result.success) {
            throw new BadRequestError(result.message);
        }

        return reply.send({
            success: true,
            message: result.message,
            enrolledClasses: result.data.enrolledClasses,
            pendingAssignments: result.data.pendingAssignments,
        });
    });

    /** GET /:studentId/classes - Get enrolled classes */
    app.get('/:studentId/classes', async (
        request: FastifyRequest<{ Params: { studentId: string }; Querystring: { limit?: string } }>,
        reply: FastifyReply
    ) => {
        const studentId = parseInt(request.params.studentId, 10);
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : undefined;

        if (isNaN(studentId)) {
            throw new BadRequestError('Invalid student ID');
        }

        const result = await dashboardService.getEnrolledClasses(studentId, limit);

        return reply.send({
            success: true,
            message: result.message,
            classes: result.classes,
        });
    });

    /** GET /:studentId/assignments - Get pending assignments */
    app.get('/:studentId/assignments', async (
        request: FastifyRequest<{ Params: { studentId: string }; Querystring: { limit?: string } }>,
        reply: FastifyReply
    ) => {
        const studentId = parseInt(request.params.studentId, 10);
        const limit = parseInt(request.query.limit ?? '10', 10);

        if (isNaN(studentId)) {
            throw new BadRequestError('Invalid student ID');
        }

        const result = await dashboardService.getPendingAssignments(studentId, limit);

        return reply.send({
            success: true,
            message: result.message,
            assignments: result.assignments,
        });
    });

    /** POST /join - Join a class */
    app.post('/join', async (
        request: FastifyRequest<{ Body: JoinClassRequest }>,
        reply: FastifyReply
    ) => {
        const parseResult = JoinClassRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request');
        }

        const { studentId, classCode } = parseResult.data;

        const result = await dashboardService.joinClass(studentId, classCode);

        return reply.send({
            success: result.success,
            message: result.message,
            classInfo: result.classData,
        });
    });

    /** POST /leave - Leave a class */
    app.post('/leave', async (
        request: FastifyRequest<{ Body: LeaveClassRequest }>,
        reply: FastifyReply
    ) => {
        const parseResult = LeaveClassRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request');
        }

        const { studentId, classId } = parseResult.data;

        const result = await dashboardService.leaveClass(studentId, classId);

        return reply.send({
            success: result.success,
            message: result.message,
        });
    });
}
