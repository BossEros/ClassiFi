import { z } from 'zod';
/** User role enum */
export declare const UserRoleSchema: z.ZodEnum<["student", "teacher", "admin"]>;
export type UserRole = z.infer<typeof UserRoleSchema>;
/** Register request schema with password confirmation validation */
export declare const RegisterRequestSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    username: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<["student", "teacher"]>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher";
    password: string;
    confirmPassword: string;
}, {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher";
    password: string;
    confirmPassword: string;
}>, {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher";
    password: string;
    confirmPassword: string;
}, {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher";
    password: string;
    confirmPassword: string;
}>;
/** For Swagger documentation (schemas with refine don't convert to JSON Schema) */
export declare const RegisterRequestSchemaForDocs: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    username: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<["student", "teacher"]>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher";
    password: string;
    confirmPassword: string;
}, {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher";
    password: string;
    confirmPassword: string;
}>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
/** Login request schema */
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
/** Forgot password request schema */
export declare const ForgotPasswordRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
/** User response schema */
export declare const UserResponseSchema: z.ZodObject<{
    id: z.ZodNumber;
    supabaseUserId: z.ZodNullable<z.ZodString>;
    username: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<["student", "teacher", "admin"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    supabaseUserId: string | null;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher" | "admin";
    createdAt: string;
}, {
    id: number;
    supabaseUserId: string | null;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "teacher" | "admin";
    createdAt: string;
}>;
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
        role: z.ZodEnum<["student", "teacher", "admin"]>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        supabaseUserId: string | null;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "student" | "teacher" | "admin";
        createdAt: string;
    }, {
        id: number;
        supabaseUserId: string | null;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "student" | "teacher" | "admin";
        createdAt: string;
    }>>>;
    token: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    user?: {
        id: number;
        supabaseUserId: string | null;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "student" | "teacher" | "admin";
        createdAt: string;
    } | null | undefined;
    token?: string | null | undefined;
}, {
    message: string;
    success: boolean;
    user?: {
        id: number;
        supabaseUserId: string | null;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        role: "student" | "teacher" | "admin";
        createdAt: string;
    } | null | undefined;
    token?: string | null | undefined;
}>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
/** Error response schema */
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: false;
    error?: string | undefined;
}, {
    message: string;
    success: false;
    error?: string | undefined;
}>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
/** Verify token query schema */
export declare const VerifyQuerySchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export type VerifyQuery = z.infer<typeof VerifyQuerySchema>;
//# sourceMappingURL=auth.schema.d.ts.map