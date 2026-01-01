import fp from 'fastify-plugin';
/** Format Zod errors for API response */
function formatZodError(error) {
    return {
        success: false,
        message: 'Validation failed',
        errors: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        })),
    };
}
/** Validate request body against a Zod schema */
export function validateBody(schema) {
    return async (request, reply) => {
        const result = schema.safeParse(request.body);
        if (!result.success) {
            return reply.status(400).send(formatZodError(result.error));
        }
        // Attach parsed data to request
        request.validatedBody = result.data;
    };
}
/** Validate request query against a Zod schema */
export function validateQuery(schema) {
    return async (request, reply) => {
        const result = schema.safeParse(request.query);
        if (!result.success) {
            return reply.status(400).send(formatZodError(result.error));
        }
        request.validatedQuery = result.data;
    };
}
/** Validate request params against a Zod schema */
export function validateParams(schema) {
    return async (request, reply) => {
        const result = schema.safeParse(request.params);
        if (!result.success) {
            return reply.status(400).send(formatZodError(result.error));
        }
        request.validatedParams = result.data;
    };
}
/** Fastify plugin to add validation decorators */
const zodValidationPlugin = async (app) => {
    // Add decorators for accessing validated data
    app.decorateRequest('validatedBody', null);
    app.decorateRequest('validatedQuery', null);
    app.decorateRequest('validatedParams', null);
};
export default fp(zodValidationPlugin, {
    name: 'zod-validation',
    fastify: '5.x',
});
//# sourceMappingURL=zod-validation.js.map