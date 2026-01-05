import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { PlagiarismService, AnalyzeRequest } from '../../services/plagiarism.service.js';
import { BadRequestError } from '../middlewares/error-handler.js';

/** Plagiarism detection routes - /api/v1/plagiarism/* */
export async function plagiarismRoutes(app: FastifyInstance): Promise<void> {
    const plagiarismService = container.resolve<PlagiarismService>('PlagiarismService');

    /**
     * POST /analyze
     * Analyze files for plagiarism
     */
    app.post<{ Body: AnalyzeRequest }>('/analyze', {
        schema: {
            tags: ['Plagiarism'],
            summary: 'Analyze files for plagiarism detection',
            body: {
                type: 'object',
                required: ['files', 'language'],
                properties: {
                    files: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['path', 'content'],
                            properties: {
                                id: { type: 'string' },
                                path: { type: 'string' },
                                content: { type: 'string' },
                                studentId: { type: 'string' },
                                studentName: { type: 'string' },
                            },
                        },
                        minItems: 2,
                    },
                    language: {
                        type: 'string',
                        enum: ['java', 'python', 'c'],
                    },
                    templateFile: {
                        type: 'object',
                        properties: {
                            path: { type: 'string' },
                            content: { type: 'string' },
                        },
                    },
                    threshold: { type: 'number', minimum: 0, maximum: 1 },
                    kgramLength: { type: 'integer', minimum: 1 },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        reportId: { type: 'string' },
                        summary: {
                            type: 'object',
                            properties: {
                                totalFiles: { type: 'number' },
                                totalPairs: { type: 'number' },
                                suspiciousPairs: { type: 'number' },
                                averageSimilarity: { type: 'number' },
                                maxSimilarity: { type: 'number' },
                            },
                        },
                        pairs: { type: 'array' },
                        warnings: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const result = await plagiarismService.analyzeFiles(request.body);
                return reply.send(result);
            } catch (error) {
                throw new BadRequestError((error as Error).message);
            }
        },
    });

    /**
     * POST /analyze/assignment/:assignmentId
     * Analyze all submissions for an assignment
     */
    app.post<{ Params: { assignmentId: string } }>('/analyze/assignment/:assignmentId', {
        schema: {
            tags: ['Plagiarism'],
            summary: 'Analyze all submissions for an assignment',
            description: 'Fetches all latest submissions for the specified assignment, downloads their content, and runs plagiarism detection.',
            params: {
                type: 'object',
                required: ['assignmentId'],
                properties: {
                    assignmentId: { type: 'string', description: 'ID of the assignment to analyze' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        reportId: { type: 'string' },
                        summary: {
                            type: 'object',
                            properties: {
                                totalFiles: { type: 'number' },
                                totalPairs: { type: 'number' },
                                suspiciousPairs: { type: 'number' },
                                averageSimilarity: { type: 'number' },
                                maxSimilarity: { type: 'number' },
                            },
                        },
                        pairs: { type: 'array' },
                        warnings: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
        },
        handler: async (request, reply) => {
            try {
                const assignmentId = parseInt(request.params.assignmentId, 10);
                if (isNaN(assignmentId)) {
                    throw new BadRequestError('Invalid assignment ID');
                }
                const result = await plagiarismService.analyzeAssignmentSubmissions(assignmentId);
                return reply.send(result);
            } catch (error) {
                throw new BadRequestError((error as Error).message);
            }
        },
    });

    /**
     * GET /reports/:reportId
     * Get a report by ID
     */
    app.get<{ Params: { reportId: string } }>('/reports/:reportId', {
        schema: {
            tags: ['Plagiarism'],
            summary: 'Get plagiarism report by ID',
            params: {
                type: 'object',
                required: ['reportId'],
                properties: {
                    reportId: { type: 'string' },
                },
            },
        },
        handler: async (request, reply) => {
            const { reportId } = request.params;
            const result = await plagiarismService.getReport(reportId);

            if (!result) {
                return reply.status(404).send({ error: 'Report not found' });
            }

            return reply.send(result);
        },
    });

    /**
     * GET /reports/:reportId/pairs/:pairId
     * Get pair details with fragments
     */
    app.get<{ Params: { reportId: string; pairId: string } }>('/reports/:reportId/pairs/:pairId', {
        schema: {
            tags: ['Plagiarism'],
            summary: 'Get pair details with matching fragments',
            params: {
                type: 'object',
                required: ['reportId', 'pairId'],
                properties: {
                    reportId: { type: 'string' },
                    pairId: { type: 'string' },
                },
            },
        },
        handler: async (request, reply) => {
            const { reportId, pairId } = request.params;
            const pairIdNum = parseInt(pairId, 10);

            if (isNaN(pairIdNum)) {
                throw new BadRequestError('Invalid pair ID');
            }

            try {
                const result = await plagiarismService.getPairDetails(reportId, pairIdNum);
                return reply.send(result);
            } catch (error) {
                return reply.status(404).send({ error: (error as Error).message });
            }
        },
    });

    /**
     * DELETE /reports/:reportId
     * Delete a report
     */
    app.delete<{ Params: { reportId: string } }>('/reports/:reportId', {
        schema: {
            tags: ['Plagiarism'],
            summary: 'Delete a plagiarism report',
            params: {
                type: 'object',
                required: ['reportId'],
                properties: {
                    reportId: { type: 'string' },
                },
            },
        },
        handler: async (request, reply) => {
            const { reportId } = request.params;
            const deleted = await plagiarismService.deleteReport(reportId);

            if (!deleted) {
                return reply.status(404).send({ error: 'Report not found' });
            }

            return reply.send({ success: true });
        },
    });

    /**
     * GET /results/:resultId/details
     * Get result details with fragments and file content (from database)
     */
    app.get<{ Params: { resultId: string } }>('/results/:resultId/details', {
        schema: {
            tags: ['Plagiarism'],
            summary: 'Get result details with fragments and file content',
            params: {
                type: 'object',
                required: ['resultId'],
                properties: {
                    resultId: { type: 'string' },
                },
            },
        },
        handler: async (request, reply) => {
            const resultId = parseInt(request.params.resultId, 10);
            if (isNaN(resultId)) {
                throw new BadRequestError('Invalid result ID');
            }

            try {
                const details = await plagiarismService.getResultDetails(resultId);
                return reply.send(details);
            } catch (error) {
                return reply.status(404).send({ error: (error as Error).message });
            }
        },
    });
}
