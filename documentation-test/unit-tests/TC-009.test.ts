/**
 * TC-009: Forgot Password Rejects Invalid Email Format
 *
 * Module: Authentication
 * Unit: Password Reset
 * Date Tested: 4/11/26
 * Description: Verify that the forgot-password form rejects an email address with an invalid format.
 * Expected Result: Forgot-password validation fails with the explicit invalid email message.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-009 Unit Test Pass - Forgot Password Invalid Email Format Rejected
 * Suggested Figure Title (System UI): Authentication UI - Forgot Password Form Showing Invalid Email Validation
 */

import { describe, expect, it } from "vitest"
import { forgotPasswordFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-009: Forgot Password Rejects Invalid Email Format", () => {
  it("should reject forgot password submission when the email address format is invalid", () => {
    const forgotPasswordParseResult = forgotPasswordFormSchema.safeParse({
      email: "invalid-email",
    })

    expect(forgotPasswordParseResult.success).toBe(false)

    if (!forgotPasswordParseResult.success) {
      expect(forgotPasswordParseResult.error.issues[0]?.message).toBe(
        "Invalid email format. Please enter a valid email address",
      )
      expect(forgotPasswordParseResult.error.issues[0]?.path).toEqual([
        "email",
      ])
    }
  })
})
