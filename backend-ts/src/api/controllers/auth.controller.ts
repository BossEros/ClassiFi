import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { container } from 'tsyringe';
import { AuthService } from '../../services/auth.service.js';
import {
    RegisterRequestSchema,
    LoginRequestSchema,
    ForgotPasswordRequestSchema,
    type RegisterRequest,
    type LoginRequest,
    type ForgotPasswordRequest,
} from '../schemas/auth.schema.js';
import { validateBody } from '../plugins/zod-validation.js';
import { ApiError } from '../middlewares/error-handler.js';

/** Auth routes - /api/v1/auth/* */
export async function authRoutes(app: FastifyInstance): Promise<void> {
    const authService = container.resolve<AuthService>('AuthService');

    /**
     * POST /register
     * Register a new user
     */
    app.post('/register', {
        preHandler: validateBody(RegisterRequestSchema),
        schema: {
            tags: ['Auth'],
            summary: 'Register a new user',
            body: {
                type: 'object',
                required: ['email', 'password', 'confirmPassword', 'username', 'firstName', 'lastName', 'role'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    confirmPassword: { type: 'string' },
                    username: { type: 'string', minLength: 3 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    role: { type: 'string', enum: ['student', 'teacher'] },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        user: { $ref: 'User#' },
                        token: { type: 'string', nullable: true },
                    },
                },
            },
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            const body = request.validatedBody as RegisterRequest;

            const result = await authService.registerUser(
                body.email,
                body.password,
                body.username,
                body.firstName,
                body.lastName,
                body.role
            );

            return reply.status(201).send({
                success: true,
                message: 'Registration successful',
                user: result.userData,
                token: result.token,
            });
        },
    });

    /**
     * POST /login
     * Login a user
     */
    app.post('/login', {
        preHandler: validateBody(LoginRequestSchema),
        schema: {
            tags: ['Auth'],
            summary: 'Login with email and password',
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        user: { $ref: 'User#' },
                        token: { type: 'string', nullable: true },
                    },
                },
            },
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            const body = request.validatedBody as LoginRequest;

            const result = await authService.loginUser(body.email, body.password);

            return reply.send({
                success: true,
                message: 'Login successful',
                user: result.userData,
                token: result.token,
            });
        },
    });

    /**
     * POST /verify
     * Verify a Supabase access token
     */
    app.post('/verify', {
        schema: {
            tags: ['Auth'],
            summary: 'Verify access token',
            querystring: {
                type: 'object',
                required: ['token'],
                properties: {
                    token: { type: 'string' },
                },
            },
        },
        handler: async (request: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
            const { token } = request.query;

            if (!token) {
                throw new ApiError('Token is required', 400);
            }

            const userData = await authService.verifyToken(token);

            return reply.send({
                success: true,
                message: 'Token is valid',
                user: userData,
            });
        },
    });

    /**
     * POST /forgot-password
     * Request a password reset email
     */
    app.post('/forgot-password', {
        preHandler: validateBody(ForgotPasswordRequestSchema),
        schema: {
            tags: ['Auth'],
            summary: 'Request password reset email',
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            const body = request.validatedBody as ForgotPasswordRequest;

            await authService.requestPasswordReset(body.email);

            return reply.send({
                success: true,
                message: 'If the email exists, a password reset link has been sent',
            });
        },
    });

    /**
     * POST /logout
     * Logout endpoint (placeholder - actual logout is client-side)
     */
    app.post('/logout', {
        schema: {
            tags: ['Auth'],
            summary: 'Logout user',
        },
        handler: async (request: FastifyRequest, reply: FastifyReply) => {
            return reply.send({
                success: true,
                message: 'Logout successful. Clear session on client.',
            });
        },
    });
}
