/**
 * TC-021: Override Grade Successfully
 *
 * Module: Gradebook
 * Unit: Override Grade
 * Date Tested: 3/28/26
 * Description: Verify that a teacher can override a student's grade.
 * Expected Result: Grade is updated and student is notified.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-021 Unit Test Pass - Grade Override Applied Successfully
 * Suggested Figure Title (System UI): Gradebook UI - Override Grade Dialog
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

describe("TC-021: Override Grade Successfully", () => {
  let gradebookService: GradebookService
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockNotificationService: any

  const mockSubmission = { id: 1, assignmentId: 1, studentId: 10, grade: 85, isGradeOverridden: false }
  const mockAssignment = { id: 1, assignmentName: "Test Assignment", totalScore: 100 }

  beforeEach(() => {
    mockSubmissionRepo = {
      getSubmissionById: vi.fn(), setGradeOverride: vi.fn(),
      removeGradeOverride: vi.fn(), updateGrade: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }
    mockAssignmentRepo = { getAssignmentById: vi.fn() }
    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue({}),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    }

    gradebookService = new GradebookService(
      { getClassGradebook: vi.fn(), getStudentGrades: vi.fn(), getStudentRank: vi.fn() } as unknown as GradebookRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      {} as unknown as LatePenaltyService,
      { calculateScore: vi.fn() } as unknown as TestResultRepository,
      mockNotificationService as unknown as NotificationService,
      { getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()) } as any,
    )
  })

  it("should override grade and notify student", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

    await gradebookService.overrideGrade(1, 95, "Excellent work!")

    expect(mockSubmissionRepo.setGradeOverride).toHaveBeenCalledWith(1, 95, "Excellent work!")
    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      10, "SUBMISSION_GRADED",
      expect.objectContaining({ submissionId: 1, assignmentId: 1, grade: 95, maxGrade: 100 }),
    )
    expect(mockNotificationService.sendEmailNotificationIfEnabled).toHaveBeenCalledWith(
      10, "SUBMISSION_GRADED",
      expect.objectContaining({ submissionId: 1, grade: 95 }),
    )
  })

  it("should throw error if grade exceeds totalScore", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

    await expect(gradebookService.overrideGrade(1, 150, null)).rejects.toThrow("Grade must be between 0 and 100")
  })

  it("should throw error if grade is below 0", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)

    await expect(gradebookService.overrideGrade(1, -10, null)).rejects.toThrow("Grade must be between 0 and 100")
  })
})
