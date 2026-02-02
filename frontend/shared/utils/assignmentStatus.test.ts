import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  getAssignmentStatus,
  getStatusColor,
  getStatusLabel,
} from "./assignmentStatus"
import type { Assignment } from "@/shared/types/class"

describe("assignmentStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("getAssignmentStatus", () => {
    it("returns 'late' when not submitted and past deadline", () => {
      const assignment: Assignment = {
        id: 1,
        classId: 1,
        assignmentName: "Test",
        deadline: "2024-01-10T23:59:59Z" as any,
        programmingLanguage: "python",
        hasSubmitted: false,
        maxGrade: 100,
      }

      expect(getAssignmentStatus(assignment)).toBe("late")
    })

    it("returns 'late' when submitted after deadline", () => {
      const assignment: Assignment = {
        id: 1,
        classId: 1,
        assignmentName: "Test",
        deadline: "2024-01-10T23:59:59Z" as any,
        programmingLanguage: "python",
        hasSubmitted: true,
        submittedAt: "2024-01-12T10:00:00Z" as any,
        maxGrade: 100,
      }

      expect(getAssignmentStatus(assignment)).toBe("late")
    })

    it("returns 'submitted' when submitted and graded", () => {
      const assignment: Assignment = {
        id: 1,
        classId: 1,
        assignmentName: "Test",
        deadline: "2024-01-20T23:59:59Z" as any,
        programmingLanguage: "python",
        hasSubmitted: true,
        submittedAt: "2024-01-14T10:00:00Z" as any,
        grade: 95,
        maxGrade: 100,
      }

      expect(getAssignmentStatus(assignment)).toBe("submitted")
    })

    it("returns 'pending' when submitted but not graded", () => {
      const assignment: Assignment = {
        id: 1,
        classId: 1,
        assignmentName: "Test",
        deadline: "2024-01-20T23:59:59Z" as any,
        programmingLanguage: "python",
        hasSubmitted: true,
        submittedAt: "2024-01-14T10:00:00Z" as any,
        maxGrade: 100,
      }

      expect(getAssignmentStatus(assignment)).toBe("pending")
    })

    it("returns 'not-started' when not submitted with future deadline", () => {
      const assignment: Assignment = {
        id: 1,
        classId: 1,
        assignmentName: "Test",
        deadline: "2024-01-20T23:59:59Z" as any,
        programmingLanguage: "python",
        hasSubmitted: false,
        maxGrade: 100,
      }

      expect(getAssignmentStatus(assignment)).toBe("not-started")
    })

    it("handles missing submittedAt gracefully", () => {
      const assignment: Assignment = {
        id: 1,
        classId: 1,
        assignmentName: "Test",
        deadline: "2024-01-20T23:59:59Z" as any,
        programmingLanguage: "python",
        hasSubmitted: true,
        maxGrade: 100,
      }

      expect(getAssignmentStatus(assignment)).toBe("pending")
    })
  })

  describe("getStatusColor", () => {
    it("returns yellow for pending", () => {
      expect(getStatusColor("pending")).toBe("text-yellow-400")
    })

    it("returns gray for not-started", () => {
      expect(getStatusColor("not-started")).toBe("text-gray-400")
    })

    it("returns teal for submitted", () => {
      expect(getStatusColor("submitted")).toBe("text-teal-400")
    })

    it("returns red for late", () => {
      expect(getStatusColor("late")).toBe("text-red-400")
    })
  })

  describe("getStatusLabel", () => {
    it("returns 'Pending' for pending", () => {
      expect(getStatusLabel("pending")).toBe("Pending")
    })

    it("returns 'Not Started' for not-started", () => {
      expect(getStatusLabel("not-started")).toBe("Not Started")
    })

    it("returns 'Submitted' for submitted", () => {
      expect(getStatusLabel("submitted")).toBe("Submitted")
    })

    it("returns 'Late' for late", () => {
      expect(getStatusLabel("late")).toBe("Late")
    })
  })
})
