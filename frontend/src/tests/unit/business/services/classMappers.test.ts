import { describe, expect, it } from "vitest"
import {
  isValidClass,
  mapToClassArray,
} from "@/business/services/calendarService"
import type { Class } from "@/data/api/class.types"

describe("classMappers", () => {
  const validClass: Class = {
    id: 1,
    teacherId: 2,
    className: "Programming 101",
    classCode: "PROG101",
    description: "Intro class",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z" as Class["createdAt"],

    semester: 1,
    academicYear: "2025-2026",
    schedule: {
      days: ["monday"],
      startTime: "08:00",
      endTime: "10:00",
    },
  }

  it("returns false for null", () => {
    expect(isValidClass(null)).toBe(false)
  })

  it("returns false for non-object values", () => {
    expect(isValidClass("invalid")).toBe(false)
  })

  it("returns true for a valid class payload", () => {
    expect(isValidClass(validClass)).toBe(true)
  })

  it("returns false when payload is missing required fields", () => {
    const invalidPayload = {
      ...validClass,
      className: 123,
      schedule: null,
    }

    expect(isValidClass(invalidPayload)).toBe(false)
  })

  it("filters unknown array values to valid class records", () => {
    const result = mapToClassArray([validClass, null, { id: 5 }, "bad"])

    expect(result).toEqual([validClass])
  })
})
