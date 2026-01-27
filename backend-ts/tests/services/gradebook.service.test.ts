import { describe, it, expect, beforeEach, vi } from "vitest"
import { GradebookService } from "../../src/services/gradebook.service.js"
import type { GradebookRepository } from "../../src/repositories/gradebook.repository.js"
import type { SubmissionRepository } from "../../src/repositories/submission.repository.js"
import type { AssignmentRepository } from "../../src/repositories/assignment.repository.js"
import type { LatePenaltyService } from "../../src/services/latePenalty.service.js"
import type { TestResultRepository } from "../../src/repositories/testResult.repository.js"

describe("GradebookService", () => {
  let gradebookService: GradebookService
  let mockGradebookRepo: any
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockLatePenaltyService: any
  let mockTestResultRepo: any

  beforeEach(() => {
    mockGradebookRepo = {
      getClassGradebook: vi.fn(),
      getStudentGrades: vi.fn(),
      getClassStatistics: vi.fn(),
      getStudentRank: vi.fn(),
    }

    mockSubmissionRepo = {
      getSubmissionById: vi.fn(),
      setGradeOverride: vi.fn(),
      removeGradeOverride: vi.fn(),
      updateGrade: vi.fn(),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
    }

    mockLatePenaltyService = {
      calculatePenalty: vi.fn(),
      getAssignmentConfig: vi.fn(),
    }

    mockTestResultRepo = {
      calculateScore: vi.fn(),
    }

    gradebookService = new GradebookService(
      mockGradebookRepo as GradebookRepository,
      mockSubmissionRepo as SubmissionRepository,
      mockAssignmentRepo as AssignmentRepository,
      mockLatePenaltyService as LatePenaltyService,
      mockTestResultRepo as TestResultRepository,
    )
  })

  // ============================================
  // getClassGradebook Tests
  // ============================================
  describe("getClassGradebook", () => {
    it("should return gradebook from repository", async () => {
      const mockGradebook = {
        assignments: [
          {
            id: 1,
            name: "Assignment 1",
            totalScore: 100,
            deadline: new Date(),
          },
        ],
        students: [
          {
            id: 1,
            name: "Student 1",
            email: "student1@test.com",
            grades: [{ assignmentId: 1, grade: 85, isOverridden: false }],
          },
        ],
      }

      mockGradebookRepo.getClassGradebook.mockResolvedValue(mockGradebook)

      const result = await gradebookService.getClassGradebook(1)

      expect(result).toEqual(mockGradebook)
      expect(mockGradebookRepo.getClassGradebook).toHaveBeenCalledWith(1)
    })
  })

  // ============================================
  // getStudentGrades Tests
  // ============================================
  describe("getStudentGrades", () => {
    it("should return student grades from repository", async () => {
      const mockGrades = [
        {
          classId: 1,
          className: "Test Class",
          teacherName: "Teacher",
          assignments: [{ id: 1, name: "Assignment 1", grade: 90 }],
        },
      ]

      mockGradebookRepo.getStudentGrades.mockResolvedValue(mockGrades)

      const result = await gradebookService.getStudentGrades(1)

      expect(result).toEqual(mockGrades)
      expect(mockGradebookRepo.getStudentGrades).toHaveBeenCalledWith(
        1,
        undefined,
      )
    })

    it("should filter by classId when provided", async () => {
      mockGradebookRepo.getStudentGrades.mockResolvedValue([])

      await gradebookService.getStudentGrades(1, 5)

      expect(mockGradebookRepo.getStudentGrades).toHaveBeenCalledWith(1, 5)
    })
  })

  // ============================================
  // getClassStatistics Tests
  // ============================================
  describe("getClassStatistics", () => {
    it("should return class statistics from repository", async () => {
      const mockStats = {
        classAverage: 85.5,
        submissionRate: 90,
        totalStudents: 30,
        totalAssignments: 5,
      }

      mockGradebookRepo.getClassStatistics.mockResolvedValue(mockStats)

      const result = await gradebookService.getClassStatistics(1)

      expect(result).toEqual(mockStats)
      expect(mockGradebookRepo.getClassStatistics).toHaveBeenCalledWith(1)
    })
  })

  // ============================================
  // getStudentRank Tests
  // ============================================
  describe("getStudentRank", () => {
    it("should return student rank from repository", async () => {
      const mockRank = { rank: 5, totalStudents: 30, percentile: 17 }

      mockGradebookRepo.getStudentRank.mockResolvedValue(mockRank)

      const result = await gradebookService.getStudentRank(1, 1)

      expect(result).toEqual(mockRank)
      expect(mockGradebookRepo.getStudentRank).toHaveBeenCalledWith(1, 1)
    })
  })

  // ============================================
  // overrideGrade Tests
  // ============================================
  describe("overrideGrade", () => {
    const mockSubmission = {
      id: 1,
      assignmentId: 1,
      grade: 85,
      isGradeOverridden: false,
    }

    const mockAssignment = {
      id: 1,
      totalScore: 100,
    }

    it("should override grade successfully", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

      await gradebookService.overrideGrade(1, 95, "Excellent work!")

      expect(mockSubmissionRepo.setGradeOverride).toHaveBeenCalledWith(
        1,
        95,
        "Excellent work!",
      )
    })

    it("should throw error if submission not found", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(null)

      await expect(
        gradebookService.overrideGrade(999, 90, null),
      ).rejects.toThrow("Submission not found")
    })

    it("should throw error if assignment not found", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(null)

      await expect(gradebookService.overrideGrade(1, 90, null)).rejects.toThrow(
        "Assignment not found",
      )
    })

    it("should throw error if grade is below 0", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

      await expect(
        gradebookService.overrideGrade(1, -10, null),
      ).rejects.toThrow("Grade must be between 0 and 100")
    })

    it("should throw error if grade exceeds totalScore", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

      await expect(
        gradebookService.overrideGrade(1, 150, null),
      ).rejects.toThrow("Grade must be between 0 and 100")
    })

    it("should allow grade at boundary (0)", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

      await gradebookService.overrideGrade(1, 0, "Incomplete")

      expect(mockSubmissionRepo.setGradeOverride).toHaveBeenCalledWith(
        1,
        0,
        "Incomplete",
      )
    })

    it("should allow grade at boundary (totalScore)", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

      await gradebookService.overrideGrade(1, 100, "Perfect!")

      expect(mockSubmissionRepo.setGradeOverride).toHaveBeenCalledWith(
        1,
        100,
        "Perfect!",
      )
    })
  })

  // ============================================
  // removeOverride Tests
  // ============================================
  describe("removeOverride", () => {
    const mockSubmission = {
      id: 1,
      assignmentId: 1,
      grade: 95,
      isGradeOverridden: true,
    }

    const mockAssignment = {
      id: 1,
      totalScore: 100,
    }

    it("should remove override and recalculate grade", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockTestResultRepo.calculateScore.mockResolvedValue({
        passed: 8,
        total: 10,
        percentage: 80,
      })

      await gradebookService.removeOverride(1)

      expect(mockSubmissionRepo.removeGradeOverride).toHaveBeenCalledWith(1)
      expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(1, 80)
    })

    it("should throw error if submission not found", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(null)

      await expect(gradebookService.removeOverride(999)).rejects.toThrow(
        "Submission not found",
      )
    })

    it("should throw error if assignment not found", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(null)
      mockTestResultRepo.calculateScore.mockResolvedValue({
        passed: 5,
        total: 10,
      })

      await expect(gradebookService.removeOverride(1)).rejects.toThrow(
        "Assignment not found",
      )
    })

    it("should set grade to 0 when no test results", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockTestResultRepo.calculateScore.mockResolvedValue({
        passed: 0,
        total: 0,
        percentage: 0,
      })

      await gradebookService.removeOverride(1)

      expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(1, 0)
    })
  })

  // ============================================
  // exportGradebookCSV Tests
  // ============================================
  describe("exportGradebookCSV", () => {
    it("should generate CSV with headers and data", async () => {
      const mockGradebook = {
        assignments: [
          {
            id: 1,
            name: "Assignment 1",
            totalScore: 100,
            deadline: new Date(),
          },
          { id: 2, name: "Assignment 2", totalScore: 50, deadline: new Date() },
        ],
        students: [
          {
            id: 1,
            name: "John Doe",
            email: "john@test.com",
            grades: [
              {
                assignmentId: 1,
                grade: 85,
                isOverridden: false,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                grade: 40,
                isOverridden: false,
                submittedAt: null,
              },
            ],
          },
          {
            id: 2,
            name: "Jane Smith",
            email: "jane@test.com",
            grades: [
              {
                assignmentId: 1,
                grade: 92,
                isOverridden: true,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                grade: null,
                isOverridden: false,
                submittedAt: null,
              },
            ],
          },
        ],
      }

      mockGradebookRepo.getClassGradebook.mockResolvedValue(mockGradebook)

      const csv = await gradebookService.exportGradebookCSV(1)

      expect(csv).toContain("Student Name")
      expect(csv).toContain("Email")
      expect(csv).toContain("Assignment 1 (/100)")
      expect(csv).toContain("Assignment 2 (/50)")
      expect(csv).toContain("Average")
      expect(csv).toContain("John Doe")
      expect(csv).toContain("john@test.com")
      expect(csv).toContain("85")
      expect(csv).toContain("jane@test.com")
    })

    it("should handle empty gradebook", async () => {
      mockGradebookRepo.getClassGradebook.mockResolvedValue({
        assignments: [],
        students: [],
      })

      const csv = await gradebookService.exportGradebookCSV(1)

      expect(csv).toContain("Student Name")
      expect(csv).toContain("Email")
      expect(csv).toContain("Average")
    })
  })
})
