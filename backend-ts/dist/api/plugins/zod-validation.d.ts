/**
 * Zod Validation Plugin for Fastify
 * Provides declarative validation using Zod schemas
 */
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';
import type { ZodSchema } from 'zod';
/** Validate request body against a Zod schema */
export declare function validateBody<T>(schema: ZodSchema<T>): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
/** Validate request query against a Zod schema */
export declare function validateQuery<T>(schema: ZodSchema<T>): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
/** Validate request params against a Zod schema */
export declare function validateParams<T>(schema: ZodSchema<T>): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
declare const _default: FastifyPluginAsync;
export default _default;
declare module 'fastify' {
    interface FastifyRequest {
        validatedBody: unknown;
        validatedQuery: unknown;
        validatedParams: unknown;
    }
}
//# sourceMappingURL=zod-validation.d.ts.map