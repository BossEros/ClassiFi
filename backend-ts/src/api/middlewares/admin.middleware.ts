/**
 * Admin Middleware
 * Verifies the user has admin role
 */
import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from 'fastify';
import { ForbiddenError } from './error-handler.js';

/**
 * Admin role verification middleware.
 * Must be used AFTER authMiddleware.
 * 
 * Usage in routes:
 * ```typescript
 * app.get('/admin/users', { preHandler: [authMiddleware, adminMiddleware] }, handler);
 * ```
 */
export const adminMiddleware: preHandlerHookHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    // Ensure user is authenticated first
    if (!request.user) {
        throw new ForbiddenError('Authentication required');
    }

    // Check for admin role
    if (request.user.role !== 'admin') {
        throw new ForbiddenError('Admin access required');
    }
};
