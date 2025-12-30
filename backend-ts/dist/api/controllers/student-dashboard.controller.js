import { container } from 'tsyringe';
import { toJsonSchema } from '@/api/utils/swagger.js';
import { SuccessMessageSchema, LimitQuerySchema } from '@/api/schemas/common.schema.js';
import { StudentIdParamSchema } from '@/api/schemas/class.schema.js';
import { JoinClassRequestSchema, LeaveClassRequestSchema, StudentDashboardResponseSchema, StudentDashboardQuerySchema, DashboardClassListResponseSchema, DashboardAssignmentListResponseSchema, JoinClassResponseSchema } from '@/api/schemas/dashboard.schema.js';
import { BadRequestError } from '@/api/middlewares/error-handler.js';
/** Student dashboard routes - /api/v1/student/dashboard/* */
export async function studentDashboardRoutes(app) {
    const dashboardService = container.resolve('StudentDashboardService');
    /**
     * GET /:studentId
     * Get complete dashboard data for a student
     */
    app.get('/:studentId', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Get complete dashboard data for a student',
            params: toJsonSchema(StudentIdParamSchema),
            querystring: toJsonSchema(StudentDashboardQuerySchema),
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
            const data = await dashboardService.getDashboardData(studentId, enrolledClassesLimit, pendingAssignmentsLimit);
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
    app.get('/:studentId/classes', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Get enrolled classes for a student',
            params: toJsonSchema(StudentIdParamSchema),
            querystring: toJsonSchema(LimitQuerySchema),
            response: {
                200: toJsonSchema(DashboardClassListResponseSchema),
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
    app.get('/:studentId/assignments', {
        schema: {
            tags: ['Student Dashboard'],
            summary: 'Get pending assignments for a student',
            params: toJsonSchema(StudentIdParamSchema),
            querystring: toJsonSchema(LimitQuerySchema),
            response: {
                200: toJsonSchema(DashboardAssignmentListResponseSchema),
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
    app.post('/join', {
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
    app.post('/leave', {
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
//# sourceMappingURL=student-dashboard.controller.js.map