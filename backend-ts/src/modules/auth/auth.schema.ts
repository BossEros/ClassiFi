import { z } from "zod"

/** User role enum */
export const UserRoleSchema = z.enum(["student", "teacher", "admin"])
export type UserRole = z.infer<typeof UserRoleSchema>

/** Register request schema */
export const RegisterRequestSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    role: z.enum(["student", "teacher"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

/** Login request schema */
export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

/** Forgot password request schema */
export const ForgotPasswordRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
})
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>

/** User response schema */
export const UserResponseSchema = z.object({
  id: z.number(),
  supabaseUserId: z.string().nullable(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: UserRoleSchema,
  createdAt: z.string(),
})

/** Auth response schema */
export const AuthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: UserResponseSchema.optional().nullable(),
  token: z.string().optional().nullable(),
})

/** Error response schema */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string().optional(),
})

/** Verify token query schema */
export const VerifyRequestSchema = z.object({
  token: z.string(),
})
export type VerifyRequest = z.infer<typeof VerifyRequestSchema>

/** Verify token query schema (keeping for backward compatibility if needed) */
export const VerifyQuerySchema = z.object({
  token: z.string(),
})
