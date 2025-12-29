import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { container } from 'tsyringe';
import { AuthService } from '../../services/auth.service.js';
import {
    RegisterRequestSchemaForDocs,
    LoginRequestSchema,
    ForgotPasswordRequestSchema,
    AuthResponseSchema,
    type RegisterRequest,
    type LoginRequest,
    type ForgotPasswordRequest,
} from '../schemas/auth.schema.js';
import { ApiError } from '../middlewares/error-handler.js';

// Helper to convert Zod schema to JSON Schema for Swagger
const toJsonSchema = (schema: z.ZodType) => zodToJsonSchema(schema, { target: 'openApi3' });

// Shared response schemas
const SuccessMessageSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});

const VerifyQuerySchema = z.object({
    token: z.string(),
});

type VerifyQuery = z.infer<typeof VerifyQuerySchema>;

/** Auth routes - /api/v1/auth/* */
export async function authRoutes(app: FastifyInstance): Promise<void> {
    const authService = container.resolve<AuthService>('AuthService');

    /**
     * POST /register
     * Register a new user
     */
    app.post<{ Body: RegisterRequest }>('/register', {
        schema: {
            tags: ['Auth'],
            summary: 'Register a new user',
            body: toJsonSchema(RegisterRequestSchemaForDocs),
            response: {
                201: toJsonSchema(AuthResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const { email, password, confirmPassword, username, firstName, lastName, role } = request.body;

            const result = await authService.registerUser(
                email,
                password,
                username,
                firstName,
                lastName,
                role
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
    app.post<{ Body: LoginRequest }>('/login', {
        schema: {
            tags: ['Auth'],
            summary: 'Login with email and password',
            body: toJsonSchema(LoginRequestSchema),
            response: {
                200: toJsonSchema(AuthResponseSchema),
            },
        },
        handler: async (request, reply) => {
            const { email, password } = request.body;
            const result = await authService.loginUser(email, password);

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
    app.post<{ Querystring: VerifyQuery }>('/verify', {
        schema: {
            tags: ['Auth'],
            summary: 'Verify access token',
            querystring: toJsonSchema(VerifyQuerySchema),
        },
        handler: async (request, reply) => {
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
    app.post<{ Body: ForgotPasswordRequest }>('/forgot-password', {
        schema: {
            tags: ['Auth'],
            summary: 'Request password reset email',
            body: toJsonSchema(ForgotPasswordRequestSchema),
            response: {
                200: toJsonSchema(SuccessMessageSchema),
            },
        },
        handler: async (request, reply) => {
            const { email } = request.body;
            await authService.requestPasswordReset(email);

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
            response: {
                200: toJsonSchema(SuccessMessageSchema),
            },
        },
        handler: async (request, reply) => {
            return reply.send({
                success: true,
                message: 'Logout successful. Clear session on client.',
            });
        },
    });
}
