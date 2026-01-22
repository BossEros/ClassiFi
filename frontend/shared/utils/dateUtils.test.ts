import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  formatDeadline,
  getDeadlineColor,
  getCurrentAcademicYear,
  formatTimeAgo,
  isLateSubmission,
  formatTimeRemaining,
  formatDateTime,
} from "./dateUtils";

describe("dateUtils", () => {
  // ============================================================================
  // formatDeadline Tests
  // ============================================================================

  describe("formatDeadline", () => {
    it("should format a Date object correctly", () => {
      const date = new Date("2024-12-25T15:30:00Z");
      const result = formatDeadline(date);

      // Should contain date parts (locale-dependent, so we check for components)
      expect(result).toContain("Dec");
      expect(result).toContain("25");
      expect(result).toContain("2024");
    });

    it("should format a date string correctly", () => {
      const result = formatDeadline("2024-12-25T15:30:00Z");

      expect(result).toContain("Dec");
      expect(result).toContain("25");
      expect(result).toContain("2024");
    });

    it("should handle ISO date strings", () => {
      const isoString = "2024-06-15T09:00:00.000Z";
      const result = formatDeadline(isoString);

      expect(result).toContain("Jun");
      expect(result).toContain("15");
    });
  });

  // ============================================================================
  // getDeadlineColor Tests
  // ============================================================================

  describe("getDeadlineColor", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns red for past deadlines", () => {
      const pastDate = "2024-06-14T12:00:00Z"; // 1 day ago

      expect(getDeadlineColor(pastDate)).toBe("text-red-400");
    });

    it("returns orange for deadlines within 24 hours", () => {
      const soonDate = "2024-06-15T20:00:00Z"; // 8 hours from now

      expect(getDeadlineColor(soonDate)).toBe("text-orange-400");
    });

    it("returns yellow for deadlines within 3 days", () => {
      const nearDate = "2024-06-17T12:00:00Z"; // 2 days from now

      expect(getDeadlineColor(nearDate)).toBe("text-yellow-400");
    });

    it("returns gray for deadlines more than 3 days away", () => {
      const farDate = "2024-06-25T12:00:00Z"; // 10 days from now

      expect(getDeadlineColor(farDate)).toBe("text-gray-400");
    });

    it("handles Date objects", () => {
      const pastDate = new Date("2024-06-10T12:00:00Z");

      expect(getDeadlineColor(pastDate)).toBe("text-red-400");
    });
  });

  // ============================================================================
  // getCurrentAcademicYear Tests
  // ============================================================================

  describe("getCurrentAcademicYear", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns current-next year after June", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-08-15")); // August (month 7, >= 5)

      expect(getCurrentAcademicYear()).toBe("2024-2025");
    });

    it("returns previous-current year before June", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-02-15")); // February (month 1, < 5)

      expect(getCurrentAcademicYear()).toBe("2023-2024");
    });

    it("returns current-next year in June", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15")); // June (month 5, >= 5)

      expect(getCurrentAcademicYear()).toBe("2024-2025");
    });

    it("returns previous-current year in May", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-05-15")); // May (month 4, < 5)

      expect(getCurrentAcademicYear()).toBe("2023-2024");
    });
  });

  // ============================================================================
  // formatTimeAgo Tests
  // ============================================================================

  describe("formatTimeAgo", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 'Just now' for very recent times", () => {
      const justNow = new Date("2024-06-15T11:59:45Z"); // 15 seconds ago

      expect(formatTimeAgo(justNow)).toBe("Just now");
    });

    it("returns minutes ago for recent times", () => {
      const fiveMinutesAgo = new Date("2024-06-15T11:55:00Z");

      expect(formatTimeAgo(fiveMinutesAgo)).toBe("5 minutes ago");
    });

    it("returns singular minute", () => {
      const oneMinuteAgo = new Date("2024-06-15T11:59:00Z");

      expect(formatTimeAgo(oneMinuteAgo)).toBe("1 minute ago");
    });

    it("returns hours ago for older times", () => {
      const threeHoursAgo = new Date("2024-06-15T09:00:00Z");

      expect(formatTimeAgo(threeHoursAgo)).toBe("3 hours ago");
    });

    it("returns singular hour", () => {
      const oneHourAgo = new Date("2024-06-15T11:00:00Z");

      expect(formatTimeAgo(oneHourAgo)).toBe("1 hour ago");
    });

    it("returns days ago for older times", () => {
      const fiveDaysAgo = new Date("2024-06-10T12:00:00Z");

      expect(formatTimeAgo(fiveDaysAgo)).toBe("5 days ago");
    });

    it("returns singular day", () => {
      const oneDayAgo = new Date("2024-06-14T12:00:00Z");

      expect(formatTimeAgo(oneDayAgo)).toBe("1 day ago");
    });

    it("returns formatted date for times older than 30 days", () => {
      const twoMonthsAgo = new Date("2024-04-15T12:00:00Z");
      const result = formatTimeAgo(twoMonthsAgo);

      expect(result).toContain("Apr");
      expect(result).toContain("15");
    });

    it("handles string input", () => {
      const result = formatTimeAgo("2024-06-15T11:55:00Z");

      expect(result).toBe("5 minutes ago");
    });
  });

  // ============================================================================
  // isLateSubmission Tests
  // ============================================================================

  describe("isLateSubmission", () => {
    it("returns true when submitted after deadline", () => {
      const deadline = "2024-06-15T12:00:00Z";
      const submitted = "2024-06-15T13:00:00Z"; // 1 hour late

      expect(isLateSubmission(submitted, deadline)).toBe(true);
    });

    it("returns false when submitted before deadline", () => {
      const deadline = "2024-06-15T12:00:00Z";
      const submitted = "2024-06-15T11:00:00Z"; // 1 hour early

      expect(isLateSubmission(submitted, deadline)).toBe(false);
    });

    it("returns false when submitted exactly at deadline", () => {
      const deadline = "2024-06-15T12:00:00Z";
      const submitted = "2024-06-15T12:00:00Z";

      expect(isLateSubmission(submitted, deadline)).toBe(false);
    });

    it("handles Date objects", () => {
      const deadline = new Date("2024-06-15T12:00:00Z");
      const submitted = new Date("2024-06-15T13:00:00Z");

      expect(isLateSubmission(submitted, deadline)).toBe(true);
    });

    it("handles mixed Date and string inputs", () => {
      const deadline = new Date("2024-06-15T12:00:00Z");
      const submitted = "2024-06-15T11:00:00Z";

      expect(isLateSubmission(submitted, deadline)).toBe(false);
    });
  });

  // ============================================================================
  // formatTimeRemaining Tests
  // ============================================================================

  describe("formatTimeRemaining", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 'Past due' for past deadlines", () => {
      const pastDeadline = "2024-06-14T12:00:00Z";

      expect(formatTimeRemaining(pastDeadline)).toBe("Past due");
    });

    it("formats days and hours for distant deadlines", () => {
      const threeDaysAway = "2024-06-18T17:00:00Z"; // 3 days 5 hours

      expect(formatTimeRemaining(threeDaysAway)).toBe("3d 5h");
    });

    it("formats hours and minutes for near deadlines", () => {
      const hoursAway = "2024-06-15T14:30:00Z"; // 2 hours 30 minutes

      expect(formatTimeRemaining(hoursAway)).toBe("2h 30m");
    });

    it("handles exactly 24 hours remaining", () => {
      const oneDayAway = "2024-06-16T12:00:00Z";

      expect(formatTimeRemaining(oneDayAway)).toBe("1d 0h");
    });

    it("handles Date objects", () => {
      const date = new Date("2024-06-15T15:00:00Z"); // 3 hours away

      expect(formatTimeRemaining(date)).toBe("3h 0m");
    });
  });

  // ============================================================================
  // formatDateTime Tests
  // ============================================================================

  describe("formatDateTime", () => {
    it("formats a date correctly", () => {
      const date = new Date("2024-06-15T14:30:00Z");
      const result = formatDateTime(date);

      // Check for expected components (locale-dependent)
      expect(result).toContain("Jun");
      expect(result).toContain("15");
      expect(result).toContain("2024");
    });

    it("formats a date string correctly", () => {
      const result = formatDateTime("2024-12-25T09:15:00Z");

      expect(result).toContain("Dec");
      expect(result).toContain("25");
      expect(result).toContain("2024");
    });

    it("includes time with AM/PM", () => {
      // Use a time that's clearly AM or PM
      const morningDate = new Date("2024-06-15T09:30:00Z");
      const result = formatDateTime(morningDate);

      // Should contain either AM or PM
      expect(result).toMatch(/AM|PM/);
    });
  });
});
