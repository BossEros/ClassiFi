/**
 * TC-014: Submit to Inactive Assignment
 *
 * Module: Submission
 * Unit: Submit Assignment
 * Date Tested: 3/28/26
 * Description: Verify error handling when submitting to an inactive assignment.
 * Expected Result: User sees "This assignment is no longer active" message.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { AssignmentInactiveError } from "../../backend-ts/src/shared/errors.js"
import { createMockAssignment } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/modules/submissions/submission.repository.js")
vi.mock("../../backend-ts/src/modules/assignments/assignment.repository.js")
vi.mock("../../backend-ts/src/modules/enrollments/enrollment.repository.js")
vi.mock("../../backend-ts/src/modules/classes/class.repository.js")
vi.mock("../../backend-ts/src/modules/test-cases/test-result.repository.js")
vi.mock("../../backend-ts/src/services/code-test.service.js")
vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))
vi.mock("../../backend-ts/src/shared/supabase.js", () => ({
  supabase: { storage: { from: vi.fn(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() })) } },
}))

describe("TC-014: Submit to Inactive Assignment", () => {
  let submissionService: SubmissionService
  let mockAssignmentRepo: any

  const validFile = {
    filename: "solution.py",
    data: Buffer.from('print("hello")'),
    mimetype: "text/x-python",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAssignmentRepo = { getAssignmentById: vi.fn() }

    submissionService = new SubmissionService(
      { getLatestSubmission: vi.fn(), getSubmissionCount: vi.fn(), createSubmission: vi.fn(), getSubmissionHistory: vi.fn(), getSubmissionsWithStudentInfo: vi.fn(), getSubmissionsByStudent: vi.fn(), getSubmissionById: vi.fn(), saveTeacherFeedback: vi.fn(), updateGrade: vi.fn(), delete: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      mockAssignmentRepo,
      { isEnrolled: vi.fn() } as any,
      { deleteBySubmissionId: vi.fn() } as any,
      { upload: vi.fn(), uploadSubmission: vi.fn(), download: vi.fn(), deleteFiles: vi.fn(), getSignedUrl: vi.fn(), deleteSubmissionFiles: vi.fn(), deleteAvatar: vi.fn() } as any,
      { runTestsForSubmission: vi.fn() } as any,
      { calculatePenalty: vi.fn(), getDefaultConfig: vi.fn(), applyPenalty: vi.fn(), getAssignmentPenaltyConfig: vi.fn(), setAssignmentPenaltyConfig: vi.fn() } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      { scheduleFromSubmission: vi.fn() } as any,
    )
  })

  afterEach(() => { vi.resetAllMocks() })

  it("should throw AssignmentInactiveError when assignment is inactive", async () => {
    const inactiveAssignment = createMockAssignment({ isActive: false })
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(inactiveAssignment)

    const submitPromise = submissionService.submitAssignment(1, 1, validFile)

    await expect(submitPromise).rejects.toThrow(AssignmentInactiveError)
    await expect(submitPromise).rejects.toThrow("no longer active")
  })
})
