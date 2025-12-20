import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ClassService } from '../../services/class.service.js';
import {
    CreateClassRequestSchema,
    UpdateClassRequestSchema,
    DeleteClassRequestSchema,
    type CreateClassRequest,
    type UpdateClassRequest,
    type DeleteClassRequest,
} from '../schemas/class.schema.js';
import { CreateAssignmentRequestSchema, type CreateAssignmentRequest } from '../schemas/assignment.schema.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middlewares/error-handler.js';

const classService = new ClassService();

/** Class routes - /api/v1/classes/* */
export async function classRoutes(app: FastifyInstance): Promise<void> {
    /** POST / - Create a new class */
    app.post('/', async (
        request: FastifyRequest<{ Body: CreateClassRequest }>,
        reply: FastifyReply
    ) => {
        const parseResult = CreateClassRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request');
        }

        const { teacherId, className, description } = parseResult.data;
        const result = await classService.createClass(teacherId, className, description);

        if (!result.success) {
            throw new BadRequestError(result.message);
        }

        return reply.status(201).send({
            success: true,
            message: result.message,
            class: result.classData,
        });
    });

    /** GET /generate-code - Generate a unique class code */
    app.get('/generate-code', async (request: FastifyRequest, reply: FastifyReply) => {
        const code = await classService.generateClassCode();

        return reply.send({
            success: true,
            code,
            message: 'Class code generated successfully',
        });
    });

    /** GET /teacher/:teacherId - Get all classes for a teacher */
    app.get('/teacher/:teacherId', async (
        request: FastifyRequest<{ Params: { teacherId: string }; Querystring: { activeOnly?: string } }>,
        reply: FastifyReply
    ) => {
        const teacherId = parseInt(request.params.teacherId, 10);
        const activeOnly = request.query.activeOnly !== 'false';

        if (isNaN(teacherId)) {
            throw new BadRequestError('Invalid teacher ID');
        }

        const result = await classService.getClassesByTeacher(teacherId, activeOnly);

        return reply.send({
            success: true,
            message: result.message,
            classes: result.classes,
        });
    });

    /** GET /:classId - Get a class by ID */
    app.get('/:classId', async (
        request: FastifyRequest<{ Params: { classId: string }; Querystring: { teacherId?: string } }>,
        reply: FastifyReply
    ) => {
        const classId = parseInt(request.params.classId, 10);
        const teacherId = request.query.teacherId ? parseInt(request.query.teacherId, 10) : undefined;

        if (isNaN(classId)) {
            throw new BadRequestError('Invalid class ID');
        }

        const result = await classService.getClassById(classId, teacherId);

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
            class: result.classData,
        });
    });

    /** PUT /:classId - Update a class */
    app.put('/:classId', async (
        request: FastifyRequest<{ Params: { classId: string }; Body: UpdateClassRequest }>,
        reply: FastifyReply
    ) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
            throw new BadRequestError('Invalid class ID');
        }

        const parseResult = UpdateClassRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request');
        }

        const { teacherId, className, description, isActive } = parseResult.data;

        const result = await classService.updateClass(classId, teacherId, {
            className,
            description,
            isActive,
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
            classInfo: result.classData,
        });
    });

    /** DELETE /:classId - Delete a class */
    app.delete('/:classId', async (
        request: FastifyRequest<{ Params: { classId: string }; Body: DeleteClassRequest }>,
        reply: FastifyReply
    ) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
            throw new BadRequestError('Invalid class ID');
        }

        const parseResult = DeleteClassRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request');
        }

        const result = await classService.deleteClass(classId, parseResult.data.teacherId);

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

    /** POST /:classId/assignments - Create an assignment */
    app.post('/:classId/assignments', async (
        request: FastifyRequest<{ Params: { classId: string }; Body: CreateAssignmentRequest }>,
        reply: FastifyReply
    ) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
            throw new BadRequestError('Invalid class ID');
        }

        const parseResult = CreateAssignmentRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new BadRequestError(parseResult.error.errors[0]?.message ?? 'Invalid request');
        }

        const { teacherId, assignmentName, description, programmingLanguage, deadline, allowResubmission } = parseResult.data;

        const result = await classService.createAssignment(classId, teacherId, {
            assignmentName,
            description,
            programmingLanguage,
            deadline: new Date(deadline),
            allowResubmission,
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

        return reply.status(201).send({
            success: true,
            message: result.message,
            assignment: result.assignment,
        });
    });

    /** GET /:classId/assignments - Get class assignments */
    app.get('/:classId/assignments', async (
        request: FastifyRequest<{ Params: { classId: string } }>,
        reply: FastifyReply
    ) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
            throw new BadRequestError('Invalid class ID');
        }

        const result = await classService.getClassAssignments(classId);

        return reply.send({
            success: true,
            message: result.message,
            assignments: result.assignments,
        });
    });

    /** GET /:classId/students - Get class students */
    app.get('/:classId/students', async (
        request: FastifyRequest<{ Params: { classId: string } }>,
        reply: FastifyReply
    ) => {
        const classId = parseInt(request.params.classId, 10);

        if (isNaN(classId)) {
            throw new BadRequestError('Invalid class ID');
        }

        const result = await classService.getClassStudents(classId);

        return reply.send({
            success: true,
            message: result.message,
            students: result.students,
        });
    });

    /** DELETE /:classId/students/:studentId - Remove a student */
    app.delete('/:classId/students/:studentId', async (
        request: FastifyRequest<{ Params: { classId: string; studentId: string }; Querystring: { teacherId: string } }>,
        reply: FastifyReply
    ) => {
        const classId = parseInt(request.params.classId, 10);
        const studentId = parseInt(request.params.studentId, 10);
        const teacherId = parseInt(request.query.teacherId, 10);

        if (isNaN(classId) || isNaN(studentId) || isNaN(teacherId)) {
            throw new BadRequestError('Invalid ID parameters');
        }

        const result = await classService.removeStudent(classId, studentId, teacherId);

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
