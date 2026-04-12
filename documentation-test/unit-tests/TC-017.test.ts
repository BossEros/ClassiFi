/**
 * TC-017: File Too Large Rejection
 *
 * Module: Code Submission
 * Unit: Submit Code File
 * Date Tested: 3/28/26
 * Description: Verify error handling when file exceeds size limit.
 * Expected Result: User sees "File size exceeds limit" message.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-017 Unit Test Pass - Oversized Submission File Rejected
 * Suggested Figure Title (System UI): Code Submission UI - File Size Limit Validation Message
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { FileTooLargeError } from "../../backend-ts/src/shared/errors.js"
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

describe("TC-017: File Too Large Rejection", () => {
  let submissionService: SubmissionService
  let mockAssignmentRepo: any
  let mockEnrollmentRepo: any
  let mockSubmissionRepo: any

  const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  beforeEach(() => {
    vi.clearAllMocks()
    mockAssignmentRepo = { getAssignmentById: vi.fn() }
    mockEnrollmentRepo = { isEnrolled: vi.fn() }
    mockSubmissionRepo = {
      getLatestSubmission: vi.fn(), getSubmissionCount: vi.fn(),
      createSubmission: vi.fn(), getSubmissionHistory: vi.fn(),
      getSubmissionsWithStudentInfo: vi.fn(), getSubmissionsByStudent: vi.fn(),
      getSubmissionById: vi.fn(), saveTeacherFeedback: vi.fn(),
      updateGrade: vi.fn(), delete: vi.fn(), withContext: vi.fn().mockReturnThis(),
    }

    submissionService = new SubmissionService(
      mockSubmissionRepo, mockAssignmentRepo, mockEnrollmentRepo,
      { deleteBySubmissionId: vi.fn() } as any,
      { upload: vi.fn(), uploadSubmission: vi.fn(), download: vi.fn(), deleteFiles: vi.fn(), getSignedUrl: vi.fn(), deleteSubmissionFiles: vi.fn(), deleteAvatar: vi.fn() } as any,
      { runTestsForSubmission: vi.fn() } as any,
      { calculatePenalty: vi.fn(), getDefaultConfig: vi.fn(), applyPenalty: vi.fn(), getAssignmentPenaltyConfig: vi.fn(), setAssignmentPenaltyConfig: vi.fn() } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      { scheduleFromSubmission: vi.fn() } as any,
    )
  })

  afterEach(() => { vi.resetAllMocks() })

  it("should throw FileTooLargeError when file exceeds 10MB", async () => {
    const assignment = createMockAssignment({
      isActive: true, deadline: futureDeadline, programmingLanguage: "python",
    })
    const largeFile = {
      filename: "solution.py",
      data: Buffer.alloc(11 * 1024 * 1024), // 11MB
      mimetype: "text/x-python",
    }

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)
    mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([])

    const submitPromise = submissionService.submitAssignment(1, 1, largeFile)

    await expect(submitPromise).rejects.toThrow(FileTooLargeError)
    await expect(submitPromise).rejects.toThrow("File size exceeds")
  })
})
