import { z } from 'zod';
/** User role enum */
export declare const UserRoleSchema: z.ZodEnum<{
    student: "student";
    teacher: "teacher";
    admin: "admin";
}>;
export type UserRole = z.infer<typeof UserRoleSchema>;
/** Register request schema with password confirmation validation */
export declare const RegisterRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    username: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<{
        student: "student";
        teacher: "teacher";
    }>;
}, z.core.$strip>;
/** For Swagger documentation (schemas with refine don't convert to JSON Schema) */
export declare const RegisterRequestSchemaForDocs: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    username: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<{
        student: "student";
        teacher: "teacher";
    }>;
}, z.core.$strip>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
/** Login request schema */
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
/** Forgot password request schema */
export declare const ForgotPasswordRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
/** User response schema */
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    supabaseUserId: z.ZodNullable<z.ZodString>;
    username: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<{
        student: "student";
        teacher: "teacher";
        admin: "admin";
    }>;
    createdAt: z.ZodString;
}, z.core.$strip>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
/** Auth response schema */
export declare const AuthResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    user: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        id: z.ZodNumber;
        supabaseUserId: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        email: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        role: z.ZodEnum<{
            student: "student";
            teacher: "teacher";
            admin: "admin";
        }>;
        createdAt: z.ZodString;
    }, z.core.$strip>>>;
    token: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
/** Error response schema */
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
/** Verify token query schema */
export declare const VerifyQuerySchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
export type VerifyQuery = z.infer<typeof VerifyQuerySchema>;
//# sourceMappingURL=auth.schema.d.ts.map