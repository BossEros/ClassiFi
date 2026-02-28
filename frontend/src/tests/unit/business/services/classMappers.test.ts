import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  isValidClass,
  mapToClassArray,
} from "@/business/services/calendar/classMappers"
import type { Class } from "@/business/models/dashboard/types"

describe("classMappers", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})

  const validClass: Class = {
    id: 1,
    teacherId: 2,
    className: "Programming 101",
    classCode: "PROG101",
    description: "Intro class",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z" as Class["createdAt"],
    yearLevel: 1,
    semester: 1,
    academicYear: "2025-2026",
    schedule: {
      days: ["monday"],
      startTime: "08:00",
      endTime: "10:00",
    },
  }

  beforeEach(() => {
    warnSpy.mockClear()
    logSpy.mockClear()
  })

  it("returns false for null and warns", () => {
    const result = isValidClass(null)

    expect(result).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it("returns false for non-object values and warns", () => {
    const result = isValidClass("invalid")

    expect(result).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it("returns true for a valid class payload", () => {
    const result = isValidClass(validClass)

    expect(result).toBe(true)
    expect(logSpy).not.toHaveBeenCalled()
  })

  it("returns false and logs details when payload is missing required fields", () => {
    const invalidPayload = {
      ...validClass,
      className: 123,
      schedule: null,
    }

    const result = isValidClass(invalidPayload)

    expect(result).toBe(false)
    expect(logSpy).toHaveBeenCalled()
  })

  it("filters unknown array values to valid class records", () => {
    const result = mapToClassArray([validClass, null, { id: 5 }, "bad"])

    expect(result).toEqual([validClass])
  })
})
