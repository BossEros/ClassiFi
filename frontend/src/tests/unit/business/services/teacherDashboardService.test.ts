import { describe, it, expect, vi, beforeEach } from "vitest"

import * as teacherDashboardService from "@/business/services/teacherDashboardService"
import * as dashboardRepository from "@/data/repositories/teacherDashboardRepository"

// Mock dependencies
vi.mock("@/data/repositories/teacherDashboardRepository")

describe("teacherDashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // getDashboardData Tests
  // ============================================================================

  describe("getDashboardData", () => {
    it("fetches aggregated dashboard data successfully", async () => {
      const mockData = {
        recentClasses: [{ id: 1, name: "Math" }],
        pendingTasks: [{ id: 1, title: "Grade HW1" }],
      }
      vi.mocked(
        dashboardRepository.getCompleteDashboardDataForTeacherId,
      ).mockResolvedValue(mockData as any)

      const result = await teacherDashboardService.getDashboardData(1)

      expect(
        dashboardRepository.getCompleteDashboardDataForTeacherId,
      ).toHaveBeenCalledWith(1)
      expect(result.recentClasses).toHaveLength(1)
      expect(result.pendingTasks).toHaveLength(1)
    })

    it("propagates error when fetch fails", async () => {
      vi.mocked(
        dashboardRepository.getCompleteDashboardDataForTeacherId,
      ).mockRejectedValue(new Error("Network fail"))

      await expect(teacherDashboardService.getDashboardData(1)).rejects.toThrow(
        "Network fail",
      )
    })
  })

  // ============================================================================
  // getRecentClasses Tests
  // ============================================================================

  describe("getRecentClasses", () => {
    it("fetches recent classes successfully", async () => {
      const mockClasses = { classes: [{ id: 1 }] }
      vi.mocked(
        dashboardRepository.getRecentClassesForTeacherId,
      ).mockResolvedValue(mockClasses as any)

      const result = await teacherDashboardService.getRecentClasses(1, 5)

      expect(
        dashboardRepository.getRecentClassesForTeacherId,
      ).toHaveBeenCalledWith(1, 5)
      expect(result).toHaveLength(1)
    })

    it("propagates error when fetch fails", async () => {
      vi.mocked(
        dashboardRepository.getRecentClassesForTeacherId,
      ).mockRejectedValue(new Error("Failed"))

      await expect(teacherDashboardService.getRecentClasses(1)).rejects.toThrow(
        "Failed",
      )
    })
  })

  // ============================================================================
  // getPendingTasks Tests
  // ============================================================================

  describe("getPendingTasks", () => {
    it("fetches pending tasks successfully", async () => {
      const mockTasks = { tasks: [{ id: 1 }] }
      vi.mocked(
        dashboardRepository.getPendingTasksForTeacherId,
      ).mockResolvedValue(mockTasks as any)

      const result = await teacherDashboardService.getPendingTasks(1, 10)

      expect(
        dashboardRepository.getPendingTasksForTeacherId,
      ).toHaveBeenCalledWith(1, 10)
      expect(result).toHaveLength(1)
    })

    it("propagates error when fetch fails", async () => {
      vi.mocked(
        dashboardRepository.getPendingTasksForTeacherId,
      ).mockRejectedValue(new Error("Failed"))

      await expect(teacherDashboardService.getPendingTasks(1)).rejects.toThrow(
        "Failed",
      )
    })
  })

  describe("getAllTeacherAssignments", () => {
    it("maps submitted and ungraded counts for teacher assignments", async () => {
      vi.mocked(
        dashboardRepository.getAllAssignmentsForTeacherId,
      ).mockResolvedValue({
        success: true,
        assignments: [
          {
            id: 15,
            assignmentName: "Recursion",
            className: "Algorithms",
            classCode: "ALG-201",
            classId: 4,
            deadline: "2026-04-22T10:00:00.000Z",
            submittedCount: 41,
            ungradedSubmissionCount: 0,
            totalStudents: 59,
            programmingLanguage: "python",
          },
        ],
      })

      const result = await teacherDashboardService.getAllTeacherAssignments(2)

      expect(
        dashboardRepository.getAllAssignmentsForTeacherId,
      ).toHaveBeenCalledWith(2)
      expect(result[0].submittedCount).toBe(41)
      expect(result[0].ungradedSubmissionCount).toBe(0)
      expect(result[0].classCode).toBe("ALG-201")
      expect(result[0].studentCount).toBe(59)
    })
  })
})
