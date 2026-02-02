/**
 * Tests for schedule formatting utilities
 */

import { describe, it, expect } from "vitest"
import { formatSchedule } from "./scheduleUtils"
import type { Schedule } from "@/shared/types/class"

describe("formatSchedule", () => {
  // ============================================================================
  // Valid Schedule Formatting Tests
  // ============================================================================

  it("should format a schedule with single day in 12-hour format", () => {
    const schedule: Schedule = {
      days: ["monday"],
      startTime: "14:00",
      endTime: "15:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("M 2:00 - 3:30 PM")
  })

  it("should format MWF schedule", () => {
    const schedule: Schedule = {
      days: ["monday", "wednesday", "friday"],
      startTime: "14:00",
      endTime: "15:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("MWF 2:00 - 3:30 PM")
  })

  it("should format TR (Tuesday/Thursday) schedule", () => {
    const schedule: Schedule = {
      days: ["tuesday", "thursday"],
      startTime: "09:00",
      endTime: "10:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("TTH 9:00 - 10:30 AM")
  })

  it("should format schedule with all weekdays", () => {
    const schedule: Schedule = {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "08:00",
      endTime: "09:00",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("MTWTHF 8:00 - 9:00 AM")
  })

  it("should format schedule with weekend days", () => {
    const schedule: Schedule = {
      days: ["saturday", "sunday"],
      startTime: "10:00",
      endTime: "12:00",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("SSU 10:00 AM - 12:00 PM")
  })

  it("should format schedule crossing AM/PM boundary", () => {
    const schedule: Schedule = {
      days: ["monday"],
      startTime: "11:30",
      endTime: "13:00",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("M 11:30 AM - 1:00 PM")
  })

  it("should format early morning schedule", () => {
    const schedule: Schedule = {
      days: ["monday"],
      startTime: "06:00",
      endTime: "07:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("M 6:00 - 7:30 AM")
  })

  it("should format late evening schedule", () => {
    const schedule: Schedule = {
      days: ["wednesday"],
      startTime: "20:00",
      endTime: "21:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("W 8:00 - 9:30 PM")
  })

  it("should format noon schedule", () => {
    const schedule: Schedule = {
      days: ["friday"],
      startTime: "12:00",
      endTime: "13:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("F 12:00 - 1:30 PM")
  })

  it("should format midnight schedule", () => {
    const schedule: Schedule = {
      days: ["saturday"],
      startTime: "00:00",
      endTime: "01:00",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("S 12:00 - 1:00 AM")
  })

  // ============================================================================
  // Missing Data Handling Tests
  // ============================================================================

  it("should return null when schedule is null", () => {
    const result = formatSchedule(null)

    expect(result).toBeNull()
  })

  it("should return null when schedule is undefined", () => {
    const result = formatSchedule(undefined)

    expect(result).toBeNull()
  })

  it("should return null when days array is empty", () => {
    const schedule: Schedule = {
      days: [],
      startTime: "14:00",
      endTime: "15:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when startTime is missing", () => {
    const schedule = {
      days: ["monday", "wednesday"],
      startTime: "",
      endTime: "15:30",
    } as Schedule

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when endTime is missing", () => {
    const schedule = {
      days: ["monday", "wednesday"],
      startTime: "14:00",
      endTime: "",
    } as Schedule

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when both times are missing", () => {
    const schedule = {
      days: ["monday"],
      startTime: "",
      endTime: "",
    } as Schedule

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when days is null", () => {
    const schedule = {
      days: null,
      startTime: "14:00",
      endTime: "15:30",
    } as any

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when days is undefined", () => {
    const schedule = {
      days: undefined,
      startTime: "14:00",
      endTime: "15:30",
    } as any

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when startTime is null", () => {
    const schedule = {
      days: ["monday"],
      startTime: null,
      endTime: "15:30",
    } as any

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when endTime is null", () => {
    const schedule = {
      days: ["monday"],
      startTime: "14:00",
      endTime: null,
    } as any

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when startTime is undefined", () => {
    const schedule = {
      days: ["monday"],
      startTime: undefined,
      endTime: "15:30",
    } as any

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  it("should return null when endTime is undefined", () => {
    const schedule = {
      days: ["monday"],
      startTime: "14:00",
      endTime: undefined,
    } as any

    const result = formatSchedule(schedule)

    expect(result).toBeNull()
  })

  // ============================================================================
  // Edge Cases
  // ============================================================================

  it("should handle schedule with days in different order", () => {
    const schedule: Schedule = {
      days: ["friday", "monday", "wednesday"],
      startTime: "14:00",
      endTime: "15:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("FMW 2:00 - 3:30 PM")
  })

  it("should handle schedule with duplicate days", () => {
    const schedule: Schedule = {
      days: ["monday", "monday", "wednesday"],
      startTime: "14:00",
      endTime: "15:30",
    }

    const result = formatSchedule(schedule)

    expect(result).toBe("MMW 2:00 - 3:30 PM")
  })
})
