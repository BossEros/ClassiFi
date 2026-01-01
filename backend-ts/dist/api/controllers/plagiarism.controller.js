import { container } from 'tsyringe';
import { BadRequestError } from '../middlewares/error-handler.js';
/** Plagiarism detection routes - /api/v1/plagiarism/* */
export async function plagiarismRoutes(app) {
    const plagiarismService = container.resolve('PlagiarismService');
    /**
     * POST /analyze
     * Analyze files for plagiarism
     */
    app.post('/analyze', {
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
            }
            catch (error) {
                throw new BadRequestError(error.message);
            }
        },
    });
    /**
     * GET /reports/:reportId
     * Get a report by ID
     */
    app.get('/reports/:reportId', {
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
    app.get('/reports/:reportId/pairs/:pairId', {
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
            }
            catch (error) {
                return reply.status(404).send({ error: error.message });
            }
        },
    });
    /**
     * DELETE /reports/:reportId
     * Delete a report
     */
    app.delete('/reports/:reportId', {
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
}
//# sourceMappingURL=plagiarism.controller.js.map