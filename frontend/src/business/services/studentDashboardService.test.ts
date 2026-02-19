import { describe, it, expect, vi, beforeEach } from "vitest"

import * as studentDashboardService from "./studentDashboardService"
import * as dashboardRepository from "@/data/repositories/studentDashboardRepository"
import * as classValidation from "@/business/validation/classValidation"
import type { StudentDashboardBackendResponse } from "@/data/repositories/studentDashboardRepository"

// Mock dependencies
vi.mock("@/data/repositories/studentDashboardRepository")
vi.mock("@/business/validation/classValidation")

describe("studentDashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // getDashboardData Tests
  // ============================================================================

  describe("getDashboardData", () => {
    it("fetches dashboard data successfully", async () => {
      const mockData: StudentDashboardBackendResponse = {
        success: true,
        enrolledClasses: [],
        pendingAssignments: [],
      }
      vi.mocked(
        dashboardRepository.getCompleteDashboardDataForStudentId,
      ).mockResolvedValue(mockData)

      const result = await studentDashboardService.getDashboardData(1)

      expect(
        dashboardRepository.getCompleteDashboardDataForStudentId,
      ).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockData)
    })

    it("propagates error when fetch fails", async () => {
      vi.mocked(
        dashboardRepository.getCompleteDashboardDataForStudentId,
      ).mockRejectedValue(new Error("Network error"))

      await expect(studentDashboardService.getDashboardData(1)).rejects.toThrow(
        "Network error",
      )
    })
  })

  // ============================================================================
  // getEnrolledClasses Tests
  // ============================================================================

  describe("getEnrolledClasses", () => {
    it("fetches enrolled classes successfully", async () => {
      const mockClasses = { success: true, classes: [], total: 0 }
      vi.mocked(
        dashboardRepository.getAllEnrolledClassesForStudentId,
      ).mockResolvedValue(mockClasses)

      const result = await studentDashboardService.getEnrolledClasses(1, 5)

      expect(
        dashboardRepository.getAllEnrolledClassesForStudentId,
      ).toHaveBeenCalledWith(1, 5)
      expect(result).toEqual(mockClasses)
    })

    it("propagates error when fetch fails", async () => {
      vi.mocked(
        dashboardRepository.getAllEnrolledClassesForStudentId,
      ).mockRejectedValue(new Error("Failed"))

      await expect(
        studentDashboardService.getEnrolledClasses(1),
      ).rejects.toThrow("Failed")
    })
  })

  // ============================================================================
  // getPendingAssignments Tests
  // ============================================================================

  describe("getPendingAssignments", () => {
    it("fetches pending assignments successfully", async () => {
      const mockAssignments = { success: true, assignments: [], total: 0 }
      vi.mocked(
        dashboardRepository.getAllPendingAssignmentsForStudentId,
      ).mockResolvedValue(mockAssignments)

      const result = await studentDashboardService.getPendingAssignments(1)

      expect(
        dashboardRepository.getAllPendingAssignmentsForStudentId,
      ).toHaveBeenCalledWith(1, 10)
      expect(result).toEqual(mockAssignments)
    })

    it("propagates error when fetch fails", async () => {
      vi.mocked(
        dashboardRepository.getAllPendingAssignmentsForStudentId,
      ).mockRejectedValue(new Error("Failed"))

      await expect(
        studentDashboardService.getPendingAssignments(1),
      ).rejects.toThrow("Failed")
    })
  })

  // ============================================================================
  // joinClass Tests
  // ============================================================================

  describe("joinClass", () => {
    const mockClassCode = "ABC12345"
    const mockStudentId = 1

    it("joins class successfully when validation passes", async () => {
      vi.mocked(classValidation.validateClassJoinCode).mockReturnValue(null)
      vi.mocked(
        dashboardRepository.enrollStudentInClassWithCode,
      ).mockResolvedValue({
        success: true,
        message: "Joined successfully",
      })

      const result = await studentDashboardService.joinClass(
        mockStudentId,
        mockClassCode,
      )

      expect(classValidation.validateClassJoinCode).toHaveBeenCalledWith(
        mockClassCode,
      )
      expect(
        dashboardRepository.enrollStudentInClassWithCode,
      ).toHaveBeenCalledWith(mockStudentId, mockClassCode)
      expect(result.success).toBe(true)
    })

    it("returns error result when validation fails", async () => {
      vi.mocked(classValidation.validateClassJoinCode).mockReturnValue(
        "Invalid code format",
      )

      const result = await studentDashboardService.joinClass(
        mockStudentId,
        "bad",
      )

      expect(result.success).toBe(false)
      expect(result.message).toBe("Invalid code format")
      expect(
        dashboardRepository.enrollStudentInClassWithCode,
      ).not.toHaveBeenCalled()
    })

    it("handles repository errors gracefully", async () => {
      vi.mocked(classValidation.validateClassJoinCode).mockReturnValue(null)
      vi.mocked(
        dashboardRepository.enrollStudentInClassWithCode,
      ).mockRejectedValue(new Error("API Error"))

      const result = await studentDashboardService.joinClass(
        mockStudentId,
        mockClassCode,
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain("Failed to join class")
    })
  })

  // ============================================================================
  // leaveClass Tests
  // ============================================================================

  describe("leaveClass", () => {
    it("leaves class successfully", async () => {
      vi.mocked(
        dashboardRepository.unenrollStudentFromClassById,
      ).mockResolvedValue({
        success: true,
        message: "Left class",
      })

      const result = await studentDashboardService.leaveClass(1, 100)

      expect(
        dashboardRepository.unenrollStudentFromClassById,
      ).toHaveBeenCalledWith(1, 100)
      expect(result.success).toBe(true)
    })

    it("handles repository errors gracefully", async () => {
      vi.mocked(
        dashboardRepository.unenrollStudentFromClassById,
      ).mockRejectedValue(new Error("Failed"))

      const result = await studentDashboardService.leaveClass(1, 100)

      expect(result.success).toBe(false)
      expect(result.message).toContain("Failed to leave class")
    })
  })
})
