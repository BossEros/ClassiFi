/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to requests
 */
import type { preHandlerHookHandler } from 'fastify';
/** Extended request type with user info */
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: number;
            supabaseUserId: string | null;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        };
    }
}
/**
 * Authentication hook that verifies the Authorization header
 * and attaches user info to the request.
 *
 * Usage in routes:
 * ```typescript
 * app.get('/protected', { preHandler: [authMiddleware] }, async (request, reply) => {
 *     const userId = request.user!.id;
 * });
 * ```
 */
export declare const authMiddleware: preHandlerHookHandler;
/**
 * Optional auth middleware - doesn't throw if no token,
 * but still verifies if token is present.
 */
export declare const optionalAuthMiddleware: preHandlerHookHandler;
//# sourceMappingURL=auth.middleware.d.ts.map