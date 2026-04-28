/**
 * IT-028: Similarity Penalty Uses Highest Qualifying Match Per Submission
 *
 * Module: Similarity Detection
 * Unit: Apply similarity penalty
 * Date Tested: 4/16/26
 * Description: Verify that only the highest qualifying similarity match affects each latest submission.
 * Expected Result: The strongest pair determines the deduction while weaker pairs do not stack.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-028 Integration Test Pass - Similarity Penalty Uses Highest Qualifying Match
 * Suggested Figure Title (System UI): Grade Breakdown UI - Similarity Deduction Showing Only The Highest Matching Pair
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { SimilarityPenaltyService } from "../../backend-ts/src/modules/plagiarism/similarity-penalty.service.js"
import type { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import type { SimilarityRepository } from "../../backend-ts/src/modules/plagiarism/similarity.repository.js"
import type { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import type { ClassRepository } from "../../backend-ts/src/modules/classes/class.repository.js"
import type { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import type { PlagiarismPersistenceService } from "../../backend-ts/src/modules/plagiarism/plagiarism-persistence.service.js"
import type { TestResultRepository } from "../../backend-ts/src/modules/test-cases/test-result.repository.js"
import type { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"

describe("IT-028: Similarity Penalty Uses Highest Qualifying Match Per Submission", () => {
  let similarityPenaltyService: SimilarityPenaltyService
  let mockAssignmentRepo: { getAssignmentById: ReturnType<typeof vi.fn> }
  let mockSimilarityRepo: { getResultsByReport: ReturnType<typeof vi.fn> }
  let mockSubmissionRepo: {
    getSubmissionsByAssignment: ReturnType<typeof vi.fn>
    updateGrade: ReturnType<typeof vi.fn>
    updateSimilarityPenalty: ReturnType<typeof vi.fn>
  }
  let mockTestResultRepo: { calculateScore: ReturnType<typeof vi.fn> }

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
      updateSimilarityPenalty: vi.fn().mockResolvedValue(undefined),
    }
    mockTestResultRepo = {
      calculateScore: vi.fn(),
    }

    similarityPenaltyService = new SimilarityPenaltyService(
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockSimilarityRepo as unknown as SimilarityRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      { getClassById: vi.fn() } as unknown as ClassRepository,
      { getUserById: vi.fn() } as unknown as UserRepository,
      { getReusableAssignmentReportId: vi.fn() } as unknown as PlagiarismPersistenceService,
      mockTestResultRepo as unknown as TestResultRepository,
      {
        createNotification: vi.fn().mockResolvedValue(null),
        sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      } as unknown as NotificationService,
    )
  })

  it("should apply only the strongest qualifying pair to the affected submission", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      enableSimilarityPenalty: true,
      totalScore: 100,
      similarityPenaltyConfig: {
        warningThreshold: 0.75,
        deductionBands: [
          { id: "b1", minHybridScore: 0.85, penaltyPercent: 5 },
          { id: "b2", minHybridScore: 0.90, penaltyPercent: 10 },
          { id: "b3", minHybridScore: 0.95, penaltyPercent: 20 },
        ],
        maxPenaltyPercent: 20,
        applyHighestPairOnly: true,
      },
    })
    mockSubmissionRepo.getSubmissionsByAssignment.mockResolvedValue([
      { id: 31, grade: null, penaltyApplied: 10, submittedAt: new Date("2026-01-01T10:00:00Z") },
      { id: 32, grade: null, penaltyApplied: 0, submittedAt: new Date("2026-01-01T11:00:00Z") },
      { id: 33, grade: null, penaltyApplied: 0, submittedAt: new Date("2026-01-01T12:00:00Z") },
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

    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(31, 80)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(32, 85)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(33, 70)
  })
})

