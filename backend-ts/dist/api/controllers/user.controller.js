import { container } from 'tsyringe';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { toJsonSchema } from '../utils/swagger.js';
import { SuccessMessageSchema } from '../schemas/common.schema.js';
import { toUserDTO } from '../../shared/mappers.js';
import { z } from 'zod';
/** Schema for avatar update request */
const UpdateAvatarSchema = z.object({
    avatarUrl: z.string().url('Invalid URL format'),
});
/** User routes - /api/v1/user/* */
export async function userRoutes(app) {
    const userService = container.resolve('UserService');
    /**
     * GET /me
     * Get current user's profile
     */
    app.get('/me', {
        preHandler: [authMiddleware],
        schema: {
            tags: ['User'],
            summary: 'Get current user profile',
            security: [{ bearerAuth: [] }],
        },
        handler: async (request, reply) => {
            const userId = request.user.id;
            const user = await userService.getUserById(userId);
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    message: 'User not found',
                });
            }
            return reply.send({
                success: true,
                user: toUserDTO(user),
            });
        },
    });
    /**
     * PATCH /me/avatar
     * Update the current user's avatar URL
     */
    app.patch('/me/avatar', {
        preHandler: [authMiddleware],
        schema: {
            tags: ['User'],
            summary: 'Update user avatar URL',
            security: [{ bearerAuth: [] }],
            body: toJsonSchema(UpdateAvatarSchema),
            response: {
                200: toJsonSchema(SuccessMessageSchema),
            },
        },
        handler: async (request, reply) => {
            const userId = request.user.id;
            const { avatarUrl } = request.body;
            await userService.updateAvatarUrl(userId, avatarUrl);
            return reply.send({
                success: true,
                message: 'Avatar updated successfully.',
            });
        },
    });
    /**
     * DELETE /me
     * Delete the current user's account
     */
    app.delete('/me', {
        preHandler: [authMiddleware],
        schema: {
            tags: ['User'],
            summary: 'Delete current user account',
            description: 'Permanently deletes the authenticated user\'s account and all associated data.',
            security: [{ bearerAuth: [] }],
            response: {
                200: toJsonSchema(SuccessMessageSchema),
            },
        },
        handler: async (request, reply) => {
            const userId = request.user.id;
            await userService.deleteAccount(userId);
            return reply.send({
                success: true,
                message: 'Your account has been permanently deleted.',
            });
        },
    });
}
//# sourceMappingURL=user.controller.js.map