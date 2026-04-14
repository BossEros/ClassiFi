/**
 * TC-014: Grade Override Succeeds
 *
 * Module: Gradebook
 * Unit: Override grade
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can override a grade.
 * Expected Result: The grade override is saved successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-014 Unit Test Pass - Grade Override Succeeds
 * Suggested Figure Title (System UI): Gradebook UI - Override Grade Dialog with Valid Input
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { GradebookService } from "../../backend-ts/src/modules/gradebook/gradebook.service.js"
import type { GradebookRepository } from "../../backend-ts/src/modules/gradebook/gradebook-query.repository.js"
import type { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import type { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import type { LatePenaltyService } from "../../backend-ts/src/modules/assignments/late-penalty.service.js"
import type { TestResultRepository } from "../../backend-ts/src/modules/test-cases/test-result.repository.js"
import type { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))

describe("TC-014: Grade Override Succeeds", () => {
  let gradebookService: GradebookService
  let mockSubmissionRepo: {
    getSubmissionById: ReturnType<typeof vi.fn>
    setGradeOverride: ReturnType<typeof vi.fn>
    removeGradeOverride: ReturnType<typeof vi.fn>
    updateGrade: ReturnType<typeof vi.fn>
    withContext: ReturnType<typeof vi.fn>
  }
  let mockAssignmentRepo: {
    getAssignmentById: ReturnType<typeof vi.fn>
  }
  let mockNotificationService: {
    createNotification: ReturnType<typeof vi.fn>
    sendEmailNotificationIfEnabled: ReturnType<typeof vi.fn>
    withContext: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
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

    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue({}),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    }

    gradebookService = new GradebookService(
      {
        getClassGradebook: vi.fn(),
        getStudentGrades: vi.fn(),
        getStudentRank: vi.fn(),
      } as unknown as GradebookRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      {} as unknown as LatePenaltyService,
      { calculateScore: vi.fn() } as unknown as TestResultRepository,
      mockNotificationService as unknown as NotificationService,
      { getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()) } as any,
    )
  })

  it("should save the new override grade", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue({
      id: 1,
      assignmentId: 1,
      studentId: 10,
      grade: 85,
      isGradeOverridden: false,
    })

    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      assignmentName: "Test Assignment",
      totalScore: 100,
    })

    await gradebookService.overrideGrade(1, 95, "Excellent work!")

    expect(mockSubmissionRepo.setGradeOverride).toHaveBeenCalledWith(
      1,
      95,
      "Excellent work!",
    )
  })
})
