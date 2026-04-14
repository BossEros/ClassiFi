/**
 * TC-015: Login Rejects Invalid Email
 *
 * Module: Authentication
 * Unit: Login user
 * Date Tested: 4/13/26
 * Description: Verify that login rejects an invalid email.
 * Expected Result: An invalid email error is shown in the email field.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-015 Unit Test Pass - Login Invalid Email Rejected
 * Suggested Figure Title (System UI): Authentication UI - Login Form Showing Invalid Email Error
 */

import { describe, expect, it } from "vitest"
import { loginFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-015: Login Rejects Invalid Email", () => {
  it("should reject login when the email format is invalid", () => {
    const loginParseResult = loginFormSchema.safeParse({
      email: "invalid-email",
      password: "Password1!",
    })

    expect(loginParseResult.success).toBe(false)

    if (!loginParseResult.success) {
      expect(loginParseResult.error.issues[0]?.message).toBe(
        "Invalid email format. Please enter a valid email address",
      )
      expect(loginParseResult.error.issues[0]?.path).toEqual(["email"])
    }
  })
})
