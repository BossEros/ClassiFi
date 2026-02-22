import { z } from "zod"
import { VALID_ROLES, type UserRole } from "@/shared/types/auth"
import { emailSchema, strongPasswordSchema } from "@/presentation/schemas/shared/commonSchemas"

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

export type AdminCreateUserFormValues = z.infer<typeof adminCreateUserFormSchema>
export type AdminEditUserFormValues = z.infer<typeof adminEditUserFormSchema>
