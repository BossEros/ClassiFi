/**
 * TC-007: Registration Rejects Weak Password
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/11/26
 * Description: Verify that the registration form rejects a password that does not meet the required strength rules.
 * Expected Result: Registration validation fails with the explicit password-strength message.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-007 Unit Test Pass - Registration Weak Password Rejected
 * Suggested Figure Title (System UI): Authentication UI - Registration Form Showing Password Strength Validation
 */

import { describe, expect, it } from "vitest"
import { registerFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-007: Registration Rejects Weak Password", () => {
  it("should reject registration when the password does not contain an uppercase letter", () => {
    const registrationParseResult = registerFormSchema.safeParse({
      role: "student",
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "student@classifi.com",
      password: "password1!",
      confirmPassword: "password1!",
    })

    expect(registrationParseResult.success).toBe(false)

    if (!registrationParseResult.success) {
      expect(registrationParseResult.error.issues[0]?.message).toBe(
        "Password must contain at least one uppercase letter",
      )
      expect(registrationParseResult.error.issues[0]?.path).toEqual([
        "password",
      ])
    }
  })
})
