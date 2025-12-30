import { z } from 'zod';
/** User role enum */
export const UserRoleSchema = z.enum(['student', 'teacher', 'admin']);
/** Register request base schema (for Swagger docs) */
const RegisterRequestBaseSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be at most 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    role: z.enum(['student', 'teacher']),
});
/** Register request schema with password confirmation validation */
export const RegisterRequestSchema = RegisterRequestBaseSchema.refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
/** For Swagger documentation (schemas with refine don't convert to JSON Schema) */
export const RegisterRequestSchemaForDocs = RegisterRequestBaseSchema;
/** Login request schema */
export const LoginRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});
/** Forgot password request schema */
export const ForgotPasswordRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
});
/** User response schema */
export const UserResponseSchema = z.object({
    id: z.number(),
    supabaseUserId: z.string().nullable(),
    username: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: UserRoleSchema,
    createdAt: z.string(),
});
/** Auth response schema */
export const AuthResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    user: UserResponseSchema.optional().nullable(),
    token: z.string().optional().nullable(),
});
/** Error response schema */
export const ErrorResponseSchema = z.object({
    success: z.literal(false),
    message: z.string(),
    error: z.string().optional(),
});
//# sourceMappingURL=auth.schema.js.map