/**
 * TC-003: Registration Rejects Confirm Password Mismatch
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/13/26
 * Description: Verify that registration rejects a mismatched confirm password.
 * Expected Result: A confirm password mismatch error is shown.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-003 Unit Test Pass - Registration Confirm Password Mismatch Rejected
 * Suggested Figure Title (System UI): Authentication UI - Registration Form Showing Confirm Password Error
 */

import { describe, expect, it } from "vitest"
import { registerFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-003: Registration Rejects Confirm Password Mismatch", () => {
  it("should reject registration when confirm password does not match", () => {
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
