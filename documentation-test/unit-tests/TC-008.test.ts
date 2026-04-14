/**
 * TC-008: Class Creation Rejects Non-Positive Schedule Duration
 *
 * Module: Class Management
 * Unit: Create class
 * Date Tested: 4/14/26
 * Description: Verify that class creation rejects a schedule where the end time is not after the start time.
 * Expected Result: A schedule time-order error is shown for the class time.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-008 Unit Test Pass - Non-Positive Schedule Duration Rejected
 * Suggested Figure Title (System UI): Class Management UI - Create Class Form Showing Schedule Time Order Error
 */

import { describe, expect, it } from "vitest"
import { teacherClassFormSchema } from "../../frontend/src/presentation/schemas/class/classSchemas"

describe("TC-008: Class Creation Rejects Non-Positive Schedule Duration", () => {
  it("should reject class creation when the end time matches the start time", () => {
    const classParseResult = teacherClassFormSchema.safeParse({
      className: "Introduction to Programming",
      description: "Morning programming class",
      classCode: "ABC12345",
      semester: 1,
      academicYear: "2025-2026",
      schedule: {
        days: ["monday"],
        startTime: "10:00",
        endTime: "10:00",
      },
    })

    expect(classParseResult.success).toBe(false)

    if (!classParseResult.success) {
      expect(classParseResult.error.issues[0]?.message).toBe(
        "End time must be after start time",
      )
      expect(classParseResult.error.issues[0]?.path).toEqual([
        "schedule",
        "endTime",
      ])
    }
  })
})
