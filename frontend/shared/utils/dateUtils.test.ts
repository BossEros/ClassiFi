import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import {
  formatDeadline,
  getDeadlineColor,
  getCurrentAcademicYear,
  formatTimeAgo,
  isLateSubmission,
  formatTimeRemaining,
  getDeadlineStatus,
  formatDateTime,
} from "@/shared/utils/dateUtils"

describe("dateUtils", () => {
  // ============================================================================
  // formatDeadline Tests
  // ============================================================================

  describe("formatDeadline", () => {
    it("should format a Date object correctly", () => {
      const date = new Date("2024-12-25T15:30:00Z")
      const result = formatDeadline(date)

      // With TZ=UTC, toLocaleString will format consistently
      expect(result).toBe("Dec 25, 2024, 03:30 PM")
    })

    it("should format a date string correctly", () => {
      const result = formatDeadline("2024-12-25T15:30:00Z")

      expect(result).toBe("Dec 25, 2024, 03:30 PM")
    })

    it("should handle ISO date strings", () => {
      const isoString = "2024-06-15T09:00:00.000Z"
      const result = formatDeadline(isoString)

      expect(result).toBe("Jun 15, 2024, 09:00 AM")
    })
  })

  // ============================================================================
  // getDeadlineColor Tests
  // ============================================================================

  describe("getDeadlineColor", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("returns red for past deadlines", () => {
      const pastDate = "2024-06-14T12:00:00Z" // 1 day ago

      expect(getDeadlineColor(pastDate)).toBe("text-red-400")
    })

    it("returns orange for deadlines within 24 hours", () => {
      const soonDate = "2024-06-15T20:00:00Z" // 8 hours from now

      expect(getDeadlineColor(soonDate)).toBe("text-orange-400")
    })

    it("returns yellow for deadlines within 3 days", () => {
      const nearDate = "2024-06-17T12:00:00Z" // 2 days from now

      expect(getDeadlineColor(nearDate)).toBe("text-yellow-400")
    })

    it("returns gray for deadlines more than 3 days away", () => {
      const farDate = "2024-06-25T12:00:00Z" // 10 days from now

      expect(getDeadlineColor(farDate)).toBe("text-gray-400")
    })

    it("handles Date objects", () => {
      const pastDate = new Date("2024-06-10T12:00:00Z")

      expect(getDeadlineColor(pastDate)).toBe("text-red-400")
    })
  })

  // ============================================================================
  // getCurrentAcademicYear Tests
  // ============================================================================

  describe("getCurrentAcademicYear", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("returns current-next year after June", () => {
      vi.setSystemTime(new Date("2024-08-15")) // August (month 7, >= 5)

      expect(getCurrentAcademicYear()).toBe("2024-2025")
    })

    it("returns previous-current year before June", () => {
      vi.setSystemTime(new Date("2024-02-15")) // February (month 1, < 5)

      expect(getCurrentAcademicYear()).toBe("2023-2024")
    })

    it("returns current-next year in June", () => {
      vi.setSystemTime(new Date("2024-06-15")) // June (month 5, >= 5)

      expect(getCurrentAcademicYear()).toBe("2024-2025")
    })

    it("returns previous-current year in May", () => {
      vi.setSystemTime(new Date("2024-05-15")) // May (month 4, < 5)

      expect(getCurrentAcademicYear()).toBe("2023-2024")
    })
  })

  // ============================================================================
  // formatTimeAgo Tests
  // ============================================================================

  describe("formatTimeAgo", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("returns 'Just now' for very recent times", () => {
      const justNow = new Date("2024-06-15T11:59:45Z") // 15 seconds ago

      expect(formatTimeAgo(justNow)).toBe("Just now")
    })

    it("returns minutes ago for recent times", () => {
      const fiveMinutesAgo = new Date("2024-06-15T11:55:00Z")

      expect(formatTimeAgo(fiveMinutesAgo)).toBe("5 minutes ago")
    })

    it("returns singular minute", () => {
      const oneMinuteAgo = new Date("2024-06-15T11:59:00Z")

      expect(formatTimeAgo(oneMinuteAgo)).toBe("1 minute ago")
    })

    it("returns hours ago for older times", () => {
      const threeHoursAgo = new Date("2024-06-15T09:00:00Z")

      expect(formatTimeAgo(threeHoursAgo)).toBe("3 hours ago")
    })

    it("returns singular hour", () => {
      const oneHourAgo = new Date("2024-06-15T11:00:00Z")

      expect(formatTimeAgo(oneHourAgo)).toBe("1 hour ago")
    })

    it("returns days ago for older times", () => {
      const fiveDaysAgo = new Date("2024-06-10T12:00:00Z")

      expect(formatTimeAgo(fiveDaysAgo)).toBe("5 days ago")
    })

    it("returns singular day", () => {
      const oneDayAgo = new Date("2024-06-14T12:00:00Z")

      expect(formatTimeAgo(oneDayAgo)).toBe("1 day ago")
    })

    it("returns formatted date for times older than 30 days", () => {
      const twoMonthsAgo = new Date("2024-04-15T12:00:00Z")
      const result = formatTimeAgo(twoMonthsAgo)

      // With TZ=UTC, formatting is consistent
      expect(result).toBe("Apr 15, 2024")
    })

    it("handles string input", () => {
      const result = formatTimeAgo("2024-06-15T11:55:00Z")

      expect(result).toBe("5 minutes ago")
    })
  })

  // ============================================================================
  // isLateSubmission Tests
  // ============================================================================

  describe("isLateSubmission", () => {
    it("returns true when submitted after deadline", () => {
      const deadline = "2024-06-15T12:00:00Z"
      const submitted = "2024-06-15T13:00:00Z" // 1 hour late

      expect(isLateSubmission(submitted, deadline)).toBe(true)
    })

    it("returns false when submitted before deadline", () => {
      const deadline = "2024-06-15T12:00:00Z"
      const submitted = "2024-06-15T11:00:00Z" // 1 hour early

      expect(isLateSubmission(submitted, deadline)).toBe(false)
    })

    it("returns false when submitted exactly at deadline", () => {
      const deadline = "2024-06-15T12:00:00Z"
      const submitted = "2024-06-15T12:00:00Z"

      expect(isLateSubmission(submitted, deadline)).toBe(false)
    })

    it("handles Date objects", () => {
      const deadline = new Date("2024-06-15T12:00:00Z")
      const submitted = new Date("2024-06-15T13:00:00Z")

      expect(isLateSubmission(submitted, deadline)).toBe(true)
    })

    it("handles mixed Date and string inputs", () => {
      const deadline = new Date("2024-06-15T12:00:00Z")
      const submitted = "2024-06-15T11:00:00Z"

      expect(isLateSubmission(submitted, deadline)).toBe(false)
    })
  })

  // ============================================================================
  // formatTimeRemaining Tests
  // ============================================================================

  describe("formatTimeRemaining", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("returns 'Past due' for past deadlines", () => {
      const pastDeadline = "2024-06-14T12:00:00Z"

      expect(formatTimeRemaining(pastDeadline)).toBe("Past due")
    })

    it("formats days and hours for distant deadlines", () => {
      const threeDaysAway = "2024-06-18T17:00:00Z" // 3 days 5 hours

      expect(formatTimeRemaining(threeDaysAway)).toBe("3d 5h")
    })

    it("formats hours and minutes for near deadlines", () => {
      const hoursAway = "2024-06-15T14:30:00Z" // 2 hours 30 minutes

      expect(formatTimeRemaining(hoursAway)).toBe("2h 30m")
    })

    it("handles exactly 24 hours remaining", () => {
      const oneDayAway = "2024-06-16T12:00:00Z"

      expect(formatTimeRemaining(oneDayAway)).toBe("1d 0h")
    })

    it("handles Date objects", () => {
      const date = new Date("2024-06-15T15:00:00Z") // 3 hours away

      expect(formatTimeRemaining(date)).toBe("3h 0m")
    })
  })

  // ============================================================================
  // getDeadlineStatus Tests
  // ============================================================================

  describe("getDeadlineStatus", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // Set to noon on June 15, 2024
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("returns 'Overdue' for past deadlines", () => {
      const yesterday = "2024-06-14T23:59:59Z"

      expect(getDeadlineStatus(yesterday)).toBe("Overdue")
    })

    it("returns 'Due today' for deadlines on the same calendar day", () => {
      // Even though it's later today, it should be "Due today"
      const laterToday = "2024-06-15T23:59:59Z"

      expect(getDeadlineStatus(laterToday)).toBe("Due today")
    })

    it("returns 'Due today' for deadlines earlier on the same day", () => {
      // Even though it's technically in the past, same calendar day = "Due today"
      const earlierToday = "2024-06-15T08:00:00Z"

      expect(getDeadlineStatus(earlierToday)).toBe("Due today")
    })

    it("returns 'Due tomorrow' for deadlines on the next calendar day", () => {
      const tomorrow = "2024-06-16T00:00:01Z"

      expect(getDeadlineStatus(tomorrow)).toBe("Due tomorrow")
    })

    it("returns 'Due tomorrow' for deadlines late tomorrow", () => {
      const tomorrowEvening = "2024-06-16T23:59:59Z"

      expect(getDeadlineStatus(tomorrowEvening)).toBe("Due tomorrow")
    })

    it("returns 'Due in X days' for deadlines multiple days away", () => {
      const threeDaysAway = "2024-06-18T12:00:00Z"

      expect(getDeadlineStatus(threeDaysAway)).toBe("Due in 3 days")
    })

    it("returns 'Due in X days' for deadlines a week away", () => {
      const sevenDaysAway = "2024-06-22T12:00:00Z"

      expect(getDeadlineStatus(sevenDaysAway)).toBe("Due in 7 days")
    })

    it("handles Date objects", () => {
      const tomorrow = new Date("2024-06-16T15:00:00Z")

      expect(getDeadlineStatus(tomorrow)).toBe("Due tomorrow")
    })

    it("handles midnight deadlines correctly", () => {
      const midnightTonight = "2024-06-15T23:59:59Z"

      expect(getDeadlineStatus(midnightTonight)).toBe("Due today")
    })

    it("handles midnight tomorrow correctly", () => {
      const midnightTomorrow = "2024-06-16T00:00:00Z"

      expect(getDeadlineStatus(midnightTomorrow)).toBe("Due tomorrow")
    })
  })

  // ============================================================================
  // formatDateTime Tests
  // ============================================================================

  describe("formatDateTime", () => {
    it("formats a date correctly", () => {
      const date = new Date("2024-06-15T14:30:00Z")
      const result = formatDateTime(date)

      // With TZ=UTC, formatting is consistent
      expect(result).toBe("Jun 15, 2024, 2:30 PM")
    })

    it("formats a date string correctly", () => {
      const result = formatDateTime("2024-12-25T09:15:00Z")

      expect(result).toBe("Dec 25, 2024, 9:15 AM")
    })

    it("includes time with AM/PM", () => {
      const morningDate = new Date("2024-06-15T09:30:00Z")
      const result = formatDateTime(morningDate)

      expect(result).toBe("Jun 15, 2024, 9:30 AM")
      expect(result).toContain("AM")
    })
  })
})
