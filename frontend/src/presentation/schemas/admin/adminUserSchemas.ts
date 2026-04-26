import { z } from "zod"
import { VALID_ROLES, type UserRole } from "@/data/api/auth.types"
import {
  emailSchema,
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

const firstNameSchema = z.string().min(1, "First name is required")
const lastNameSchema = z.string().min(1, "Last name is required")

export const adminCreateUserFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  password: strongPasswordSchema,
  role: roleSchema,
})

export const adminEditUserFormSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  role: roleSchema,
  isActive: z.boolean(),
})

/**
 * Creates a confirmation schema for admin-triggered account status changes.
 *
 * @param confirmationKeyword - The exact keyword the admin must type to confirm the action.
 * @returns A Zod schema that validates the confirmation input.
 */
export function createAdminStatusConfirmationFormSchema(
  confirmationKeyword: "ACTIVATE" | "DEACTIVATE",
) {
  return z.object({
    confirmation: z.string().regex(new RegExp(`^${confirmationKeyword}$`), {
      message: `Please type ${confirmationKeyword} to confirm`,
    }),
  })
}

export const adminDeactivateUserFormSchema =
  createAdminStatusConfirmationFormSchema("DEACTIVATE")
export const adminActivateUserFormSchema =
  createAdminStatusConfirmationFormSchema("ACTIVATE")

export const adminDeleteUserFormSchema = adminDeactivateUserFormSchema

export type AdminCreateUserFormValues = z.infer<
  typeof adminCreateUserFormSchema
>
export type AdminEditUserFormValues = z.infer<typeof adminEditUserFormSchema>
export type AdminDeactivateUserFormValues = z.infer<
  typeof adminDeactivateUserFormSchema
>
export type AdminDeleteUserFormValues = AdminDeactivateUserFormValues

