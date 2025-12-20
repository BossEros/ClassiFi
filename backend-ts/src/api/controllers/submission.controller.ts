import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubmissionService } from '../../services/submission.service.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middlewares/error-handler.js';

const submissionService = new SubmissionService();

/** Submission routes - /api/v1/submissions/* */
export async function submissionRoutes(app: FastifyInstance): Promise<void> {
    /** POST / - Submit an assignment (file upload) */
    app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const data = await request.file();

        if (!data) {
            throw new BadRequestError('No file uploaded');
        }

        const assignmentId = parseInt((data.fields.assignment_id as any)?.value ?? '0', 10);
        const studentId = parseInt((data.fields.student_id as any)?.value ?? '0', 10);

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
    });

    /** GET /history/:assignmentId/:studentId - Get submission history */
    app.get('/history/:assignmentId/:studentId', async (
        request: FastifyRequest<{ Params: { assignmentId: string; studentId: string } }>,
        reply: FastifyReply
    ) => {
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
    });

    /** GET /assignment/:assignmentId - Get submissions for an assignment */
    app.get('/assignment/:assignmentId', async (
        request: FastifyRequest<{ Params: { assignmentId: string }; Querystring: { latestOnly?: string } }>,
        reply: FastifyReply
    ) => {
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
    });

    /** GET /student/:studentId - Get submissions by a student */
    app.get('/student/:studentId', async (
        request: FastifyRequest<{ Params: { studentId: string }; Querystring: { latestOnly?: string } }>,
        reply: FastifyReply
    ) => {
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
    });

    /** GET /:submissionId/download - Get download URL for a submission */
    app.get('/:submissionId/download', async (
        request: FastifyRequest<{ Params: { submissionId: string }; Querystring: { studentId: string } }>,
        reply: FastifyReply
    ) => {
        const submissionId = parseInt(request.params.submissionId, 10);
        const studentId = parseInt(request.query.studentId, 10);

        if (isNaN(submissionId) || isNaN(studentId)) {
            throw new BadRequestError('Invalid parameters');
        }

        // Note: In a full implementation, we would verify authorization here
        // For now, we generate a signed URL directly

        // This is simplified - in the real implementation, you'd fetch the submission first
        // and verify the student_id matches before generating the URL

        return reply.send({
            success: true,
            message: 'Download URL generated successfully',
            downloadUrl: '', // Would be generated from the actual file path
        });
    });
}
