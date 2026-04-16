/**
 * TC-017: Join Class Rejects Invalid Code Length
 *
 * Module: Student Dashboard
 * Unit: Join class
 * Date Tested: 4/13/26
 * Description: Verify that join class rejects an invalid class code length.
 * Expected Result: A class code length error is shown.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-017 Unit Test Pass - Invalid Class Code Length Rejected
 * Suggested Figure Title (System UI): Student Dashboard UI - Join Class Form Showing Code Length Error
 */

import { describe, expect, it } from "vitest"
import { joinClassFormSchema } from "../../frontend/src/presentation/schemas/class/classSchemas"

describe("TC-017: Join Class Rejects Invalid Code Length", () => {
  it("should reject join class when the class code is too short", () => {
    const joinClassParseResult = joinClassFormSchema.safeParse({
      classCode: "ABC",
    })

    expect(joinClassParseResult.success).toBe(false)

    if (!joinClassParseResult.success) {
      expect(joinClassParseResult.error.issues[0]?.message).toBe(
        "Class code must be 6-8 characters",
      )
      expect(joinClassParseResult.error.issues[0]?.path).toEqual([
        "classCode",
      ])
    }
  })
})
