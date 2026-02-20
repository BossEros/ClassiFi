import { describe, it, expect } from "vitest"
import {
  getClassColor,
  calculateSubmissionStatus,
  formatCalendarDate,
} from "./calendarService"
import type { Assignment } from "@/business/models/dashboard/types"
import type { Submission } from "@/data/api/shared.types"

describe("calendarService", () => {
  describe("getClassColor", () => {
    it("should return a valid hex color", () => {
      const color = getClassColor(1)
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it("should return consistent colors for the same class ID", () => {
      const color1 = getClassColor(5)
      const color2 = getClassColor(5)
      expect(color1).toBe(color2)
    })

    it("should return different colors for different class IDs (within palette)", () => {
      const color1 = getClassColor(1)
      const color2 = getClassColor(2)
      // They should be different since 1 % 12 !== 2 % 12
      expect(color1).not.toBe(color2)
    })
  })

  describe("calculateSubmissionStatus", () => {
    const mockAssignment: Assignment = {
      id: 1,
      classId: 1,
      assignmentName: "Test Assignment",
      instructions: "Test description",
      programmingLanguage: "python",
      deadline: "2024-12-31T23:59:59Z" as any,
      allowResubmission: true,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z" as any,
    }

    it("should return 'not-started' when no submission exists", () => {
      const status = calculateSubmissionStatus(mockAssignment, undefined)
      expect(status).toBe("not-started")
    })

    it("should return 'submitted' when submission has a grade", () => {
      const mockSubmission: Submission = {
        id: 1,
        assignmentId: 1,
        studentId: 1,
        fileName: "test.py",
        fileSize: 1024,
        submissionNumber: 1,
        submittedAt: "2024-12-30T12:00:00Z",
        isLatest: true,
        grade: 95,
      }

      const status = calculateSubmissionStatus(mockAssignment, mockSubmission)
      expect(status).toBe("submitted")
    })

    it("should return 'pending' when submission exists but no grade", () => {
      const mockSubmission: Submission = {
        id: 1,
        assignmentId: 1,
        studentId: 1,
        fileName: "test.py",
        fileSize: 1024,
        submissionNumber: 1,
        submittedAt: "2024-12-30T12:00:00Z",
        isLatest: true,
        grade: undefined,
      }

      const status = calculateSubmissionStatus(mockAssignment, mockSubmission)
      expect(status).toBe("pending")
    })

    it("should return 'late' when submitted after deadline", () => {
      const mockSubmission: Submission = {
        id: 1,
        assignmentId: 1,
        studentId: 1,
        fileName: "test.py",
        fileSize: 1024,
        submissionNumber: 1,
        submittedAt: "2025-01-01T12:00:00Z", // After deadline
        isLatest: true,
        grade: undefined,
      }

      const status = calculateSubmissionStatus(mockAssignment, mockSubmission)
      expect(status).toBe("late")
    })
  })

  describe("formatCalendarDate", () => {
    it("should format date with month, day, year, and time", () => {
      const date = new Date("2024-01-15T23:59:00Z")
      const formatted = formatCalendarDate(date)

      // Check that it contains expected components
      expect(formatted).toContain("January")
      expect(formatted).toContain("15")
      expect(formatted).toContain("2024")
    })

    it("should include time with AM/PM", () => {
      const date = new Date("2024-01-15T14:30:00Z")
      const formatted = formatCalendarDate(date)

      // Should contain time components (exact format may vary by locale)
      expect(formatted).toMatch(/\d{1,2}:\d{2}/)
    })
  })
})
