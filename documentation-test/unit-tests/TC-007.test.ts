/**
 * TC-007: Class Creation Rejects Missing Schedule Day
 *
 * Module: Class Management
 * Unit: Create class
 * Date Tested: 4/13/26
 * Description: Verify that class creation rejects a missing schedule day.
 * Expected Result: A required field error is shown for the schedule day.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-007 Unit Test Pass - Missing Schedule Day Rejected
 * Suggested Figure Title (System UI): Class Management UI - Create Class Form Showing Schedule Day Error
 */

import { describe, expect, it } from "vitest"
import { teacherClassFormSchema } from "../../frontend/src/presentation/schemas/class/classSchemas"

describe("TC-007: Class Creation Rejects Missing Schedule Day", () => {
  it("should reject class creation when no schedule day is selected", () => {
    const classParseResult = teacherClassFormSchema.safeParse({
      className: "Introduction to Programming",
      description: "Morning programming class",
      classCode: "ABC12345",
      semester: 1,
      academicYear: "2025-2026",
      schedule: {
        days: [],
        startTime: "08:00",
        endTime: "10:00",
      },
    })

    expect(classParseResult.success).toBe(false)

    if (!classParseResult.success) {
      expect(classParseResult.error.issues[0]?.message).toBe(
        "At least one schedule day is required",
      )
      expect(classParseResult.error.issues[0]?.path).toEqual([
        "schedule",
        "days",
      ])
    }
  })
})
