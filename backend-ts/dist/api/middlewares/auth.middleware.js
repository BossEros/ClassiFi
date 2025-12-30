import { container } from 'tsyringe';
import { UnauthorizedError } from './error-handler.js';
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
export const authMiddleware = async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw new UnauthorizedError('Authorization header is required');
    }
    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        throw new UnauthorizedError('Invalid authorization header format');
    }
    const token = parts[1];
    try {
        const authService = container.resolve('AuthService');
        const userData = await authService.verifyToken(token);
        // Attach user to request
        request.user = userData;
    }
    catch (error) {
        throw new UnauthorizedError('Invalid or expired token');
    }
};
/**
 * Optional auth middleware - doesn't throw if no token,
 * but still verifies if token is present.
 */
export const optionalAuthMiddleware = async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return; // No token, continue without user
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return; // Invalid format, continue without user
    }
    const token = parts[1];
    try {
        const authService = container.resolve('AuthService');
        const userData = await authService.verifyToken(token);
        request.user = userData;
    }
    catch (error) {
        // Token invalid, continue without user
    }
};
//# sourceMappingURL=auth.middleware.js.map