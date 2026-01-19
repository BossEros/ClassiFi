import { z } from 'zod';

/** User role enum */
export const UserRoleSchema = z.enum(['student', 'teacher', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/** Register request base schema (for Swagger docs) */
const RegisterRequestBaseSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    role: z.enum(['student', 'teacher']),
});

/** Register request schema with password confirmation validation */
export const RegisterRequestSchema = RegisterRequestBaseSchema.refine(
    (data) => data.password === data.confirmPassword,
    {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }
);

/** For Swagger documentation (schemas with refine don't convert to JSON Schema) */
export const RegisterRequestSchemaForDocs = RegisterRequestBaseSchema;

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/** Login request schema */
export const LoginRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** Forgot password request schema */
export const ForgotPasswordRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

/** User response schema */
export const UserResponseSchema = z.object({
    id: z.number(),
    supabaseUserId: z.string().nullable(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: UserRoleSchema,
    createdAt: z.string(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/** Auth response schema */
export const AuthResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    user: UserResponseSchema.optional().nullable(),
    token: z.string().optional().nullable(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/** Error response schema */
export const ErrorResponseSchema = z.object({
    success: z.literal(false),
    message: z.string(),
    error: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/** Verify token query schema */
export const VerifyQuerySchema = z.object({
    token: z.string(),
});

export type VerifyQuery = z.infer<typeof VerifyQuerySchema>;
