/**
 * IT-029: Similarity Deduction Is Skipped When Assignment Penalty Is Disabled
 *
 * Module: Similarity Detection
 * Unit: Apply similarity penalty
 * Date Tested: 4/16/26
 * Description: Verify that similarity deductions are skipped when the assignment disables the penalty feature.
 * Expected Result: The automatic grade is restored without querying similarity results.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-029 Integration Test Pass - Similarity Deduction Is Skipped When Disabled
 * Suggested Figure Title (System UI): Assignment Detail UI - Similarity Policy Disabled And No Deduction Shown In Grade Breakdown
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

describe("IT-029: Similarity Deduction Is Skipped When Assignment Penalty Is Disabled", () => {
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

  it("should restore the automatic grade without reading similarity pairs", async () => {
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
  })
})

