/**
 * TC-006: Registration Rejects Invalid Email Format
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/11/26
 * Description: Verify that the registration form rejects an email address with an invalid format.
 * Expected Result: Registration validation fails with the explicit invalid email message.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-006 Unit Test Pass - Registration Invalid Email Format Rejected
 * Suggested Figure Title (System UI): Authentication UI - Registration Form Showing Invalid Email Validation
 */

import { describe, expect, it } from "vitest"
import { registerFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-006: Registration Rejects Invalid Email Format", () => {
  it("should reject registration when the email address format is invalid", () => {
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
