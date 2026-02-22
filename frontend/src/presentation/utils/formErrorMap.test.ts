import { describe, expect, it } from "vitest"
import { z } from "zod"
import type { FieldErrors } from "react-hook-form"
import type { ZodIssue } from "zod"
import {
  getFieldErrorMessage,
  mapZodIssuesToFieldErrors,
} from "@/presentation/utils/formErrorMap"

describe("formErrorMap", () => {
  describe("mapZodIssuesToFieldErrors", () => {
    it("maps zod issues into field error records", () => {
      const schema = z
        .object({
          email: z.string().email("Please enter a valid email address"),
          profile: z.object({
            firstName: z.string().min(2, "First name must be at least 2 chars"),
          }),
          password: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        })

      const parseResult = schema.safeParse({
        email: "invalid",
        profile: { firstName: "" },
        password: "Password1!",
        confirmPassword: "Mismatch1!",
      })

      expect(parseResult.success).toBe(false)

      if (!parseResult.success) {
        const mappedErrors = mapZodIssuesToFieldErrors(parseResult.error.issues)

        expect(mappedErrors).toEqual({
          email: "Please enter a valid email address",
          "profile.firstName": "First name must be at least 2 chars",
          confirmPassword: "Passwords do not match",
        })
      }
    })

    it("keeps only the first message per field", () => {
      const issues: ZodIssue[] = [
        {
          code: "custom",
          path: ["password"],
          message: "Password is required",
        },
        {
          code: "custom",
          path: ["password"],
          message: "Password must contain uppercase",
        },
      ]

      const mappedErrors = mapZodIssuesToFieldErrors(issues)

      expect(mappedErrors.password).toBe("Password is required")
    })

    it("maps empty path issues to general key", () => {
      const issues: ZodIssue[] = [
        {
          code: "custom",
          path: [],
          message: "General validation error",
        },
      ]

      const mappedErrors = mapZodIssuesToFieldErrors(issues)

      expect(mappedErrors.general).toBe("General validation error")
    })
  })

  describe("getFieldErrorMessage", () => {
    it("returns error for top-level field", () => {
      const errors = {
        email: {
          type: "manual",
          message: "Please enter a valid email address",
        },
      } as FieldErrors<{ email: string }>

      expect(getFieldErrorMessage(errors, "email")).toBe(
        "Please enter a valid email address",
      )
    })

    it("returns error for nested field", () => {
      const errors = {
        profile: {
          firstName: {
            type: "manual",
            message: "First name is required",
          },
        },
      } as FieldErrors<{ profile: { firstName: string } }>

      expect(getFieldErrorMessage(errors, "profile.firstName")).toBe(
        "First name is required",
      )
    })

    it("returns undefined for missing path", () => {
      const errors = {
        email: {
          type: "manual",
          message: "Please enter a valid email address",
        },
      } as FieldErrors<{ email: string }>

      expect(getFieldErrorMessage(errors, "password")).toBeUndefined()
      expect(getFieldErrorMessage(errors, "profile.firstName")).toBeUndefined()
    })
  })
})
