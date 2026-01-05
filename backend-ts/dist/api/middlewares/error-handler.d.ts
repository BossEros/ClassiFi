import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
/** Custom API error class */
export declare class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
/** 400 Bad Request */
export declare class BadRequestError extends ApiError {
    constructor(message?: string);
}
/** 401 Unauthorized */
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string);
}
/** 403 Forbidden */
export declare class ForbiddenError extends ApiError {
    constructor(message?: string);
}
/** 404 Not Found */
export declare class NotFoundError extends ApiError {
    constructor(message?: string);
}
/** Global error handler for Fastify */
export declare function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply): void;
//# sourceMappingURL=error-handler.d.ts.map