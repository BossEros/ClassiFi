/**
 * TC-024: Remove Grade Override and Recalculate
 *
 * Module: Gradebook
 * Unit: Remove Override
 * Date Tested: 3/28/26
 * Description: Verify that a grade override can be removed.
 * Expected Result: Grade is recalculated from test results.
 * Actual Result: As Expected.
 * Remarks: Passed
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

describe("TC-024: Remove Grade Override and Recalculate", () => {
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
    )
  })

  it("should remove override and recalculate grade from test results", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
    mockTestResultRepo.calculateScore.mockResolvedValue({ passed: 8, total: 10, percentage: 80 })

    await gradebookService.removeOverride(1)

    expect(mockSubmissionRepo.removeGradeOverride).toHaveBeenCalledWith(1)
    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(1, 80)
  })

  it("should set grade to 0 when no test results exist", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
    mockTestResultRepo.calculateScore.mockResolvedValue({ passed: 0, total: 0, percentage: 0 })

    await gradebookService.removeOverride(1)

    expect(mockSubmissionRepo.updateGrade).toHaveBeenCalledWith(1, 0)
  })
})
