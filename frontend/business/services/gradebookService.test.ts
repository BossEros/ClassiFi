import { describe, it, expect, vi, beforeEach } from "vitest"
import * as gradebookService from "./gradebookService"
import * as gradebookRepository from "@/data/repositories/gradebookRepository"

// Mock the repository
vi.mock("@/data/repositories/gradebookRepository")

describe("gradebookService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getClassGradebook", () => {
    it("should validate classId and call repository", async () => {
      const mockGradebook = {
        assignments: [],
        students: [],
      }
      vi.mocked(
        gradebookRepository.getCompleteGradebookForClassId,
      ).mockResolvedValue(mockGradebook as any)

      const result = await gradebookService.getClassGradebook(1)

      expect(result).toEqual(mockGradebook)
      expect(
        gradebookRepository.getCompleteGradebookForClassId,
      ).toHaveBeenCalledWith(1)
    })

    it("should throw error for invalid classId", async () => {
      await expect(gradebookService.getClassGradebook(0)).rejects.toThrow()
      await expect(gradebookService.getClassGradebook(-1)).rejects.toThrow()
    })
  })

  describe("getClassStatistics", () => {
    it("should validate classId and call repository", async () => {
      const mockStats = {
        classId: 1,
        classAverage: 85,
        medianScore: 82,
        highestScore: 98,
        lowestScore: 60,
        standardDeviation: 5,
        passingRate: 90,
      }
      vi.mocked(gradebookRepository.getStatisticsForClassId).mockResolvedValue(
        mockStats as any,
      )

      const result = await gradebookService.getClassStatistics(1)

      expect(result).toEqual(mockStats)
      expect(gradebookRepository.getStatisticsForClassId).toHaveBeenCalledWith(
        1,
      )
    })
  })

  describe("getStudentGrades", () => {
    it("should validate studentId and call repository", async () => {
      const mockGrades = [{ classId: 1, className: "Math", grades: [] }]
      vi.mocked(gradebookRepository.getAllGradesForStudentId).mockResolvedValue(
        mockGrades as any,
      )

      const result = await gradebookService.getStudentGrades(101)

      expect(result).toEqual(mockGrades)
      expect(gradebookRepository.getAllGradesForStudentId).toHaveBeenCalledWith(
        101,
      )
    })

    it("should throw error for invalid studentId", async () => {
      await expect(gradebookService.getStudentGrades(0)).rejects.toThrow()
    })
  })

  describe("overrideGrade", () => {
    it("should validate inputs and call repository", async () => {
      vi.mocked(
        gradebookRepository.setGradeOverrideForSubmissionById,
      ).mockResolvedValue(undefined)

      await gradebookService.overrideGrade(1, 95, "Good work")

      expect(
        gradebookRepository.setGradeOverrideForSubmissionById,
      ).toHaveBeenCalledWith(1, 95, "Good work")
    })

    it("should throw error for invalid grade", async () => {
      await expect(
        gradebookService.overrideGrade(1, -1, "test"),
      ).rejects.toThrow("Grade must be between 0 and 100")
      await expect(
        gradebookService.overrideGrade(1, 101, "test"),
      ).rejects.toThrow("Grade must be between 0 and 100")
    })

    it("should throw error for invalid submissionId", async () => {
      await expect(
        gradebookService.overrideGrade(0, 95, "test"),
      ).rejects.toThrow()
    })
  })

  describe("removeGradeOverride", () => {
    it("should validate submissionId and call repository", async () => {
      vi.mocked(
        gradebookRepository.removeGradeOverrideForSubmissionById,
      ).mockResolvedValue(undefined)

      await gradebookService.removeGradeOverride(1)

      expect(
        gradebookRepository.removeGradeOverrideForSubmissionById,
      ).toHaveBeenCalledWith(1)
    })

    it("should throw error for invalid submissionId", async () => {
      await expect(gradebookService.removeGradeOverride(0)).rejects.toThrow()
    })
  })

  describe("updateLatePenaltyConfig", () => {
    it("should validate inputs and call repository", async () => {
      const config = {
        gracePeriodHours: 2,
        tiers: [
          { id: "1", hoursAfterGrace: 0, penaltyPercent: 10 },
          { id: "2", hoursAfterGrace: 24, penaltyPercent: 20 },
        ],
        rejectAfterHours: 72,
      }
      vi.mocked(
        gradebookRepository.updateLatePenaltyConfigurationForAssignmentId,
      ).mockResolvedValue(undefined)

      await gradebookService.updateLatePenaltyConfig(1, true, config)

      expect(
        gradebookRepository.updateLatePenaltyConfigurationForAssignmentId,
      ).toHaveBeenCalledWith(1, true, config)
    })

    it("should throw error when enabled without config", async () => {
      await expect(
        gradebookService.updateLatePenaltyConfig(1, true),
      ).rejects.toThrow("Late penalty config is required when enabled")
    })

    it("should throw error for invalid penalty percentage", async () => {
      const config = {
        gracePeriodHours: 2,
        tiers: [{ id: "1", hoursAfterGrace: 0, penaltyPercent: 101 }],
        rejectAfterHours: 72,
      }
      await expect(
        gradebookService.updateLatePenaltyConfig(1, true, config),
      ).rejects.toThrow("Penalty percentage must be between 0 and 100")
    })

    it("should throw error for negative grace period", async () => {
      const config = {
        gracePeriodHours: -1,
        tiers: [{ id: "1", hoursAfterGrace: 0, penaltyPercent: 10 }],
        rejectAfterHours: 72,
      }
      await expect(
        gradebookService.updateLatePenaltyConfig(1, true, config),
      ).rejects.toThrow("Grace period must be non-negative")
    })
  })
})
