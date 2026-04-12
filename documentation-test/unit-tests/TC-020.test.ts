/**
 * TC-020: Get Class Gradebook
 *
 * Module: Gradebook
 * Unit: View and Export Gradebook
 * Date Tested: 3/28/26
 * Description: Verify that the class gradebook is retrieved correctly.
 * Expected Result: Assignments and student grades are returned.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-020 Unit Test Pass - Gradebook Data Retrieved Successfully
 * Suggested Figure Title (System UI): Gradebook UI - Class Gradebook View
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

describe("TC-020: Get Class Gradebook", () => {
  let gradebookService: GradebookService
  let mockGradebookRepo: any

  beforeEach(() => {
    mockGradebookRepo = { getClassGradebook: vi.fn(), getStudentGrades: vi.fn(), getStudentRank: vi.fn() }

    gradebookService = new GradebookService(
      mockGradebookRepo as GradebookRepository,
      { getSubmissionById: vi.fn(), setGradeOverride: vi.fn(), removeGradeOverride: vi.fn(), updateGrade: vi.fn(), withContext: vi.fn().mockReturnThis() } as unknown as SubmissionRepository,
      { getAssignmentById: vi.fn() } as unknown as AssignmentRepository,
      {} as unknown as LatePenaltyService,
      { calculateScore: vi.fn() } as unknown as TestResultRepository,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined), withContext: vi.fn().mockReturnThis() } as unknown as NotificationService,
      { getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()) } as any,
    )
  })

  it("should return gradebook with assignments and student grades", async () => {
    const mockGradebook = {
      assignments: [{ id: 1, name: "Assignment 1", totalScore: 100, deadline: new Date() }],
      students: [{
        id: 1, name: "Student 1", email: "student1@test.com",
        grades: [{ assignmentId: 1, grade: 85, isOverridden: false }],
      }],
    }

    mockGradebookRepo.getClassGradebook.mockResolvedValue(mockGradebook)

    const result = await gradebookService.getClassGradebook(1)

    expect(result).toEqual(mockGradebook)
    expect(mockGradebookRepo.getClassGradebook).toHaveBeenCalledWith(1)
  })
})
