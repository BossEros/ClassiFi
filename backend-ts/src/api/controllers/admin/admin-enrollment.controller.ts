/**
 * Admin Enrollment Controller
 * Handles student enrollment endpoints.
 */
import type { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';
import { AdminEnrollmentService } from '../../../services/admin/admin-enrollment.service.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { adminMiddleware } from '../../middlewares/admin.middleware.js';
import { toJsonSchema } from '../../utils/swagger.js';
import { ClassParamsSchema, type ClassParams } from '../../schemas/admin.schema.js';

export async function adminEnrollmentRoutes(app: FastifyInstance): Promise<void> {
    const adminEnrollmentService = container.resolve<AdminEnrollmentService>('AdminEnrollmentService');
    const preHandler = [authMiddleware, adminMiddleware];

    // GET /classes/:id/students
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

    // POST /classes/:id/students
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
            return reply.send({ success: true, message: 'Student enrolled successfully' });
        },
    });

    // DELETE /classes/:id/students/:studentId
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
            return reply.send({ success: true, message: 'Student removed successfully' });
        },
    });
}
