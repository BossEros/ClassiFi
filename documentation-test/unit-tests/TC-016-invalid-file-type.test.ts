/**
 * TC-016: Invalid File Type Rejection
 *
 * Module: Submission
 * Unit: Submit Assignment
 * Date Tested: 3/28/26
 * Description: Verify error handling when submitting an invalid file type.
 * Expected Result: User sees "Invalid file type" message.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { InvalidFileTypeError } from "../../backend-ts/src/shared/errors.js"
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

describe("TC-016: Invalid File Type Rejection", () => {
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

  it("should throw InvalidFileTypeError for wrong file extension", async () => {
    const assignment = createMockAssignment({
      isActive: true, deadline: futureDeadline, programmingLanguage: "python",
    })
    const wrongFile = { filename: "solution.java", data: Buffer.from("class Solution {}"), mimetype: "text/x-java" }

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)
    mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([])

    const submitPromise = submissionService.submitAssignment(1, 1, wrongFile)

    await expect(submitPromise).rejects.toThrow(InvalidFileTypeError)
    await expect(submitPromise).rejects.toThrow("Invalid file type")
  })
})
