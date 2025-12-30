import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { container } from 'tsyringe';
import { TeacherDashboardService } from '../../services/teacher-dashboard.service.js';
import {
    TeacherDashboardResponseSchema,
    DashboardClassResponseSchema,
    DashboardTaskResponseSchema,
} from '../schemas/dashboard.schema.js';
import { BadRequestError } from '../middlewares/error-handler.js';

// Helper to convert Zod schema to JSON Schema for Swagger
const toJsonSchema = (schema: z.ZodType) => zodToJsonSchema(schema, { target: 'openApi3' });

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
export async function teacherDashboardRoutes(app: FastifyInstance): Promise<void> {
    const dashboardService = container.resolve<TeacherDashboardService>('TeacherDashboardService');

    /**
     * GET /:teacherId
     * Get complete dashboard data for a teacher
     */
    app.get<{
        Params: { teacherId: string };
        Querystring: { recentClassesLimit?: string; pendingTasksLimit?: string };
    }>('/:teacherId', {
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

            const data = await dashboardService.getDashboardData(
                teacherId,
                recentClassesLimit,
                pendingTasksLimit
            );

            return reply.send({
                success: true,
                message: 'Dashboard data retrieved successfully',
                recentClasses: data.recentClasses,
                pendingTasks: data.pendingTasks,
            });
        },
    });

    /**
     * GET /:teacherId/classes
     * Get recent classes for a teacher
     */
    app.get<{ Params: { teacherId: string }; Querystring: { limit?: string } }>('/:teacherId/classes', {
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

            const classes = await dashboardService.getRecentClasses(teacherId, limit);

            return reply.send({
                success: true,
                message: 'Recent classes retrieved successfully',
                classes,
            });
        },
    });

    /**
     * GET /:teacherId/tasks
     * Get pending tasks for a teacher
     */
    app.get<{ Params: { teacherId: string }; Querystring: { limit?: string } }>('/:teacherId/tasks', {
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

            const tasks = await dashboardService.getPendingTasks(teacherId, limit);

            return reply.send({
                success: true,
                message: 'Pending tasks retrieved successfully',
                tasks,
            });
        },
    });
}
