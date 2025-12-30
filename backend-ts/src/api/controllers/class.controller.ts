import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ClassService } from '../../services/class.service.js';
import {
    CreateClassRequestSchema,
    UpdateClassRequestSchema,
    DeleteClassRequestSchema,
    ClassIdParamSchema,
    TeacherIdParamSchema,
    GetClassesQuerySchema,
    GetClassByIdQuerySchema,
    TeacherIdQuerySchema,
    CreateClassResponseSchema,
    GetClassResponseSchema,
    UpdateClassResponseSchema,
    ClassListResponseSchema,
    GenerateCodeResponseSchema,
    ClassStudentsResponseSchema,
    SuccessMessageSchema,
    type CreateClassRequest,
    type UpdateClassRequest,
    type DeleteClassRequest,
} from '../schemas/class.schema.js';
import {
    CreateAssignmentRequestSchema,
    AssignmentResponseSchema,
    type CreateAssignmentRequest
} from '../schemas/assignment.schema.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middlewares/error-handler.js';

const classService = new ClassService();

// Helper to convert Zod schema to JSON Schema for Swagger
const toJsonSchema = (schema: z.ZodType) => zodToJsonSchema(schema, { target: 'openApi3' });

// Shared response schemas for assignments
const AssignmentListResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignments: z.array(AssignmentResponseSchema),
});

const CreateAssignmentResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    assignment: AssignmentResponseSchema,
});

// Combined params for student removal
const ClassStudentParamsSchema = z.object({
    classId: z.string(),
    studentId: z.string(),
});

/** Class routes - /api/v1/classes/* */
export async function classRoutes(app: FastifyInstance): Promise<void> {

    /**
     * POST /
     * Create a new class
     */
    app.post<{ Body: CreateClassRequest }>('/', {
        schema: {
            tags: ['Classes'],
            summary: 'Create a new class',
            body: toJsonSchema(CreateClassRequestSchema),
            response: {
                201: toJsonSchema(CreateClassResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const { teacherId, className, classCode, yearLevel, semester, academicYear, schedule, description } = request.body;
            const result = await classService.createClass(
                teacherId,
                className,
                classCode,
                yearLevel,
                semester,
                academicYear,
                schedule,
                description
            );

            if (!result.success) {
                throw new BadRequestError(result.message);
            }

            return reply.status(201).send({
                success: true,
                message: result.message,
                class: result.classData,
            });
        },
    });

    /**
     * GET /generate-code
     * Generate a unique class code
     */
    app.get('/generate-code', {
        schema: {
            tags: ['Classes'],
            summary: 'Generate a unique class code',
            response: {
                200: toJsonSchema(GenerateCodeResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const code = await classService.generateClassCode();

            return reply.send({
                success: true,
                code,
                message: 'Class code generated successfully',
            });
        },
    });

    /**
     * GET /teacher/:teacherId
     * Get all classes for a teacher
     */
    app.get<{ Params: { teacherId: string }; Querystring: { activeOnly?: string } }>('/teacher/:teacherId', {
        schema: {
            tags: ['Classes'],
            summary: 'Get all classes for a teacher',
            params: toJsonSchema(TeacherIdParamSchema),
            querystring: toJsonSchema(GetClassesQuerySchema),
            response: {
                200: toJsonSchema(ClassListResponseSchema),
            },
        },
        handler: async (request, reply) => {
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
        },
    });

    /**
     * GET /:classId
     * Get a class by ID
     */
    app.get<{ Params: { classId: string }; Querystring: { teacherId?: string } }>('/:classId', {
        schema: {
            tags: ['Classes'],
            summary: 'Get a class by ID',
            params: toJsonSchema(ClassIdParamSchema),
            querystring: toJsonSchema(GetClassByIdQuerySchema),
            response: {
                200: toJsonSchema(GetClassResponseSchema),
            },
        },
        handler: async (request, reply) => {
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
        },
    });

    /**
     * PUT /:classId
     * Update a class
     */
    app.put<{ Params: { classId: string }; Body: UpdateClassRequest }>('/:classId', {
        schema: {
            tags: ['Classes'],
            summary: 'Update a class',
            params: toJsonSchema(ClassIdParamSchema),
            body: toJsonSchema(UpdateClassRequestSchema),
            response: {
                200: toJsonSchema(UpdateClassResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const classId = parseInt(request.params.classId, 10);

            if (isNaN(classId)) {
                throw new BadRequestError('Invalid class ID');
            }

            const { teacherId, className, description, isActive } = request.body;

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
        },
    });

    /**
     * DELETE /:classId
     * Delete a class
     */
    app.delete<{ Params: { classId: string }; Body: DeleteClassRequest }>('/:classId', {
        schema: {
            tags: ['Classes'],
            summary: 'Delete a class',
            params: toJsonSchema(ClassIdParamSchema),
            body: toJsonSchema(DeleteClassRequestSchema),
            response: {
                200: toJsonSchema(SuccessMessageSchema),
            },
        },
        handler: async (request, reply) => {
            const classId = parseInt(request.params.classId, 10);

            if (isNaN(classId)) {
                throw new BadRequestError('Invalid class ID');
            }

            const { teacherId } = request.body;
            const result = await classService.deleteClass(classId, teacherId);

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
        },
    });

    /**
     * POST /:classId/assignments
     * Create an assignment for a class
     */
    app.post<{ Params: { classId: string }; Body: CreateAssignmentRequest }>('/:classId/assignments', {
        schema: {
            tags: ['Classes'],
            summary: 'Create an assignment for a class',
            params: toJsonSchema(ClassIdParamSchema),
            body: toJsonSchema(CreateAssignmentRequestSchema),
            response: {
                201: toJsonSchema(CreateAssignmentResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const classId = parseInt(request.params.classId, 10);

            if (isNaN(classId)) {
                throw new BadRequestError('Invalid class ID');
            }

            const { teacherId, assignmentName, description, programmingLanguage, deadline, allowResubmission } = request.body;

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
        },
    });

    /**
     * GET /:classId/assignments
     * Get all assignments for a class
     */
    app.get<{ Params: { classId: string } }>('/:classId/assignments', {
        schema: {
            tags: ['Classes'],
            summary: 'Get all assignments for a class',
            params: toJsonSchema(ClassIdParamSchema),
            response: {
                200: toJsonSchema(AssignmentListResponseSchema),
            },
        },
        handler: async (request, reply) => {
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
        },
    });

    /**
     * GET /:classId/students
     * Get all students in a class
     */
    app.get<{ Params: { classId: string } }>('/:classId/students', {
        schema: {
            tags: ['Classes'],
            summary: 'Get all students in a class',
            params: toJsonSchema(ClassIdParamSchema),
            response: {
                200: toJsonSchema(ClassStudentsResponseSchema),
            },
        },
        handler: async (request, reply) => {
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
        },
    });

    /**
     * DELETE /:classId/students/:studentId
     * Remove a student from a class
     */
    app.delete<{ Params: { classId: string; studentId: string }; Querystring: { teacherId: string } }>('/:classId/students/:studentId', {
        schema: {
            tags: ['Classes'],
            summary: 'Remove a student from a class',
            params: toJsonSchema(ClassStudentParamsSchema),
            querystring: toJsonSchema(TeacherIdQuerySchema),
            response: {
                200: toJsonSchema(SuccessMessageSchema),
            },
        },
        handler: async (request, reply) => {
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
        },
    });
}
