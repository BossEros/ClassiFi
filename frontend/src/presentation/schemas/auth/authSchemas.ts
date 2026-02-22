import { z } from "zod"
import { VALID_ROLES, type UserRole } from "@/shared/types/auth"
import {
  emailSchema,
  requiredPasswordSchema,
  strongPasswordSchema,
} from "@/presentation/schemas/shared/commonSchemas"

function isValidUserRole(roleValue: string): roleValue is UserRole {
  return (VALID_ROLES as readonly string[]).includes(roleValue)
}

const roleSchema = z
  .string()
  .min(1, "Please select a role")
  .refine((roleValue) => isValidUserRole(roleValue), {
    message: "Invalid role selected",
  })

const firstNameSchema = z
  .string()
  .min(1, "First name is required")
  .min(2, "First name must be at least 2 characters long")
  .max(50, "First name must not exceed 50 characters")

const lastNameSchema = z
  .string()
  .min(1, "Last name is required")
  .min(2, "Last name must be at least 2 characters long")
  .max(50, "Last name must not exceed 50 characters")

/**
 * Login form schema.
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: requiredPasswordSchema,
})

/**
 * Forgot password form schema.
 */
export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
})

/**
 * Reset password form schema.
 */
export const resetPasswordFormSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  )

/**
 * Full registration form schema.
 */
export const registerFormSchema = z
  .object({
    role: roleSchema,
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

/**
 * Change password form schema.
 */
export const changePasswordFormSchema = z
  .object({
    currentPassword: requiredPasswordSchema,
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  )

export type LoginFormValues = z.infer<typeof loginFormSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>
