/**
 * TC-038: View Submission History
 *
 * Module: Code Submission
 * Unit: View Submission History
 * Date Tested: 4/11/26
 * Description: Verify that a student's past submissions for an assignment are retrieved correctly.
 * Expected Result: A list of the student's submissions for the assignment is returned.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-038 Unit Test Pass - Submission History Retrieved Successfully
 * Suggested Figure Title (System UI): Submission UI - Student Submission History List
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))
vi.mock("../../backend-ts/src/shared/supabase.js", () => ({
  supabase: { storage: { from: vi.fn(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() })) } },
}))

describe("TC-038: View Submission History", () => {
  let submissionService: SubmissionService
  let mockSubmissionRepo: any
  let mockSimilarityRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSubmissionRepo = {
      getSubmissionHistory: vi.fn(),
      getLatestSubmission: vi.fn(),
      getSubmissionCount: vi.fn(),
      createSubmission: vi.fn(),
      getSubmissionsWithStudentInfo: vi.fn(),
      getSubmissionsByStudent: vi.fn(),
      getSubmissionById: vi.fn(),
      saveTeacherFeedback: vi.fn(),
      updateGrade: vi.fn(),
      delete: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }

    mockSimilarityRepo = {
      getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()),
    }

    submissionService = new SubmissionService(
      mockSubmissionRepo,
      { getAssignmentById: vi.fn() } as any,
      { isEnrolled: vi.fn() } as any,
      { getClassById: vi.fn() } as any,
      { getUserById: vi.fn() } as any,
      { deleteBySubmissionId: vi.fn(), createMany: vi.fn(), calculateScore: vi.fn() } as any,
      { upload: vi.fn(), uploadSubmission: vi.fn(), download: vi.fn(), deleteFiles: vi.fn(), getSignedUrl: vi.fn(), deleteSubmissionFiles: vi.fn(), deleteAvatar: vi.fn() } as any,
      { runTestsForSubmission: vi.fn() } as any,
      { calculatePenalty: vi.fn(), getDefaultConfig: vi.fn(), applyPenalty: vi.fn(), getAssignmentPenaltyConfig: vi.fn() } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      { scheduleFromSubmission: vi.fn() } as any,
      mockSimilarityRepo,
    )
  })

  afterEach(() => { vi.resetAllMocks() })

  it("should return all past submissions for a student and assignment", async () => {
    const pastSubmissions = [
      createMockSubmission({ id: 1, assignmentId: 2, studentId: 5, submissionNumber: 1 }),
      createMockSubmission({ id: 2, assignmentId: 2, studentId: 5, submissionNumber: 2 }),
    ]

    mockSubmissionRepo.getSubmissionHistory.mockResolvedValue(pastSubmissions)

    const result = await submissionService.getSubmissionHistory(2, 5)

    expect(result).toHaveLength(2)
    expect(mockSubmissionRepo.getSubmissionHistory).toHaveBeenCalledWith(2, 5)
  })

  it("should return an empty list when the student has no submissions for the assignment", async () => {
    mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([])

    const result = await submissionService.getSubmissionHistory(2, 5)

    expect(result).toHaveLength(0)
  })
})
