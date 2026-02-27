import { describe, expect, it } from "vitest"
import {
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
} from "../../src/modules/auth/auth.schema.js"

describe("Auth Schemas", () => {
  describe("LoginRequestSchema", () => {
    it("accepts email + password payload", () => {
      const parseResult = LoginRequestSchema.safeParse({
        email: "teacher@classifi.com",
        password: "Password1!",
      })

      expect(parseResult.success).toBe(true)
    })

    it("rejects payload missing email", () => {
      const parseResult = LoginRequestSchema.safeParse({
        password: "Password1!",
      })

      expect(parseResult.success).toBe(false)

      if (!parseResult.success) {
        expect(parseResult.error.issues[0]?.path).toEqual(["email"])
      }
    })

    it("rejects payload that only sends password fields", () => {
      const parseResult = LoginRequestSchema.safeParse({
        password: "Password1!",
        confirmPassword: "Password1!",
      })

      expect(parseResult.success).toBe(false)

      if (!parseResult.success) {
        const issuePaths = parseResult.error.issues.map((issue) => issue.path[0])
        expect(issuePaths).toContain("email")
      }
    })
  })

  describe("RegisterRequestSchema", () => {
    it("rejects mismatched confirmPassword", () => {
      const parseResult = RegisterRequestSchema.safeParse({
        email: "student@classifi.com",
        password: "Password1!",
        confirmPassword: "Password2!",
        firstName: "Student",
        lastName: "User",
        role: "student",
      })

      expect(parseResult.success).toBe(false)

      if (!parseResult.success) {
        expect(parseResult.error.issues[0]?.path).toEqual(["confirmPassword"])
      }
    })
  })

  describe("ForgotPasswordRequestSchema", () => {
    it("rejects invalid email format", () => {
      const parseResult = ForgotPasswordRequestSchema.safeParse({
        email: "not-an-email",
      })

      expect(parseResult.success).toBe(false)
    })
  })
})
