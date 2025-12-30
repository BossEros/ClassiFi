import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { SubmissionService } from '../../services/submission.service.js';
import { SubmitAssignmentResponseSchema, SubmissionListResponseSchema, SubmissionHistoryResponseSchema, } from '../schemas/submission.schema.js';
import { BadRequestError, NotFoundError } from '../middlewares/error-handler.js';
const submissionService = new SubmissionService();
// Helper to convert Zod schema to JSON Schema for Swagger
const toJsonSchema = (schema) => zodToJsonSchema(schema, { target: 'openApi3' });
// Param schemas
const SubmissionIdParamSchema = z.object({
    submissionId: z.string(),
});
const AssignmentIdParamSchema = z.object({
    assignmentId: z.string(),
});
const StudentIdParamSchema = z.object({
    studentId: z.string(),
});
const HistoryParamsSchema = z.object({
    assignmentId: z.string(),
    studentId: z.string(),
});
// Query schemas
const LatestOnlyQuerySchema = z.object({
    latestOnly: z.string().optional(),
});
const StudentIdQuerySchema = z.object({
    studentId: z.string(),
});
// Response schemas
const DownloadResponseSchema = z.object({
    success: z.literal(true),
    message: z.string(),
    downloadUrl: z.string(),
});
/** Submission routes - /api/v1/submissions/* */
export async function submissionRoutes(app) {
    /**
     * POST /
     * Submit an assignment (file upload)
     * Note: File upload endpoints use multipart/form-data and need special handling
     */
    app.post('/', {
        schema: {
            tags: ['Submissions'],
            summary: 'Submit an assignment (file upload)',
            consumes: ['multipart/form-data'],
            response: {
                201: toJsonSchema(SubmitAssignmentResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const data = await request.file();
            if (!data) {
                throw new BadRequestError('No file uploaded');
            }
            const assignmentId = parseInt(data.fields.assignment_id?.value ?? '0', 10);
            const studentId = parseInt(data.fields.student_id?.value ?? '0', 10);
            if (isNaN(assignmentId) || isNaN(studentId) || assignmentId === 0 || studentId === 0) {
                throw new BadRequestError('Assignment ID and Student ID are required');
            }
            const buffer = await data.toBuffer();
            const result = await submissionService.submitAssignment(assignmentId, studentId, {
                filename: data.filename,
                data: buffer,
                mimetype: data.mimetype,
            });
            if (!result.success) {
                throw new BadRequestError(result.message);
            }
            return reply.status(201).send({
                success: true,
                message: result.message,
                submission: result.submission,
            });
        },
    });
    /**
     * GET /history/:assignmentId/:studentId
     * Get submission history for a student on an assignment
     */
    app.get('/history/:assignmentId/:studentId', {
        schema: {
            tags: ['Submissions'],
            summary: 'Get submission history for a student on an assignment',
            params: toJsonSchema(HistoryParamsSchema),
            response: {
                200: toJsonSchema(SubmissionHistoryResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const assignmentId = parseInt(request.params.assignmentId, 10);
            const studentId = parseInt(request.params.studentId, 10);
            if (isNaN(assignmentId) || isNaN(studentId)) {
                throw new BadRequestError('Invalid parameters');
            }
            const result = await submissionService.getSubmissionHistory(assignmentId, studentId);
            return reply.send({
                success: true,
                message: result.message,
                submissions: result.submissions,
                totalSubmissions: result.submissions.length,
            });
        },
    });
    /**
     * GET /assignment/:assignmentId
     * Get all submissions for an assignment
     */
    app.get('/assignment/:assignmentId', {
        schema: {
            tags: ['Submissions'],
            summary: 'Get all submissions for an assignment',
            params: toJsonSchema(AssignmentIdParamSchema),
            querystring: toJsonSchema(LatestOnlyQuerySchema),
            response: {
                200: toJsonSchema(SubmissionListResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const assignmentId = parseInt(request.params.assignmentId, 10);
            const latestOnly = request.query.latestOnly !== 'false';
            if (isNaN(assignmentId)) {
                throw new BadRequestError('Invalid assignment ID');
            }
            const result = await submissionService.getAssignmentSubmissions(assignmentId, latestOnly);
            if (!result.success) {
                throw new NotFoundError(result.message);
            }
            return reply.send({
                success: true,
                message: result.message,
                submissions: result.submissions,
            });
        },
    });
    /**
     * GET /student/:studentId
     * Get all submissions by a student
     */
    app.get('/student/:studentId', {
        schema: {
            tags: ['Submissions'],
            summary: 'Get all submissions by a student',
            params: toJsonSchema(StudentIdParamSchema),
            querystring: toJsonSchema(LatestOnlyQuerySchema),
            response: {
                200: toJsonSchema(SubmissionListResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const studentId = parseInt(request.params.studentId, 10);
            const latestOnly = request.query.latestOnly !== 'false';
            if (isNaN(studentId)) {
                throw new BadRequestError('Invalid student ID');
            }
            const result = await submissionService.getStudentSubmissions(studentId, latestOnly);
            return reply.send({
                success: true,
                message: result.message,
                submissions: result.submissions,
            });
        },
    });
    /**
     * GET /:submissionId/download
     * Get download URL for a submission
     */
    app.get('/:submissionId/download', {
        schema: {
            tags: ['Submissions'],
            summary: 'Get download URL for a submission',
            params: toJsonSchema(SubmissionIdParamSchema),
            querystring: toJsonSchema(StudentIdQuerySchema),
            response: {
                200: toJsonSchema(DownloadResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const submissionId = parseInt(request.params.submissionId, 10);
            const studentId = parseInt(request.query.studentId, 10);
            if (isNaN(submissionId) || isNaN(studentId)) {
                throw new BadRequestError('Invalid parameters');
            }
            // Note: In a full implementation, we would verify authorization here
            // and generate a signed URL from the actual file path
            return reply.send({
                success: true,
                message: 'Download URL generated successfully',
                downloadUrl: '', // Would be generated from the actual file path
            });
        },
    });
}
//# sourceMappingURL=submission.controller.js.map