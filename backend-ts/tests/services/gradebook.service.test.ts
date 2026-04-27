import { describe, it, expect, beforeEach, vi } from "vitest"
import { GradebookService } from "../../src/modules/gradebook/gradebook.service.js"
import type { GradebookRepository } from "../../src/modules/gradebook/gradebook-query.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import type { AssignmentRepository } from "../../src/modules/assignments/assignment.repository.js"
import type { LatePenaltyService } from "../../src/modules/assignments/late-penalty.service.js"
import type { TestResultRepository } from "../../src/modules/test-cases/test-result.repository.js"
import type { NotificationService } from "../../src/modules/notifications/notification.service.js"
import type { PlagiarismAutoAnalysisService } from "../../src/modules/plagiarism/plagiarism-auto-analysis.service.js"

vi.mock("../../src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))

describe("GradebookService", () => {
  let gradebookService: GradebookService
  let mockGradebookRepo: any
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockLatePenaltyService: any
  let mockTestResultRepo: any
  let mockNotificationService: any
  let mockSimilarityRepo: any

  beforeEach(() => {
    mockGradebookRepo = {
      getClassGradebook: vi.fn(),
      getStudentGrades: vi.fn(),
      getStudentRank: vi.fn(),
    }

    mockSubmissionRepo = {
      getSubmissionById: vi.fn(),
      setGradeOverride: vi.fn(),
      removeGradeOverride: vi.fn(),
      updateGrade: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
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

    mockNotificationService = {
      createNotification: vi.fn(),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    }

    mockSimilarityRepo = {
      getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()),
    }

    const mockPlagiarismAutoAnalysisService = {
      scheduleFromSubmission: vi.fn(),
    }

    gradebookService = new GradebookService(
      mockGradebookRepo as GradebookRepository,
      mockSubmissionRepo as SubmissionRepository,
      mockAssignmentRepo as AssignmentRepository,
      mockLatePenaltyService as LatePenaltyService,
      mockTestResultRepo as TestResultRepository,
      mockNotificationService as NotificationService,
      mockSimilarityRepo,
      mockPlagiarismAutoAnalysisService as PlagiarismAutoAnalysisService,
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
      studentId: 10,
      grade: 85,
      isGradeOverridden: false,
    }

    const mockAssignment = {
      id: 1,
      assignmentName: "Test Assignment",
      totalScore: 100,
    }

    it("should override grade successfully", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockNotificationService.createNotification.mockResolvedValue({})

      await gradebookService.overrideGrade(1, 95, "Excellent work!")

      expect(mockSubmissionRepo.setGradeOverride).toHaveBeenCalledWith(
        1,
        95,
        "Excellent work!",
      )
    })

    it("should create notification for student when grade is overridden", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockNotificationService.createNotification.mockResolvedValue({})

      await gradebookService.overrideGrade(1, 95, "Excellent work!")

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        10,
        "SUBMISSION_GRADED",
        expect.objectContaining({
          submissionId: 1,
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          grade: 95,
          maxGrade: 100,
          submissionUrl: expect.stringContaining("/dashboard/assignments/1"),
          reason: "grade_override",
          previousGrade: 85,
        }),
      )
      expect(
        mockNotificationService.sendEmailNotificationIfEnabled,
      ).toHaveBeenCalledWith(
        10,
        "SUBMISSION_GRADED",
        expect.objectContaining({
          submissionId: 1,
          assignmentId: 1,
          grade: 95,
          reason: "grade_override",
          previousGrade: 85,
        }),
      )
    })

    it("should rollback when notification persistence fails", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockNotificationService.createNotification.mockRejectedValue(
        new Error("Notification service error"),
      )

      await expect(
        gradebookService.overrideGrade(1, 95, "Excellent work!"),
      ).rejects.toThrow("Notification service error")
    })

    it("should not fail when post-commit notification email delivery fails", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockNotificationService.createNotification.mockResolvedValue({})
      mockNotificationService.sendEmailNotificationIfEnabled.mockRejectedValue(
        new Error("SMTP unavailable"),
      )

      await expect(
        gradebookService.overrideGrade(1, 95, "Excellent work!"),
      ).resolves.not.toThrow()
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
      ).rejects.toThrow("Grade must be a whole number between 0 and 100")
    })

    it("should throw error if grade exceeds totalScore", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

      await expect(
        gradebookService.overrideGrade(1, 150, null),
      ).rejects.toThrow("Grade must be a whole number between 0 and 100")
    })

    it("should allow grade at boundary (0)", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockNotificationService.createNotification.mockResolvedValue({})

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
      mockNotificationService.createNotification.mockResolvedValue({})

      await gradebookService.overrideGrade(1, 100, "Perfect!")

      expect(mockSubmissionRepo.setGradeOverride).toHaveBeenCalledWith(
        1,
        100,
        "Perfect!",
      )
    })

    it("falls back gracefully when overriding an ungraded submission", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue({
        ...mockSubmission,
        grade: null,
      })
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockNotificationService.createNotification.mockResolvedValue({})

      await gradebookService.overrideGrade(1, 88, "Manual review")

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        10,
        "SUBMISSION_GRADED",
        expect.objectContaining({
          reason: "grade_override",
          previousGrade: undefined,
          grade: 88,
        }),
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
      overrideGrade: 95,
      isGradeOverridden: true,
    }

    it("should remove override without rewriting the raw grade", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)

      await gradebookService.removeOverride(1)

      expect(mockSubmissionRepo.removeGradeOverride).toHaveBeenCalledWith(1)
      expect(mockSubmissionRepo.updateGrade).not.toHaveBeenCalled()
    })

    it("should throw error if submission not found", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(null)

      await expect(gradebookService.removeOverride(999)).rejects.toThrow(
        "Submission not found",
      )
    })

    it("should complete even when no test results are involved", async () => {
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)

      await gradebookService.removeOverride(1)

      expect(mockSubmissionRepo.removeGradeOverride).toHaveBeenCalledWith(1)
      expect(mockSubmissionRepo.updateGrade).not.toHaveBeenCalled()
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
            isActive: true,
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
            isActive: false,
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
      expect(csv).toContain("Status")
      expect(csv).toContain("Assignment 1 (/100)")
      expect(csv).toContain("Assignment 2 (/50)")
      expect(csv).toContain("Average")
      expect(csv).toContain("John Doe")
      expect(csv).toContain("john@test.com")
      expect(csv).toContain("Active")
      expect(csv).toContain("85")
      expect(csv).toContain("jane@test.com")
      expect(csv).toContain("Inactive")
    })

    it("should handle empty gradebook", async () => {
      mockGradebookRepo.getClassGradebook.mockResolvedValue({
        assignments: [],
        students: [],
      })

      const csv = await gradebookService.exportGradebookCSV(1)

      expect(csv).toContain("Student Name")
      expect(csv).toContain("Email")
      expect(csv).toContain("Status")
      expect(csv).toContain("Average")
    })

    it("counts no-submission assignments as zero while excluding pending-review submissions from CSV averages", async () => {
      mockGradebookRepo.getClassGradebook.mockResolvedValue({
        assignments: [
          {
            id: 1,
            name: "Assignment 1",
            totalScore: 100,
            deadline: new Date(),
          },
          {
            id: 2,
            name: "Assignment 2",
            totalScore: 67,
            deadline: new Date(),
          },
        ],
        students: [
          {
            id: 1,
            name: "Missing Counts As Zero",
            email: "missing@test.com",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 100,
                isOverridden: false,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                submissionId: null,
                grade: null,
                isOverridden: false,
                submittedAt: null,
              },
            ],
          },
          {
            id: 2,
            name: "Pending Review Excluded",
            email: "pending@test.com",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 21,
                grade: 100,
                isOverridden: false,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                submissionId: 22,
                grade: null,
                isOverridden: false,
                submittedAt: null,
              },
            ],
          },
        ],
      })

      const csv = await gradebookService.exportGradebookCSV(1)

      expect(csv).toContain('"Missing Counts As Zero","missing@test.com","Active","100","","60"')
      expect(csv).toContain('"Pending Review Excluded","pending@test.com","Active","100","","100"')
    })

    it("uses a points-weighted total when assignment scores differ", async () => {
      mockGradebookRepo.getClassGradebook.mockResolvedValue({
        assignments: [
          {
            id: 1,
            name: "Assignment 1",
            totalScore: 100,
            deadline: new Date(),
          },
          {
            id: 2,
            name: "Assignment 2",
            totalScore: 100,
            deadline: new Date(),
          },
          {
            id: 3,
            name: "Assignment 3",
            totalScore: 100,
            deadline: new Date(),
          },
          {
            id: 4,
            name: "Assignment 4",
            totalScore: 67,
            deadline: new Date(),
          },
          {
            id: 5,
            name: "Assignment 5",
            totalScore: 100,
            deadline: new Date(),
          },
        ],
        students: [
          {
            id: 1,
            name: "Weighted Example",
            email: "weighted@test.com",
            isActive: true,
            grades: [
              {
                assignmentId: 1,
                submissionId: 11,
                grade: 100,
                isOverridden: false,
                submittedAt: null,
              },
              {
                assignmentId: 2,
                submissionId: 12,
                grade: 100,
                isOverridden: false,
                submittedAt: null,
              },
              {
                assignmentId: 3,
                submissionId: 13,
                grade: 100,
                isOverridden: false,
                submittedAt: null,
              },
              {
                assignmentId: 4,
                submissionId: null,
                grade: null,
                isOverridden: false,
                submittedAt: null,
              },
              {
                assignmentId: 5,
                submissionId: null,
                grade: null,
                isOverridden: false,
                submittedAt: null,
              },
            ],
          },
        ],
      })

      const csv = await gradebookService.exportGradebookCSV(1)

      expect(csv).toContain('"Weighted Example","weighted@test.com","Active","100","100","100","","","64"')
    })
  })
})
