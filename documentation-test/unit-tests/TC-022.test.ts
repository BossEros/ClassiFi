/**
 * TC-022: Change Password Rejects Empty Current Password
 *
 * Module: User Management
 * Unit: Change password
 * Date Tested: 4/13/26
 * Description: Verify that change password rejects an empty current password.
 * Expected Result: A required field error is shown for the current password.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-022 Unit Test Pass - Empty Current Password Rejected
 * Suggested Figure Title (System UI): User Settings UI - Change Password Form Showing Current Password Error
 */

import { describe, expect, it } from "vitest"
import { changePasswordFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-022: Change Password Rejects Empty Current Password", () => {
  it("should reject password change when the current password is empty", () => {
    const passwordParseResult = changePasswordFormSchema.safeParse({
      currentPassword: "",
      newPassword: "NewPass1!",
      confirmPassword: "NewPass1!",
    })

    expect(passwordParseResult.success).toBe(false)

    if (!passwordParseResult.success) {
      expect(passwordParseResult.error.issues[0]?.message).toBe(
        "Password is required",
      )
      expect(passwordParseResult.error.issues[0]?.path).toEqual([
        "currentPassword",
      ])
    }
  })
})
