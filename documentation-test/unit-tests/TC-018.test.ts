/**
 * TC-018: Class Creation Rejects Invalid Time Order
 *
 * Module: Class Management
 * Unit: Create class
 * Date Tested: 4/13/26
 * Description: Verify that class creation rejects an invalid time order.
 * Expected Result: A time order error is shown for the class schedule.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-018 Unit Test Pass - Invalid Class Time Order Rejected
 * Suggested Figure Title (System UI): Class Management UI - Create Class Form Showing Time Order Error
 */

import { describe, expect, it } from "vitest"
import { teacherClassFormSchema } from "../../frontend/src/presentation/schemas/class/classSchemas"

describe("TC-018: Class Creation Rejects Invalid Time Order", () => {
  it("should reject class creation when the end time is earlier than the start time", () => {
    const classParseResult = teacherClassFormSchema.safeParse({
      className: "Introduction to Programming",
      description: "Morning programming class",
      classCode: "ABC12345",
      semester: 1,
      academicYear: "2025-2026",
      schedule: {
        days: ["monday"],
        startTime: "10:00",
        endTime: "08:00",
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
