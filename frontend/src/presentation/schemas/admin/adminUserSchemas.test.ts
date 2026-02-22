import { describe, expect, it } from "vitest"
import {
  adminCreateUserFormSchema,
  adminEditUserFormSchema,
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
})
