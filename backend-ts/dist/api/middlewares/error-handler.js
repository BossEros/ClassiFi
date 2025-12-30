/** Custom API error class */
export class ApiError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}
/** 400 Bad Request */
export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request') {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}
/** 401 Unauthorized */
export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}
/** 403 Forbidden */
export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}
/** 404 Not Found */
export class NotFoundError extends ApiError {
    constructor(message = 'Not Found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}
/** Global error handler for Fastify */
export function errorHandler(error, request, reply) {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message = error.message || 'Internal Server Error';
    // Log error in development
    if (process.env.ENVIRONMENT === 'development') {
        console.error(`[ERROR] ${statusCode} - ${message}`);
        console.error(error.stack);
    }
    reply.status(statusCode).send({
        success: false,
        message,
        error: process.env.ENVIRONMENT === 'development' ? error.stack : undefined,
    });
}
//# sourceMappingURL=error-handler.js.map