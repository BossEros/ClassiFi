/**
 * TC-008: Registration Rejects Password Confirmation Mismatch
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/11/26
 * Description: Verify that the registration form rejects a confirm-password value that does not match the password field.
 * Expected Result: Registration validation fails with the password-mismatch message on the confirm-password field.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-008 Unit Test Pass - Registration Password Confirmation Mismatch Rejected
 * Suggested Figure Title (System UI): Authentication UI - Registration Form Showing Password Mismatch Validation
 */

import { describe, expect, it } from "vitest"
import { registerFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-008: Registration Rejects Password Confirmation Mismatch", () => {
  it("should reject registration when confirm password does not match the password", () => {
    const registrationParseResult = registerFormSchema.safeParse({
      role: "student",
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "student@classifi.com",
      password: "Password1!",
      confirmPassword: "Password2!",
    })

    expect(registrationParseResult.success).toBe(false)

    if (!registrationParseResult.success) {
      expect(registrationParseResult.error.issues[0]?.message).toBe(
        "Passwords do not match",
      )
      expect(registrationParseResult.error.issues[0]?.path).toEqual([
        "confirmPassword",
      ])
    }
  })
})
