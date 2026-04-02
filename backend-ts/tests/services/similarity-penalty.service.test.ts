import { beforeEach, describe, expect, it, vi } from "vitest"
import { SimilarityPenaltyService } from "../../src/modules/plagiarism/similarity-penalty.service.js"
import type { AssignmentRepository } from "../../src/modules/assignments/assignment.repository.js"
import type { SimilarityRepository } from "../../src/modules/plagiarism/similarity.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { PlagiarismPersistenceService } from "../../src/modules/plagiarism/plagiarism-persistence.service.js"
import type { TestResultRepository } from "../../src/modules/test-cases/test-result.repository.js"
import type { NotificationService } from "../../src/modules/notifications/notification.service.js"

describe("SimilarityPenaltyService", () => {
  let similarityPenaltyService: SimilarityPenaltyService
  let mockAssignmentRepo: { getAssignmentById: ReturnType<typeof vi.fn> }
  let mockSimilarityRepo: { getResultsByReport: ReturnType<typeof vi.fn> }
  let mockSubmissionRepo: {
    getSubmissionsByAssignment: ReturnType<typeof vi.fn>
    updateGrade: ReturnType<typeof vi.fn>
  }
  let mockClassRepo: Record<string, never>
  let mockUserRepo: Record<string, never>
  let mockPersistenceService: {
    getReusableAssignmentReportId: ReturnType<typeof vi.fn>
  }
  let mockTestResultRepo: { calculateScore: ReturnType<typeof vi.fn> }
  let mockNotificationService: {
    createNotification: ReturnType<typeof vi.fn>
    sendEmailNotificationIfEnabled: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
    }

    mockSimilarityRepo = {
      getResultsByReport: vi.fn(),
    }

    mockSubmissionRepo = {
      getSubmissionsByAssignment: vi.fn(),
      updateGrade: vi.fn().mockResolvedValue(undefined),
    }

    mockPersistenceService = {
      getReusableAssignmentReportId: vi.fn(),
    }

    mockClassRepo = {}
    mockUserRepo = {}

    mockTestResultRepo = {
      calculateScore: vi.fn(),
    }

    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue(null),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
    }

    similarityPenaltyService = new SimilarityPenaltyService(
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockSimilarityRepo as unknown as SimilarityRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockClassRepo as unknown as ClassRepository,
      mockUserRepo as unknown as UserRepository,
      mockPersistenceService as unknown as PlagiarismPersistenceService,
      mockTestResultRepo as unknown as TestResultRepository,
      mockNotificationService as unknown as NotificationService,
    )
  })

  it("keeps warning-only matches from changing grades below the first deduction band", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      enableSimilarityPenalty: true,
      totalScore: 100,
    })
    mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([
      {
        id: 11,
        grade: null,
        penaltyApplied: 0,
      },
      {
        id: 12,
        grade: null,
        penaltyApplied: 0,
      },
    ])
    mockSimilarityRepo.getResultsByReport.mockResolvedValue([
      {
        submission1Id: 11,
        submission2Id: 12,
        hybridScore: "0.840000",
        leftCovered: 1,
        rightCovered: 1,
        leftTotal: 100,
        rightTotal: 100,
        longestFragment: 1,
      },
    ])
    mockTestResultRepo.calculateScore.mockResolvedValue({ passed: 8, total: 10 })

    await similarityPenaltyService.applyAssignmentPenaltyFromReport(1, 99)

    expect(mockSubmissionRepo.updateGrade).toHaveBeenNthCalledWith(1, 11, 80)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenNthCalledWith(2, 12, 80)
    expect(mockNotificationService.createNotification).not.toHaveBeenCalled()
  })

  it("applies deductions using the hybrid-score bands only", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      enableSimilarityPenalty: true,
      totalScore: 100,
    })
    mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([
      { id: 21, grade: null, penaltyApplied: 0 },
      { id: 22, grade: null, penaltyApplied: 0 },
      { id: 23, grade: null, penaltyApplied: 0 },
      { id: 24, grade: null, penaltyApplied: 0 },
    ])
    mockSimilarityRepo.getResultsByReport.mockResolvedValue([
      {
        submission1Id: 21,
        submission2Id: 22,
        hybridScore: "0.850000",
        leftCovered: 0,
        rightCovered: 0,
        leftTotal: 0,
        rightTotal: 0,
        longestFragment: 0,
      },
      {
        submission1Id: 22,
        submission2Id: 23,
        hybridScore: "0.900000",
        leftCovered: 0,
        rightCovered: 0,
        leftTotal: 0,
        rightTotal: 0,
        longestFragment: 0,
      },
      {
        submission1Id: 23,
        submission2Id: 24,
        hybridScore: "0.950000",
        leftCovered: 0,
        rightCovered: 0,
        leftTotal: 0,
        rightTotal: 0,
        longestFragment: 0,
      },
    ])
    mockTestResultRepo.calculateScore.mockResolvedValue({ passed: 10, total: 10 })

    await similarityPenaltyService.applyAssignmentPenaltyFromReport(1, 99)

    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(21, 95)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(22, 90)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(23, 80)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(24, 80)
    expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(4)
  })

  it("keeps only the highest qualifying pair for each latest submission", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      enableSimilarityPenalty: true,
      totalScore: 100,
    })
    mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([
      { id: 31, grade: null, penaltyApplied: 10 },
      { id: 32, grade: null, penaltyApplied: 0 },
      { id: 33, grade: null, penaltyApplied: 0 },
    ])
    mockSimilarityRepo.getResultsByReport.mockResolvedValue([
      {
        submission1Id: 31,
        submission2Id: 32,
        hybridScore: "0.860000",
        leftCovered: 0,
        rightCovered: 0,
        leftTotal: 0,
        rightTotal: 0,
        longestFragment: 0,
      },
      {
        submission1Id: 31,
        submission2Id: 33,
        hybridScore: "0.960000",
        leftCovered: 0,
        rightCovered: 0,
        leftTotal: 0,
        rightTotal: 0,
        longestFragment: 0,
      },
    ])
    mockTestResultRepo.calculateScore.mockResolvedValue({ passed: 9, total: 10 })

    await similarityPenaltyService.applyAssignmentPenaltyFromReport(1, 99)

    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(31, 65)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(32, 86)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(33, 72)
    expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(3)
  })

  it("notifies the student when similarity deduction changes the visible score", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      assignmentName: "Homework 1",
      enableSimilarityPenalty: true,
      totalScore: 100,
    })
    mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([
      {
        id: 51,
        assignmentId: 1,
        studentId: 501,
        grade: 80,
        penaltyApplied: 0,
        isGradeOverridden: false,
      },
      {
        id: 52,
        assignmentId: 1,
        studentId: 502,
        grade: 64,
        penaltyApplied: 0,
        isGradeOverridden: false,
      },
      {
        id: 53,
        assignmentId: 1,
        studentId: 503,
        grade: 90,
        penaltyApplied: 0,
        isGradeOverridden: true,
      },
    ])
    mockSimilarityRepo.getResultsByReport.mockResolvedValue([
      {
        submission1Id: 51,
        submission2Id: 52,
        hybridScore: "1.000000",
        leftCovered: 0,
        rightCovered: 0,
        leftTotal: 0,
        rightTotal: 0,
        longestFragment: 0,
      },
      {
        submission1Id: 51,
        submission2Id: 53,
        hybridScore: "1.000000",
        leftCovered: 0,
        rightCovered: 0,
        leftTotal: 0,
        rightTotal: 0,
        longestFragment: 0,
      },
    ])
    mockTestResultRepo.calculateScore
      .mockResolvedValueOnce({ passed: 4, total: 5 })
      .mockResolvedValueOnce({ passed: 4, total: 5 })
      .mockResolvedValueOnce({ passed: 4, total: 5 })

    await similarityPenaltyService.applyAssignmentPenaltyFromReport(1, 99)

    expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1)
    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      501,
      "SUBMISSION_GRADED",
      expect.objectContaining({
        reason: "similarity_deduction",
        previousGrade: 80,
        grade: 64,
        deductedPoints: 16,
      }),
    )
    expect(
      mockNotificationService.sendEmailNotificationIfEnabled,
    ).toHaveBeenCalledTimes(1)
  })

  it("restores automatic grades when similarity deduction is disabled", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      enableSimilarityPenalty: false,
      totalScore: 100,
    })
    mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([
      { id: 41, grade: null, penaltyApplied: 0 },
    ])
    mockTestResultRepo.calculateScore.mockResolvedValue({ passed: 7, total: 10 })

    await similarityPenaltyService.applyAssignmentPenaltyFromReport(1, 99)

    expect(mockSimilarityRepo.getResultsByReport).not.toHaveBeenCalled()
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(41, 70)
    expect(mockNotificationService.createNotification).not.toHaveBeenCalled()
  })
})
