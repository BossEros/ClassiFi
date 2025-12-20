/**
 * Zod Validation Plugin for Fastify
 * Provides declarative validation using Zod schemas
 */
import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import type { ZodSchema, ZodError } from 'zod';
import fp from 'fastify-plugin';

/** Validation error response format */
interface ValidationErrorResponse {
    success: false;
    message: string;
    errors: Array<{
        field: string;
        message: string;
    }>;
}

/** Format Zod errors for API response */
function formatZodError(error: ZodError): ValidationErrorResponse {
    return {
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        })),
    };
}

/** Validate request body against a Zod schema */
export function validateBody<T>(schema: ZodSchema<T>) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const result = schema.safeParse(request.body);

        if (!result.success) {
            return reply.status(400).send(formatZodError(result.error));
        }

        // Attach parsed data to request
        (request as any).validatedBody = result.data;
    };
}

/** Validate request query against a Zod schema */
export function validateQuery<T>(schema: ZodSchema<T>) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const result = schema.safeParse(request.query);

        if (!result.success) {
            return reply.status(400).send(formatZodError(result.error));
        }

        (request as any).validatedQuery = result.data;
    };
}

/** Validate request params against a Zod schema */
export function validateParams<T>(schema: ZodSchema<T>) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const result = schema.safeParse(request.params);

        if (!result.success) {
            return reply.status(400).send(formatZodError(result.error));
        }

        (request as any).validatedParams = result.data;
    };
}

/** Fastify plugin to add validation decorators */
const zodValidationPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
    // Add decorators for accessing validated data
    app.decorateRequest('validatedBody', null);
    app.decorateRequest('validatedQuery', null);
    app.decorateRequest('validatedParams', null);
};

export default fp(zodValidationPlugin, {
    name: 'zod-validation',
    fastify: '5.x',
});

// Type augmentation for Fastify
declare module 'fastify' {
    interface FastifyRequest {
        validatedBody: unknown;
        validatedQuery: unknown;
        validatedParams: unknown;
    }
}
