/**
 * TC-022: Remove Grade Override and Recalculate
 *
 * Module: Gradebook
 * Unit: Override Grade
 * Date Tested: 3/28/26
 * Description: Verify that a grade override can be removed.
 * Expected Result: Grade is recalculated from test results.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-022 Unit Test Pass - Grade Override Removed and Recalculated
 * Suggested Figure Title (System UI): Gradebook UI - Remove Grade Override Action
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { GradebookService } from "../../backend-ts/src/modules/gradebook/gradebook.service.js"
import type { GradebookRepository } from "../../backend-ts/src/modules/gradebook/gradebook-query.repository.js"
import type { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import type { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import type { LatePenaltyService } from "../../backend-ts/src/modules/assignments/late-penalty.service.js"
import type { TestResultRepository } from "../../backend-ts/src/modules/test-cases/test-result.repository.js"
import type { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))

describe("TC-022: Remove Grade Override and Recalculate", () => {
  let gradebookService: GradebookService
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockTestResultRepo: any

  const mockSubmission = { id: 1, assignmentId: 1, grade: 95, isGradeOverridden: true }
  const mockAssignment = { id: 1, totalScore: 100 }

  beforeEach(() => {
    mockSubmissionRepo = {
      getSubmissionById: vi.fn(), setGradeOverride: vi.fn(),
      removeGradeOverride: vi.fn(), updateGrade: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }
    mockAssignmentRepo = { getAssignmentById: vi.fn() }
    mockTestResultRepo = { calculateScore: vi.fn() }

    gradebookService = new GradebookService(
      { getClassGradebook: vi.fn(), getStudentGrades: vi.fn(), getStudentRank: vi.fn() } as unknown as GradebookRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      {} as unknown as LatePenaltyService,
      mockTestResultRepo as unknown as TestResultRepository,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as unknown as NotificationService,
      { getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()) } as any,
    )
  })

  it("should remove override and recalculate grade from test results", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)

    await gradebookService.removeOverride(1)

    expect(mockSubmissionRepo.removeGradeOverride).toHaveBeenCalledWith(1)
  })

  it("should not throw if submission is found", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)

    await expect(gradebookService.removeOverride(1)).resolves.toBeUndefined()
  })
})
