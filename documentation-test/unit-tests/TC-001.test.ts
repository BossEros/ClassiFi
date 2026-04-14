/**
 * TC-001: Registration Rejects Invalid Email
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/13/26
 * Description:     
 * Expected Result: An invalid email error is shown in the email field.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-001 Unit Test Pass - Registration Invalid Email Rejected
 * Suggested Figure Title (System UI): Authentication UI - Registration Form Showing Invalid Email Error
 */

import { describe, expect, it } from "vitest"
import { registerFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-001: Registration Rejects Invalid Email", () => {
  it("should reject registration when the email format is invalid", () => {
    const registrationParseResult = registerFormSchema.safeParse({
      role: "student",
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "invalid-email",
      password: "Password1!",
      confirmPassword: "Password1!",
    })

    expect(registrationParseResult.success).toBe(false)

    if (!registrationParseResult.success) {
      expect(registrationParseResult.error.issues[0]?.message).toBe(
        "Invalid email format. Please enter a valid email address",
      )
      expect(registrationParseResult.error.issues[0]?.path).toEqual(["email"])
    }
  })
})
