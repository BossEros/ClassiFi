/**
 * Admin Controller
 * Handles all admin-only endpoints for user management, analytics, and class oversight.
 */
import type { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';
import { AdminUserService } from '../../services/admin/admin-user.service.js';
import { AdminAnalyticsService } from '../../services/admin/admin-analytics.service.js';
import { AdminClassService } from '../../services/admin/admin-class.service.js';
import { AdminEnrollmentService } from '../../services/admin/admin-enrollment.service.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import { toJsonSchema } from '../utils/swagger.js';
import {
    UserFilterQuerySchema,
    UserParamsSchema,
    UpdateUserRoleSchema,
    UpdateUserDetailsSchema,
    UpdateUserEmailSchema,
    CreateUserSchema,
    PaginatedUsersResponseSchema,
    SingleUserResponseSchema,
    AdminStatsResponseSchema,
    ActivityQuerySchema,
    ActivityResponseSchema,
    ClassFilterQuerySchema,
    ClassParamsSchema,
    CreateClassSchema,
    UpdateClassSchema,
    ReassignTeacherSchema,
    PaginatedClassesResponseSchema,
    SingleClassResponseSchema,
    TeachersListResponseSchema,
    SuccessResponseSchema,
    type UserFilterQuery,
    type UserParams,
    type UpdateUserRole,
    type UpdateUserDetails,
    type UpdateUserEmail,
    type CreateUser,
    type ClassFilterQuery,
    type ClassParams,
    type CreateClass,
    type UpdateClass,
    type ReassignTeacher,
    type ActivityQuery,
} from '../schemas/admin.schema.js';
import type { ClassSchedule } from '../../models/index.js';

/** Admin routes - /api/v1/admin/* */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
    // Resolve focused admin services
    const adminUserService = container.resolve<AdminUserService>('AdminUserService');
    const adminAnalyticsService = container.resolve<AdminAnalyticsService>('AdminAnalyticsService');
    const adminClassService = container.resolve<AdminClassService>('AdminClassService');
    const adminEnrollmentService = container.resolve<AdminEnrollmentService>('AdminEnrollmentService');

    // All routes require auth + admin role
    const preHandler = [authMiddleware, adminMiddleware];

    // ============ User Management ============

    /**
     * GET /users
     * Get all users with pagination, search, and filters
     */
    app.get<{ Querystring: UserFilterQuery }>('/users', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'List all users',
            description: 'Get paginated list of users with search and filter options',
            security: [{ bearerAuth: [] }],
            querystring: toJsonSchema(UserFilterQuerySchema),
            response: { 200: toJsonSchema(PaginatedUsersResponseSchema) },
        },
        handler: async (request, reply) => {
            const { page, limit, search, role, status } = request.query;

            const result = await adminUserService.getAllUsers({
                page,
                limit,
                search,
                role: role === 'all' ? undefined : role,
                status: status === 'all' ? undefined : status,
            });

            return reply.send({
                success: true,
                ...result,
            });
        },
    });

    /**
     * GET /users/:id
     * Get a single user by ID
     */
    app.get<{ Params: UserParams }>('/users/:id', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'Get user details',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(UserParamsSchema),
            response: { 200: toJsonSchema(SingleUserResponseSchema) },
        },
        handler: async (request, reply) => {
            const user = await adminUserService.getUserById(request.params.id);

            return reply.send({
                success: true,
                user,
            });
        },
    });

    /**
     * POST /users
     * Create a new user
     */
    app.post<{ Body: CreateUser }>('/users', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'Create a new user',
            security: [{ bearerAuth: [] }],
            body: toJsonSchema(CreateUserSchema),
            response: { 201: toJsonSchema(SingleUserResponseSchema) },
        },
        handler: async (request, reply) => {
            const user = await adminUserService.createUser(request.body);

            return reply.status(201).send({
                success: true,
                user,
            });
        },
    });

    /**
     * PATCH /users/:id/details
     * Update a user's details (Name)
     */
    app.patch<{ Params: UserParams; Body: UpdateUserDetails }>('/users/:id/details', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'Update user details',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(UserParamsSchema),
            body: toJsonSchema(UpdateUserDetailsSchema),
            response: { 200: toJsonSchema(SingleUserResponseSchema) },
        },
        handler: async (request, reply) => {
            const user = await adminUserService.updateUserDetails(
                request.params.id,
                request.body
            );

            return reply.send({
                success: true,
                user,
            });
        },
    });

    /**
     * PATCH /users/:id/email
     * Update a user's email (Admin-only for account recovery)
     */
    app.patch<{ Params: UserParams; Body: UpdateUserEmail }>('/users/:id/email', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'Update user email (account recovery)',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(UserParamsSchema),
            body: toJsonSchema(UpdateUserEmailSchema),
            response: { 200: toJsonSchema(SingleUserResponseSchema) },
        },
        handler: async (request, reply) => {
            const user = await adminUserService.updateUserEmail(
                request.params.id,
                request.body.email
            );

            return reply.send({
                success: true,
                user,
            });
        },
    });

    /**
     * PATCH /users/:id/role
     * Update a user's role
     */
    app.patch<{ Params: UserParams; Body: UpdateUserRole }>('/users/:id/role', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'Update user role',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(UserParamsSchema),
            body: toJsonSchema(UpdateUserRoleSchema),
            response: { 200: toJsonSchema(SingleUserResponseSchema) },
        },
        handler: async (request, reply) => {
            const user = await adminUserService.updateUserRole(
                request.params.id,
                request.body.role
            );

            return reply.send({
                success: true,
                user,
            });
        },
    });

    /**
     * PATCH /users/:id/status
     * Toggle user active/inactive status
     */
    app.patch<{ Params: UserParams }>('/users/:id/status', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'Toggle user status',
            description: 'Toggle between active and inactive status',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(UserParamsSchema),
            response: { 200: toJsonSchema(SingleUserResponseSchema) },
        },
        handler: async (request, reply) => {
            const user = await adminUserService.toggleUserStatus(request.params.id);

            return reply.send({
                success: true,
                user,
            });
        },
    });

    /**
     * DELETE /users/:id
     * Delete a user
     */
    app.delete<{ Params: UserParams }>('/users/:id', {
        preHandler,
        schema: {
            tags: ['Admin - Users'],
            summary: 'Delete a user',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(UserParamsSchema),
            response: { 200: toJsonSchema(SuccessResponseSchema) },
        },
        handler: async (request, reply) => {
            await adminUserService.deleteUser(request.params.id);

            return reply.send({
                success: true,
                message: 'User deleted successfully',
            });
        },
    });

    // ============ Analytics ============

    /**
     * GET /stats
     * Get admin dashboard statistics
     */
    app.get('/stats', {
        preHandler,
        schema: {
            tags: ['Admin - Analytics'],
            summary: 'Get dashboard statistics',
            security: [{ bearerAuth: [] }],
            response: { 200: toJsonSchema(AdminStatsResponseSchema) },
        },
        handler: async (request, reply) => {
            const stats = await adminAnalyticsService.getAdminStats();

            return reply.send({
                success: true,
                stats,
            });
        },
    });

    /**
     * GET /activity
     * Get recent platform activity
     */
    app.get<{ Querystring: ActivityQuery }>('/activity', {
        preHandler,
        schema: {
            tags: ['Admin - Analytics'],
            summary: 'Get recent activity',
            security: [{ bearerAuth: [] }],
            querystring: toJsonSchema(ActivityQuerySchema),
            response: { 200: toJsonSchema(ActivityResponseSchema) },
        },
        handler: async (request, reply) => {
            const activity = await adminAnalyticsService.getRecentActivity(request.query.limit);

            return reply.send({
                success: true,
                activity: activity.map(a => ({
                    ...a,
                    timestamp: a.timestamp.toISOString(),
                })),
            });
        },
    });

    // ============ Class Management ============

    /**
     * GET /classes
     * Get all classes with pagination and filters
     */
    app.get<{ Querystring: ClassFilterQuery }>('/classes', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'List all classes',
            security: [{ bearerAuth: [] }],
            querystring: toJsonSchema(ClassFilterQuerySchema),
            response: { 200: toJsonSchema(PaginatedClassesResponseSchema) },
        },
        handler: async (request, reply) => {
            const { page, limit, search, teacherId, status, yearLevel, semester, academicYear } = request.query;

            const result = await adminClassService.getAllClasses({
                page,
                limit,
                search,
                teacherId,
                status: status === 'all' ? undefined : status,
                yearLevel,
                semester,
                academicYear,
            });

            return reply.send({
                success: true,
                ...result,
            });
        },
    });

    /**
     * GET /classes/:id
     * Get a single class by ID
     */
    app.get<{ Params: ClassParams }>('/classes/:id', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'Get class details',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
            response: { 200: toJsonSchema(SingleClassResponseSchema) },
        },
        handler: async (request, reply) => {
            const classData = await adminClassService.getClassById(request.params.id);

            return reply.send({
                success: true,
                class: classData,
            });
        },
    });

    /**
     * POST /classes
     * Create a new class
     */
    app.post<{ Body: CreateClass }>('/classes', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'Create a new class',
            description: 'Admin can create a class and assign any teacher',
            security: [{ bearerAuth: [] }],
            body: toJsonSchema(CreateClassSchema),
            response: { 201: toJsonSchema(SingleClassResponseSchema) },
        },
        handler: async (request, reply) => {
            const classData = await adminClassService.createClass({
                teacherId: request.body.teacherId,
                className: request.body.className,
                yearLevel: request.body.yearLevel,
                semester: request.body.semester,
                academicYear: request.body.academicYear,
                schedule: request.body.schedule,
                description: request.body.description,
            });

            return reply.status(201).send({
                success: true,
                class: {
                    ...classData,
                    teacherName: 'Unknown', // Will be populated on fetch
                },
            });
        },
    });

    /**
     * PUT /classes/:id
     * Update a class
     */
    app.put<{ Params: ClassParams; Body: UpdateClass }>('/classes/:id', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'Update a class',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
            body: toJsonSchema(UpdateClassSchema),
            response: { 200: toJsonSchema(SingleClassResponseSchema) },
        },
        handler: async (request, reply) => {
            const classData = await adminClassService.updateClass(
                request.params.id,
                request.body as any
            );

            // Fetch the class again to get teacher name
            const fullClass = await adminClassService.getClassById(request.params.id);

            return reply.send({
                success: true,
                class: fullClass,
            });
        },
    });

    /**
     * DELETE /classes/:id
     * Delete a class (hard delete)
     */
    app.delete<{ Params: ClassParams }>('/classes/:id', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'Delete a class',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
            response: { 200: toJsonSchema(SuccessResponseSchema) },
        },
        handler: async (request, reply) => {
            await adminClassService.deleteClass(request.params.id);

            return reply.send({
                success: true,
                message: 'Class deleted successfully',
            });
        },
    });

    /**
     * PATCH /classes/:id/reassign
     * Reassign class to a new teacher
     */
    app.patch<{ Params: ClassParams; Body: ReassignTeacher }>('/classes/:id/reassign', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'Reassign class teacher',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
            body: toJsonSchema(ReassignTeacherSchema),
            response: { 200: toJsonSchema(SingleClassResponseSchema) },
        },
        handler: async (request, reply) => {
            await adminClassService.reassignClassTeacher(
                request.params.id,
                request.body.teacherId
            );

            const fullClass = await adminClassService.getClassById(request.params.id);

            return reply.send({
                success: true,
                class: fullClass,
            });
        },
    });

    /**
     * PATCH /classes/:id/archive
     * Archive a class (soft delete)
     */
    app.patch<{ Params: ClassParams }>('/classes/:id/archive', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'Archive a class',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
            response: { 200: toJsonSchema(SingleClassResponseSchema) },
        },
        handler: async (request, reply) => {
            await adminClassService.archiveClass(request.params.id);

            const fullClass = await adminClassService.getClassById(request.params.id);

            return reply.send({
                success: true,
                class: fullClass,
            });
        },
    });

    /**
     * GET /teachers
     * Get list of all teachers (for dropdowns)
     */
    app.get('/teachers', {
        preHandler,
        schema: {
            tags: ['Admin - Classes'],
            summary: 'Get all teachers',
            description: 'For use in teacher selection dropdowns',
            security: [{ bearerAuth: [] }],
            response: { 200: toJsonSchema(TeachersListResponseSchema) },
        },
        handler: async (request, reply) => {
            const teachers = await adminUserService.getAllTeachers();

            return reply.send({
                success: true,
                teachers,
            });
        },
    });

    // ============ Class Enrollment Management ============

    /**
     * GET /classes/:id/students
     * Get all students enrolled in a class
     */
    app.get<{ Params: ClassParams }>('/classes/:id/students', {
        preHandler,
        schema: {
            tags: ['Admin - Enrollment'],
            summary: 'Get class students',
            description: 'Get all students enrolled in a specific class',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
        },
        handler: async (request, reply) => {
            const students = await adminEnrollmentService.getClassStudents(request.params.id);

            return reply.send({
                success: true,
                students: students.map(s => ({
                    id: s.id,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    email: s.email,
                    avatarUrl: s.avatarUrl,
                    enrolledAt: s.enrolledAt,
                })),
            });
        },
    });

    /**
     * GET /classes/:id/assignments
     * Get all assignments for a class
     */
    app.get<{ Params: ClassParams }>('/classes/:id/assignments', {
        preHandler,
        schema: {
            tags: ['Admin - Enrollment'],
            summary: 'Get class assignments',
            description: 'Get all assignments for a specific class',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
        },
        handler: async (request, reply) => {
            const assignments = await adminClassService.getClassAssignments(request.params.id);

            return reply.send({
                success: true,
                assignments,
            });
        },
    });

    /**
     * POST /classes/:id/students
     * Add a student to a class
     */
    app.post<{ Params: ClassParams; Body: { studentId: number } }>('/classes/:id/students', {
        preHandler,
        schema: {
            tags: ['Admin - Enrollment'],
            summary: 'Enroll student in class',
            description: 'Add a student to a class',
            security: [{ bearerAuth: [] }],
            params: toJsonSchema(ClassParamsSchema),
        },
        handler: async (request, reply) => {
            await adminEnrollmentService.addStudentToClass(request.params.id, request.body.studentId);

            return reply.send({
                success: true,
                message: 'Student enrolled successfully',
            });
        },
    });

    /**
     * DELETE /classes/:id/students/:studentId
     * Remove a student from a class
     */
    app.delete<{ Params: { id: number; studentId: number } }>('/classes/:id/students/:studentId', {
        preHandler,
        schema: {
            tags: ['Admin - Enrollment'],
            summary: 'Remove student from class',
            description: 'Remove a student from a class',
            security: [{ bearerAuth: [] }],
        },
        handler: async (request, reply) => {
            await adminEnrollmentService.removeStudentFromClass(request.params.id, request.params.studentId);

            return reply.send({
                success: true,
                message: 'Student removed successfully',
            });
        },
    });
}
