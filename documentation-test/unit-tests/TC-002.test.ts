/**
 * TC-002: Registration Rejects Weak Password
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/13/26
 * Description: Verify that registration rejects a weak password.
 * Expected Result: A password requirement error is shown in the password field.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-002 Unit Test Pass - Registration Weak Password Rejected
 * Suggested Figure Title (System UI): Authentication UI - Registration Form Showing Password Rule Error
 */

import { describe, expect, it } from "vitest"
import { registerFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-002: Registration Rejects Weak Password", () => {
  it("should reject registration when the password has no uppercase letter", () => {
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
