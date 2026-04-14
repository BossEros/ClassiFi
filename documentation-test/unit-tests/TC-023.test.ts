/**
 * TC-023: Delete Account Rejects Whitespace Password
 *
 * Module: User Management
 * Unit: Delete account
 * Date Tested: 4/14/26
 * Description: Verify that delete account rejects a whitespace-only password even when confirmation is correct.
 * Expected Result: A password validation error is shown.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-023 Unit Test Pass - Whitespace Password Rejected
 * Suggested Figure Title (System UI): User Settings UI - Delete Account Form Showing Password Error
 */

import { describe, expect, it } from "vitest"
import { deleteAccountFormSchema } from "../../frontend/src/presentation/schemas/auth/authSchemas"

describe("TC-023: Delete Account Rejects Whitespace Password", () => {
  it("should reject account deletion when the password contains only whitespace", () => {
    const deleteAccountParseResult = deleteAccountFormSchema.safeParse({
      password: "   ",
      confirmation: "DELETE",
    })

    expect(deleteAccountParseResult.success).toBe(false)

    if (!deleteAccountParseResult.success) {
      expect(deleteAccountParseResult.error.issues[0]?.message).toBe(
        "Password cannot be empty",
      )
      expect(deleteAccountParseResult.error.issues[0]?.path).toEqual([
        "password",
      ])
    }
  })
})
