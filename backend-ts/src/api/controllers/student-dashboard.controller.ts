import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { container } from 'tsyringe';
import { StudentDashboardService } from '@/services/student-dashboard.service.js';
import {
    JoinClassRequestSchema,
    LeaveClassRequestSchema,
    StudentDashboardResponseSchema,
    DashboardClassResponseSchema,
    DashboardAssignmentResponseSchema,
    type JoinClassRequest,
    type LeaveClassRequest
} from '@/api/schemas/dashboard.schema.js';
import { BadRequestError } from '@/api/middlewares/error-handler.js';

// Helper to convert Zod schema to JSON Schema for Swagger
const toJsonSchema = (schema: z.ZodType) => zodToJsonSchema(schema, { target: 'openApi3' });

// Param schemas
const StudentIdParamSchema = z.object({
    studentId: z.string(),
});

// Query schemas
const DashboardQuerySchema = z.object({
    enrolledClassesLimit: z.string().optional(),
    pendingAssignmentsLimit: z.string().optional(),
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

const AssignmentListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignments: z.array(DashboardAssignmentResponseSchema),
});

const JoinClassResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    classInfo: DashboardClassResponseSchema,
});

const SuccessMessageSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});

/** Student dashboard routes - /api/v1/student/dashboard/* */
export async function studentDashboardRoutes(app: FastifyInstance): Promise<void> {
    const dashboardService = container.resolve<StudentDashboardService>('StudentDashboardService');

    /**
     * GET /:studentId
     * Get complete dashboard data for a student
     */
    app.get<{
        Params: { studentId: string };
        Querystring: { enrolledClassesLimit?: string; pendingAssignmentsLimit?: string };
    }>('/:studentId', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Get complete dashboard data for a student',
            params: toJsonSchema(StudentIdParamSchema),
            querystring: toJsonSchema(DashboardQuerySchema),
            response: {
                200: toJsonSchema(StudentDashboardResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const studentId = parseInt(request.params.studentId, 10);
            const enrolledClassesLimit = parseInt(request.query.enrolledClassesLimit ?? '12', 10);
            const pendingAssignmentsLimit = parseInt(request.query.pendingAssignmentsLimit ?? '10', 10);

            if (isNaN(studentId)) {
                throw new BadRequestError('Invalid student ID');
            }

            const data = await dashboardService.getDashboardData(
                studentId,
                enrolledClassesLimit,
                pendingAssignmentsLimit
            );

            return reply.send({
                success: true,
                message: 'Dashboard data retrieved successfully',
                enrolledClasses: data.enrolledClasses,
                pendingAssignments: data.pendingAssignments,
            });
        },
    });

    /**
     * GET /:studentId/classes
     * Get enrolled classes for a student
     */
    app.get<{ Params: { studentId: string }; Querystring: { limit?: string } }>('/:studentId/classes', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Get enrolled classes for a student',
            params: toJsonSchema(StudentIdParamSchema),
            querystring: toJsonSchema(LimitQuerySchema),
            response: {
                200: toJsonSchema(ClassListResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const studentId = parseInt(request.params.studentId, 10);
            const limit = request.query.limit ? parseInt(request.query.limit, 10) : undefined;

            if (isNaN(studentId)) {
                throw new BadRequestError('Invalid student ID');
            }

            const classes = await dashboardService.getEnrolledClasses(studentId, limit);

            return reply.send({
                success: true,
                message: 'Enrolled classes retrieved successfully',
                classes,
            });
        },
    });

    /**
     * GET /:studentId/assignments
     * Get pending assignments for a student
     */
    app.get<{ Params: { studentId: string }; Querystring: { limit?: string } }>('/:studentId/assignments', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Get pending assignments for a student',
            params: toJsonSchema(StudentIdParamSchema),
            querystring: toJsonSchema(LimitQuerySchema),
            response: {
                200: toJsonSchema(AssignmentListResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const studentId = parseInt(request.params.studentId, 10);
            const limit = parseInt(request.query.limit ?? '10', 10);

            if (isNaN(studentId)) {
                throw new BadRequestError('Invalid student ID');
            }

            const assignments = await dashboardService.getPendingAssignments(studentId, limit);

            return reply.send({
                success: true,
                message: 'Pending assignments retrieved successfully',
                assignments,
            });
        },
    });

    /**
     * POST /join
     * Join a class using class code
     */
    app.post<{ Body: JoinClassRequest }>('/join', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Join a class using class code',
            body: toJsonSchema(JoinClassRequestSchema),
            response: {
                200: toJsonSchema(JoinClassResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const { studentId, classCode } = request.body;

            const classData = await dashboardService.joinClass(studentId, classCode);

            return reply.send({
                success: true,
                message: 'Successfully joined the class!',
                classInfo: classData,
            });
        },
    });

    /**
     * POST /leave
     * Leave a class
     */
    app.post<{ Body: LeaveClassRequest }>('/leave', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Leave a class',
            body: toJsonSchema(LeaveClassRequestSchema),
            response: {
                200: toJsonSchema(SuccessMessageSchema),
            },
        },
        handler: async (request, reply) => {
            const { studentId, classId } = request.body;

            await dashboardService.leaveClass(studentId, classId);

            return reply.send({
                success: true,
                message: 'Successfully left the class.',
            });
        },
    });
}
