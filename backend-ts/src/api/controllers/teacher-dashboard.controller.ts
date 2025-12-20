import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TeacherDashboardService } from '../../services/teacher-dashboard.service.js';
import { BadRequestError } from '../middlewares/error-handler.js';

const dashboardService = new TeacherDashboardService();

/** Teacher dashboard routes - /api/v1/teacher/dashboard/* */
export async function teacherDashboardRoutes(app: FastifyInstance): Promise<void> {
    /** GET /:teacherId - Get complete dashboard data */
    app.get('/:teacherId', async (
        request: FastifyRequest<{
            Params: { teacherId: string };
            Querystring: { recentClassesLimit?: string; pendingTasksLimit?: string };
        }>,
        reply: FastifyReply
    ) => {
        const teacherId = parseInt(request.params.teacherId, 10);
        const recentClassesLimit = parseInt(request.query.recentClassesLimit ?? '12', 10);
        const pendingTasksLimit = parseInt(request.query.pendingTasksLimit ?? '10', 10);

        if (isNaN(teacherId)) {
            throw new BadRequestError('Invalid teacher ID');
        }

        const result = await dashboardService.getDashboardData(
            teacherId,
            recentClassesLimit,
            pendingTasksLimit
        );

        if (!result.success) {
            throw new BadRequestError(result.message);
        }

        return reply.send({
            success: true,
            message: result.message,
            recentClasses: result.data.recentClasses,
            pendingTasks: result.data.pendingTasks,
        });
    });

    /** GET /:teacherId/classes - Get recent classes */
    app.get('/:teacherId/classes', async (
        request: FastifyRequest<{ Params: { teacherId: string }; Querystring: { limit?: string } }>,
        reply: FastifyReply
    ) => {
        const teacherId = parseInt(request.params.teacherId, 10);
        const limit = parseInt(request.query.limit ?? '5', 10);

        if (isNaN(teacherId)) {
            throw new BadRequestError('Invalid teacher ID');
        }

        const result = await dashboardService.getRecentClasses(teacherId, limit);

        return reply.send({
            success: true,
            message: result.message,
            classes: result.classes,
        });
    });

    /** GET /:teacherId/tasks - Get pending tasks */
    app.get('/:teacherId/tasks', async (
        request: FastifyRequest<{ Params: { teacherId: string }; Querystring: { limit?: string } }>,
        reply: FastifyReply
    ) => {
        const teacherId = parseInt(request.params.teacherId, 10);
        const limit = parseInt(request.query.limit ?? '10', 10);

        if (isNaN(teacherId)) {
            throw new BadRequestError('Invalid teacher ID');
        }

        const result = await dashboardService.getPendingTasks(teacherId, limit);

        return reply.send({
            success: true,
            message: result.message,
            tasks: result.tasks,
        });
    });
}
