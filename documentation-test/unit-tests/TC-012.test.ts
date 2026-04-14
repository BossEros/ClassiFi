/**
 * TC-012: Change Password Rejects Weak Password
 *
 * Module: User Management
 * Unit: Change password
 * Date Tested: 4/13/26
 * Description: Verify that change password rejects a weak password.
 * Expected Result: A password requirement error is shown for the new password.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-012 Unit Test Pass - Weak New Password Rejected
 * Suggested Figure Title (System UI): User Settings UI - Change Password Form Showing Password Rule Error
 */

import { describe, expect, it } from "vitest"
import { changePasswordFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-012: Change Password Rejects Weak Password", () => {
  it("should reject password change when the new password has no uppercase letter", () => {
    const passwordParseResult = changePasswordFormSchema.safeParse({
      currentPassword: "CurrentPass1!",
      newPassword: "newpass1!",
      confirmPassword: "newpass1!",
    })

    expect(passwordParseResult.success).toBe(false)

    if (!passwordParseResult.success) {
      expect(passwordParseResult.error.issues[0]?.message).toBe(
        "Password must contain at least one uppercase letter",
      )
      expect(passwordParseResult.error.issues[0]?.path).toEqual([
        "newPassword",
      ])
    }
  })
})
