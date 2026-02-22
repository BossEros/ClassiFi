import { z } from "zod"

const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*(),.?":{}|<>]/,
} as const

/**
 * Shared email schema used by frontend form validation.
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")

/**
 * Basic password schema for flows that only require non-empty values.
 */
export const requiredPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .refine((passwordValue) => passwordValue.trim().length > 0, {
    message: "Password cannot be empty",
  })

/**
 * Strong password schema aligned with registration requirements.
 */
export const strongPasswordSchema = requiredPasswordSchema
  .min(8, "Password must be at least 8 characters long")
  .regex(PASSWORD_PATTERNS.uppercase, {
    message: "Password must contain at least one uppercase letter",
  })
  .regex(PASSWORD_PATTERNS.lowercase, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(PASSWORD_PATTERNS.number, {
    message: "Password must contain at least one number",
  })
  .regex(PASSWORD_PATTERNS.specialChar, {
    message:
      'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
  })
