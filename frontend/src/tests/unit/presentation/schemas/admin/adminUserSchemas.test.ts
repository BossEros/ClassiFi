import { describe, expect, it } from "vitest"
import {
  adminActivateUserFormSchema,
  adminCreateUserFormSchema,
  adminDeactivateUserFormSchema,
  adminEditUserFormSchema,
  createAdminStatusConfirmationFormSchema,
} from "@/presentation/schemas/admin/adminUserSchemas"

describe("adminUserSchemas", () => {
  it("accepts valid create user values", () => {
    const parseResult = adminCreateUserFormSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "Password1!",
      role: "teacher",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects create user payload with weak password", () => {
    const parseResult = adminCreateUserFormSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "weak",
      role: "teacher",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "Password must be at least 8 characters long",
      )
    }
  })

  it("rejects invalid role in edit schema", () => {
    const parseResult = adminEditUserFormSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      role: "owner",
      isActive: true,
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe("Invalid role selected")
    }
  })

  it("accepts valid deactivate-user confirmation", () => {
    const parseResult = adminDeactivateUserFormSchema.safeParse({
      confirmation: "DEACTIVATE",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects invalid deactivate-user confirmation", () => {
    const parseResult = adminDeactivateUserFormSchema.safeParse({
      confirmation: "remove",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "Please type DEACTIVATE to confirm",
      )
    }
  })

  it("accepts valid activate-user confirmation", () => {
    const parseResult = adminActivateUserFormSchema.safeParse({
      confirmation: "ACTIVATE",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects deactivate keyword when activation is required", () => {
    const activationConfirmationSchema =
      createAdminStatusConfirmationFormSchema("ACTIVATE")
    const parseResult = activationConfirmationSchema.safeParse({
      confirmation: "DEACTIVATE",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "Please type ACTIVATE to confirm",
      )
    }
  })
})
