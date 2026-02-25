import { describe, expect, it } from "vitest"
import {
  changePasswordFormSchema,
  deleteAccountFormSchema,
  forgotPasswordFormSchema,
  loginFormSchema,
  registerFormSchema,
  resetPasswordFormSchema,
} from "@/presentation/schemas/auth/authSchemas"

describe("authSchemas", () => {
  it("accepts valid login values", () => {
    const parseResult = loginFormSchema.safeParse({
      email: "teacher@classifi.com",
      password: "Password1!",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects login payload without email", () => {
    const parseResult = loginFormSchema.safeParse({
      password: "Password1!",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.path).toEqual(["email"])
    }
  })

  it("rejects incorrect login shape that provides password fields only", () => {
    const parseResult = loginFormSchema.safeParse({
      password: "Password1!",
      confirmPassword: "Password1!",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      const issuePaths = parseResult.error.issues.map((issue) => issue.path[0])
      expect(issuePaths).toContain("email")
    }
  })

  it("rejects empty login password with existing message", () => {
    const parseResult = loginFormSchema.safeParse({
      email: "teacher@classifi.com",
      password: "   ",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe("Password cannot be empty")
    }
  })

  it("rejects invalid email for forgot password", () => {
    const parseResult = forgotPasswordFormSchema.safeParse({
      email: "invalid-email",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "Please enter a valid email address",
      )
    }
  })

  it("rejects reset password mismatch", () => {
    const parseResult = resetPasswordFormSchema.safeParse({
      newPassword: "Password1!",
      confirmPassword: "Password2!",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe("Passwords do not match")
      expect(parseResult.error.issues[0]?.path).toEqual(["confirmPassword"])
    }
  })

  it("accepts valid change password values", () => {
    const parseResult = changePasswordFormSchema.safeParse({
      currentPassword: "OldPassword1!",
      newPassword: "NewPassword1!",
      confirmPassword: "NewPassword1!",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects change password mismatch", () => {
    const parseResult = changePasswordFormSchema.safeParse({
      currentPassword: "OldPassword1!",
      newPassword: "NewPassword1!",
      confirmPassword: "AnotherPassword1!",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe("Passwords do not match")
      expect(parseResult.error.issues[0]?.path).toEqual(["confirmPassword"])
    }
  })

  it("accepts valid registration values", () => {
    const parseResult = registerFormSchema.safeParse({
      role: "student",
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "student@classifi.com",
      password: "Password1!",
      confirmPassword: "Password1!",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects missing registration role with existing message", () => {
    const parseResult = registerFormSchema.safeParse({
      role: "",
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "student@classifi.com",
      password: "Password1!",
      confirmPassword: "Password1!",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe("Please select a role")
    }
  })

  it("accepts valid delete account confirmation payload", () => {
    const parseResult = deleteAccountFormSchema.safeParse({
      password: "Password1!",
      confirmation: "DELETE",
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects invalid delete account confirmation text", () => {
    const parseResult = deleteAccountFormSchema.safeParse({
      password: "Password1!",
      confirmation: "DEL",
    })

    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error.issues[0]?.message).toBe(
        "Please type DELETE to confirm account deletion",
      )
    }
  })
})
