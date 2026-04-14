/**
 * TC-005: Forgot Password Rejects Invalid Email
 *
 * Module: Authentication
 * Unit: Password reset
 * Date Tested: 4/13/26
 * Description: Verify that forgot password rejects an invalid email.
 * Expected Result: An invalid email error is shown in the email field.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-005 Unit Test Pass - Forgot Password Invalid Email Rejected
 * Suggested Figure Title (System UI): Authentication UI - Forgot Password Form Showing Invalid Email Error
 */

import { describe, expect, it } from "vitest"
import { forgotPasswordFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-005: Forgot Password Rejects Invalid Email", () => {
  it("should reject forgot password when the email format is invalid", () => {
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
