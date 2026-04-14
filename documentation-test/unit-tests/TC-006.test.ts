/**
 * TC-006: Class Creation Rejects Empty Class Name
 *
 * Module: Class Management
 * Unit: Create class
 * Date Tested: 4/13/26
 * Description: Verify that class creation rejects an empty class name.
 * Expected Result: A required field error is shown for the class name.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-006 Unit Test Pass - Empty Class Name Rejected
 * Suggested Figure Title (System UI): Class Management UI - Create Class Form Showing Class Name Error
 */

import { describe, expect, it } from "vitest"
import { teacherClassFormSchema } from "../../frontend/src/presentation/schemas/class/classSchemas"

describe("TC-006: Class Creation Rejects Empty Class Name", () => {
  it("should reject class creation when the class name is empty", () => {
    const classParseResult = teacherClassFormSchema.safeParse({
      className: "   ",
      description: "Morning programming class",
      classCode: "ABC12345",
      semester: 1,
      academicYear: "2025-2026",
      schedule: {
        days: ["monday"],
        startTime: "08:00",
        endTime: "10:00",
      },
    })

    expect(classParseResult.success).toBe(false)

    if (!classParseResult.success) {
      expect(classParseResult.error.issues[0]?.message).toBe(
        "Class name is required",
      )
      expect(classParseResult.error.issues[0]?.path).toEqual(["className"])
    }
  })
})
