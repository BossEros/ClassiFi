import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { TeacherDashboardService } from '../../services/teacher-dashboard.service.js';
import { TeacherDashboardResponseSchema, DashboardClassResponseSchema, DashboardTaskResponseSchema, } from '../schemas/dashboard.schema.js';
import { BadRequestError } from '../middlewares/error-handler.js';
const dashboardService = new TeacherDashboardService();
// Helper to convert Zod schema to JSON Schema for Swagger
const toJsonSchema = (schema) => zodToJsonSchema(schema, { target: 'openApi3' });
// Param schemas
const TeacherIdParamSchema = z.object({
    teacherId: z.string(),
});
// Query schemas
const DashboardQuerySchema = z.object({
    recentClassesLimit: z.string().optional(),
    pendingTasksLimit: z.string().optional(),
});
const LimitQuerySchema = z.object({
    limit: z.string().optional(),
});
// Response schemas
const ClassListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    classes: z.array(DashboardClassResponseSchema),
});
const TaskListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    tasks: z.array(DashboardTaskResponseSchema),
});
/** Teacher dashboard routes - /api/v1/teacher/dashboard/* */
export async function teacherDashboardRoutes(app) {
    /**
     * GET /:teacherId
     * Get complete dashboard data for a teacher
     */
    app.get('/:teacherId', {
        schema: {
            tags: ['Teacher Dashboard'],
            summary: 'Get complete dashboard data for a teacher',
            params: toJsonSchema(TeacherIdParamSchema),
            querystring: toJsonSchema(DashboardQuerySchema),
            response: {
                200: toJsonSchema(TeacherDashboardResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const teacherId = parseInt(request.params.teacherId, 10);
            const recentClassesLimit = parseInt(request.query.recentClassesLimit ?? '12', 10);
            const pendingTasksLimit = parseInt(request.query.pendingTasksLimit ?? '10', 10);
            if (isNaN(teacherId)) {
                throw new BadRequestError('Invalid teacher ID');
            }
            const result = await dashboardService.getDashboardData(teacherId, recentClassesLimit, pendingTasksLimit);
            if (!result.success) {
                throw new BadRequestError(result.message);
            }
            return reply.send({
                success: true,
                message: result.message,
                recentClasses: result.data.recentClasses,
                pendingTasks: result.data.pendingTasks,
            });
        },
    });
    /**
     * GET /:teacherId/classes
     * Get recent classes for a teacher
     */
    app.get('/:teacherId/classes', {
        schema: {
            tags: ['Teacher Dashboard'],
            summary: 'Get recent classes for a teacher',
            params: toJsonSchema(TeacherIdParamSchema),
            querystring: toJsonSchema(LimitQuerySchema),
            response: {
                200: toJsonSchema(ClassListResponseSchema),
            },
        },
        handler: async (request, reply) => {
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
        },
    });
    /**
     * GET /:teacherId/tasks
     * Get pending tasks for a teacher
     */
    app.get('/:teacherId/tasks', {
        schema: {
            tags: ['Teacher Dashboard'],
            summary: 'Get pending tasks for a teacher',
            params: toJsonSchema(TeacherIdParamSchema),
            querystring: toJsonSchema(LimitQuerySchema),
            response: {
                200: toJsonSchema(TaskListResponseSchema),
            },
        },
        handler: async (request, reply) => {
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
        },
    });
}
//# sourceMappingURL=teacher-dashboard.controller.js.map