import { describe, it, expect, vi, beforeEach } from "vitest"
import * as gradebookRepository from "./gradebookRepository"
import { apiClient } from "@/data/api/apiClient"

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe("gradebookRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // getCompleteGradebookForClassId Tests
  // ============================================================================

  describe("getCompleteGradebookForClassId", () => {
    const mockGradebook = {
      assignments: [
        { assignmentId: 1, assignmentName: "Assignment 1", maxScore: 100 },
      ],
      students: [
        { studentId: 1, studentName: "John Doe", grades: [{ grade: 95 }] },
      ],
    }

    it("fetches the class gradebook successfully", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, ...mockGradebook },
        status: 200,
      })

      const result = await gradebookRepository.getCompleteGradebookForClassId(1)

      expect(apiClient.get).toHaveBeenCalledWith("/gradebook/classes/1")
      expect(result.assignments).toEqual(mockGradebook.assignments)
      expect(result.students).toEqual(mockGradebook.students)
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      })

      await expect(
        gradebookRepository.getCompleteGradebookForClassId(1),
      ).rejects.toThrow("Unauthorized")
    })

    it("throws default error when response is unsuccessful", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false },
        status: 500,
      })

      await expect(
        gradebookRepository.getCompleteGradebookForClassId(1),
      ).rejects.toThrow("Failed to fetch gradebook")
    })
  })

  // ============================================================================
  // getStatisticsForClassId Tests
  // ============================================================================

  describe("getStatisticsForClassId", () => {
    const mockStatistics = {
      averageGrade: 85.5,
      highestGrade: 100,
      lowestGrade: 60,
      submissionRate: 0.95,
    }

    it("fetches class statistics successfully", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, statistics: mockStatistics },
        status: 200,
      })

      const result = await gradebookRepository.getStatisticsForClassId(1)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/gradebook/classes/1/statistics",
      )
      expect(result).toEqual(mockStatistics)
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Class not found",
        status: 404,
      })

      await expect(
        gradebookRepository.getStatisticsForClassId(999),
      ).rejects.toThrow("Class not found")
    })

    it("throws default error when response is unsuccessful", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false },
        status: 500,
      })

      await expect(
        gradebookRepository.getStatisticsForClassId(1),
      ).rejects.toThrow("Failed to fetch class statistics")
    })
  })

  // ============================================================================
  // getAllGradesForStudentId Tests
  // ============================================================================

  describe("getAllGradesForStudentId", () => {
    const mockGrades = [
      { classId: 1, className: "Class 1", grades: [] },
      { classId: 2, className: "Class 2", grades: [] },
    ]

    it("fetches all grades for a student", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, grades: mockGrades },
        status: 200,
      })

      const result = await gradebookRepository.getAllGradesForStudentId(1)

      expect(apiClient.get).toHaveBeenCalledWith("/gradebook/students/1")
      expect(result).toEqual(mockGrades)
    })

    it("returns empty array when student has no grades", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, grades: [] },
        status: 200,
      })

      const result = await gradebookRepository.getAllGradesForStudentId(1)

      expect(result).toEqual([])
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Student not found",
        status: 404,
      })

      await expect(
        gradebookRepository.getAllGradesForStudentId(999),
      ).rejects.toThrow("Student not found")
    })
  })

  // ============================================================================
  // getGradesForStudentInSpecificClass Tests
  // ============================================================================

  describe("getGradesForStudentInSpecificClass", () => {
    const mockClassGrades = {
      classId: 1,
      className: "Test Class",
      grades: [{ assignmentId: 1, grade: 95 }],
    }

    it("fetches grades for a student in a specific class", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, grades: [mockClassGrades] },
        status: 200,
      })

      const result =
        await gradebookRepository.getGradesForStudentInSpecificClass(1, 1)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/gradebook/students/1/classes/1",
      )
      expect(result).toEqual(mockClassGrades)
    })

    it("returns null when no grades found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, grades: [] },
        status: 200,
      })

      const result =
        await gradebookRepository.getGradesForStudentInSpecificClass(1, 999)

      expect(result).toBeNull()
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Class not found",
        status: 404,
      })

      await expect(
        gradebookRepository.getGradesForStudentInSpecificClass(1, 999),
      ).rejects.toThrow("Class not found")
    })
  })

  // ============================================================================
  // getClassRankForStudentById Tests
  // ============================================================================

  describe("getClassRankForStudentById", () => {
    it("fetches student rank in a class", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          rank: 3,
          totalStudents: 30,
          percentile: 90,
        },
        status: 200,
      })

      const result = await gradebookRepository.getClassRankForStudentById(1, 1)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/gradebook/students/1/classes/1/rank",
      )
      expect(result).toEqual({
        rank: 3,
        totalStudents: 30,
        percentile: 90,
      })
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Not enrolled in class",
        status: 403,
      })

      await expect(
        gradebookRepository.getClassRankForStudentById(1, 1),
      ).rejects.toThrow("Not enrolled in class")
    })
  })

  // ============================================================================
  // setGradeOverrideForSubmissionById Tests
  // ============================================================================

  describe("setGradeOverrideForSubmissionById", () => {
    it("overrides a grade successfully", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true },
        status: 200,
      })

      await expect(
        gradebookRepository.setGradeOverrideForSubmissionById(
          1,
          95,
          "Great work!",
        ),
      ).resolves.toBeUndefined()

      expect(apiClient.post).toHaveBeenCalledWith(
        "/gradebook/submissions/1/override",
        { grade: 95, feedback: "Great work!" },
      )
    })

    it("overrides a grade without feedback", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true },
        status: 200,
      })

      await gradebookRepository.setGradeOverrideForSubmissionById(1, 80)

      expect(apiClient.post).toHaveBeenCalledWith(
        "/gradebook/submissions/1/override",
        { grade: 80, feedback: undefined },
      )
    })

    it("throws error when override fails", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: false, message: "Grade must be between 0 and 100" },
        status: 400,
      })

      await expect(
        gradebookRepository.setGradeOverrideForSubmissionById(1, 150),
      ).rejects.toThrow("Grade must be between 0 and 100")
    })
  })

  // ============================================================================
  // removeGradeOverrideForSubmissionById Tests
  // ============================================================================

  describe("removeGradeOverrideForSubmissionById", () => {
    it("removes a grade override successfully", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true },
        status: 200,
      })

      await expect(
        gradebookRepository.removeGradeOverrideForSubmissionById(1),
      ).resolves.toBeUndefined()

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/gradebook/submissions/1/override",
      )
    })

    it("throws error when removal fails", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: false, message: "No override exists" },
        status: 404,
      })

      await expect(
        gradebookRepository.removeGradeOverrideForSubmissionById(999),
      ).rejects.toThrow("No override exists")
    })
  })

  // ============================================================================
  // getLatePenaltyConfigurationForAssignmentId Tests
  // ============================================================================

  describe("getLatePenaltyConfigurationForAssignmentId", () => {
    it("fetches late penalty config when enabled", async () => {
      const mockConfig = {
        tiers: [{ id: "tier-1", hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 72,
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, enabled: true, config: mockConfig },
        status: 200,
      })

      const result =
        await gradebookRepository.getLatePenaltyConfigurationForAssignmentId(1)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/gradebook/assignments/1/late-penalty",
      )
      expect(result.enabled).toBe(true)
      expect(result.config).toEqual(mockConfig)
    })

    it("returns null config when disabled", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, enabled: false, config: null },
        status: 200,
      })

      const result =
        await gradebookRepository.getLatePenaltyConfigurationForAssignmentId(1)

      expect(result.enabled).toBe(false)
      expect(result.config).toBeNull()
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Assignment not found",
        status: 404,
      })

      await expect(
        gradebookRepository.getLatePenaltyConfigurationForAssignmentId(999),
      ).rejects.toThrow("Assignment not found")
    })

    it("throws default error when response is unsuccessful", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: false },
        status: 500,
      })

      await expect(
        gradebookRepository.getLatePenaltyConfigurationForAssignmentId(1),
      ).rejects.toThrow("Failed to fetch late penalty config")
    })
  })

  // ============================================================================
  // updateLatePenaltyConfigurationForAssignmentId Tests
  // ============================================================================

  describe("updateLatePenaltyConfigurationForAssignmentId", () => {
    it("updates late penalty config with settings", async () => {
      const config = {
        tiers: [{ id: "tier-1", hoursLate: 0, penaltyPercent: 10 }],
        rejectAfterHours: null,
      }

      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true },
        status: 200,
      })

      await expect(
        gradebookRepository.updateLatePenaltyConfigurationForAssignmentId(
          1,
          true,
          config,
        ),
      ).resolves.toBeUndefined()

      expect(apiClient.put).toHaveBeenCalledWith(
        "/gradebook/assignments/1/late-penalty",
        { enabled: true, config },
      )
    })

    it("disables late penalty", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true },
        status: 200,
      })

      await gradebookRepository.updateLatePenaltyConfigurationForAssignmentId(
        1,
        false,
      )

      expect(apiClient.put).toHaveBeenCalledWith(
        "/gradebook/assignments/1/late-penalty",
        { enabled: false, config: undefined },
      )
    })

    it("throws error when update fails", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: false, message: "Invalid penalty configuration" },
        status: 400,
      })

      await expect(
        gradebookRepository.updateLatePenaltyConfigurationForAssignmentId(
          1,
          true,
        ),
      ).rejects.toThrow("Invalid penalty configuration")
    })
  })
})
