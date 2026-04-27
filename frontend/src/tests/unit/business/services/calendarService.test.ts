import { beforeEach, describe, it, expect, vi } from "vitest"
import * as assignmentService from "@/business/services/assignmentService"
import * as classService from "@/business/services/classService"
import {
  getClassColor,
  calculateSubmissionStatus,
  formatCalendarDate,
  getCalendarEvents,
} from "@/business/services/calendarService"
import type { Assignment } from "@/data/api/class.types"
import type { Submission } from "@/data/api/shared.types"

vi.mock("@/business/services/assignmentService")
vi.mock("@/business/services/classService")
vi.mock("@/business/services/studentDashboardService")

describe("calendarService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
      moduleId: null,
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

  describe("getCalendarEvents", () => {
    it("uses only active students for teacher assignment submission totals", async () => {
      vi.mocked(classService.getAllClasses).mockResolvedValue([
        {
          id: 4,
          teacherId: 9,
          className: "Algorithms",
          classCode: "ALG-101",
          description: null,
          isActive: true,
          createdAt: "2026-04-01T00:00:00.000Z" as Assignment["createdAt"],
          semester: 1,
          academicYear: "2025-2026",
          schedule: {
            days: ["monday"],
            startTime: "09:00",
            endTime: "10:00",
          },
        },
      ] as any)
      vi.mocked(classService.getClassAssignments).mockResolvedValue([
        {
          id: 40,
          classId: 4,
          moduleId: null,
          assignmentName: "Greedy",
          instructions: "Solve it",
          programmingLanguage: "python",
          deadline: "2026-04-15T12:00:00.000Z",
          allowResubmission: true,
          isActive: true,
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ] as any)
      vi.mocked(assignmentService.getAssignmentSubmissions).mockResolvedValue([
        {
          id: 1,
          assignmentId: 40,
          studentId: 100,
          fileName: "greedy.py",
          fileSize: 123,
          submissionNumber: 1,
          submittedAt: "2026-04-10T12:00:00.000Z",
          isLatest: true,
        },
      ] as any)
      vi.mocked(classService.getClassStudents).mockResolvedValue([
        {
          id: 100,
          firstName: "Alice",
          lastName: "Active",
          fullName: "Alice Active",
          email: "alice@test.com",
          avatarUrl: null,
          isActive: true,
          enrolledAt: "2026-04-01T00:00:00.000Z",
        },
        {
          id: 101,
          firstName: "Bob",
          lastName: "Active",
          fullName: "Bob Active",
          email: "bob@test.com",
          avatarUrl: null,
          isActive: true,
          enrolledAt: "2026-04-01T00:00:00.000Z",
        },
      ] as any)

      const events = await getCalendarEvents(
        new Date("2026-04-01T00:00:00.000Z"),
        new Date("2026-04-30T23:59:59.999Z"),
        9,
        "teacher",
      )

      expect(classService.getClassStudents).toHaveBeenCalledWith(4, "active")
      expect(events[0].assignment.submittedCount).toBe(1)
      expect(events[0].assignment.totalStudents).toBe(2)
    })
  })
})
