/**
 * TC-013: Change Password Rejects Confirm Password Mismatch
 *
 * Module: User Management
 * Unit: Change password
 * Date Tested: 4/13/26
 * Description: Verify that change password rejects a mismatched confirm password.
 * Expected Result: A confirm password mismatch error is shown.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-013 Unit Test Pass - Confirm Password Mismatch Rejected
 * Suggested Figure Title (System UI): User Settings UI - Change Password Form Showing Confirm Password Error
 */

import { describe, expect, it } from "vitest"
import { changePasswordFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-013: Change Password Rejects Confirm Password Mismatch", () => {
  it("should reject password change when confirm password does not match", () => {
    const passwordParseResult = changePasswordFormSchema.safeParse({
      currentPassword: "CurrentPass1!",
      newPassword: "NewPass1!",
      confirmPassword: "OtherPass1!",
    })

    expect(passwordParseResult.success).toBe(false)

    if (!passwordParseResult.success) {
      expect(passwordParseResult.error.issues[0]?.message).toBe(
        "Passwords do not match",
      )
      expect(passwordParseResult.error.issues[0]?.path).toEqual([
        "confirmPassword",
      ])
    }
  })
})
