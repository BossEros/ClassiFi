import { describe, it, expect } from "vitest"
import { formatCalendarDate } from "@/shared/utils/calendarDateUtils"

describe("calendarDateUtils", () => {
  describe("formatCalendarDate", () => {
    const testDate = new Date("2026-06-15T10:30:00Z")

    it("should format with locale string when no view is specified", () => {
      const result = formatCalendarDate(testDate)

      expect(result).toContain("June")
      expect(result).toContain("15")
      expect(result).toContain("2026")
    })

    describe("month view", () => {
      it("should format as 'MMMM yyyy'", () => {
        const result = formatCalendarDate(testDate, "month")

        expect(result).toBe("June 2026")
      })
    })

    describe("day view", () => {
      it("should format as 'MMMM d, yyyy'", () => {
        const result = formatCalendarDate(testDate, "day")

        expect(result).toBe("June 15, 2026")
      })
    })

    describe("agenda view", () => {
      it("should format as 'MMMM yyyy'", () => {
        const result = formatCalendarDate(testDate, "agenda")

        expect(result).toBe("June 2026")
      })
    })

    describe("week view", () => {
      it("should format week range within the same month", () => {
        // June 15 2026 is a Monday; week Sun-Sat = Jun 14-Jun 20
        const result = formatCalendarDate(testDate, "week")

        expect(result).toContain("Jun")
        expect(result).toContain("2026")
      })

      it("should format week range spanning two months", () => {
        // June 28 2026 is a Sunday; week Sun-Sat = Jun 28-Jul 4
        const crossMonthDate = new Date("2026-06-28T10:00:00Z")
        const result = formatCalendarDate(crossMonthDate, "week")

        expect(result).toContain("Jun")
        expect(result).toContain("Jul")
        expect(result).toContain("2026")
      })
    })
  })
})
