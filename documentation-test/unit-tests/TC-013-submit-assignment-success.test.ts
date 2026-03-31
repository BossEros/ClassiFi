/**
 * TC-013: Submit Assignment Successfully
 *
 * Module: Submission
 * Unit: Submit Assignment
 * Date Tested: 3/28/26
 * Description: Verify that a valid assignment submission is processed.
 * Expected Result: Submission is created and tests are executed.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

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

describe("TC-013: Submit Assignment Successfully", () => {
  let submissionService: SubmissionService
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockEnrollmentRepo: any
  let mockTestResultRepo: any
  let mockStorageService: any
  let mockCodeTestService: any
  let mockLatePenaltyService: any
  let mockNotificationService: any
  let mockPlagiarismAutoAnalysisService: any

  const validFile = {
    filename: "solution.py",
    data: Buffer.from('print("hello")'),
    mimetype: "text/x-python",
  }
  const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  beforeEach(() => {
    vi.clearAllMocks()
    mockSubmissionRepo = {
      getLatestSubmission: vi.fn(), getSubmissionCount: vi.fn(),
      createSubmission: vi.fn(), getSubmissionHistory: vi.fn(),
      getSubmissionsWithStudentInfo: vi.fn(), getSubmissionsByStudent: vi.fn(),
      getSubmissionById: vi.fn(), saveTeacherFeedback: vi.fn(),
      updateGrade: vi.fn(), delete: vi.fn(), withContext: vi.fn().mockReturnThis(),
    }
    mockAssignmentRepo = { getAssignmentById: vi.fn() }
    mockEnrollmentRepo = { isEnrolled: vi.fn() }
    mockTestResultRepo = { deleteBySubmissionId: vi.fn() }
    mockStorageService = {
      upload: vi.fn().mockResolvedValue("path/to/file"),
      uploadSubmission: vi.fn().mockResolvedValue("path/to/file"),
      download: vi.fn(), deleteFiles: vi.fn(),
      getSignedUrl: vi.fn().mockResolvedValue("https://example.com/signed-url"),
      deleteSubmissionFiles: vi.fn(), deleteAvatar: vi.fn(),
    }
    mockCodeTestService = { runTestsForSubmission: vi.fn() }
    mockLatePenaltyService = {
      calculatePenalty: vi.fn().mockReturnValue({ isLate: false, hoursLate: 0, penaltyPercent: 0, isRejected: false }),
      getDefaultConfig: vi.fn().mockReturnValue({ tiers: [{ hoursLate: 24, penaltyPercent: 10 }], rejectAfterHours: 120 }),
      applyPenalty: vi.fn((score: number, penalty: number) => score * (1 - penalty / 100)),
      getAssignmentPenaltyConfig: vi.fn(), setAssignmentPenaltyConfig: vi.fn(),
    }
    mockNotificationService = {
      createNotification: vi.fn(),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    }
    mockPlagiarismAutoAnalysisService = { scheduleFromSubmission: vi.fn() }

    submissionService = new SubmissionService(
      mockSubmissionRepo, mockAssignmentRepo, mockEnrollmentRepo, mockTestResultRepo,
      mockStorageService, mockCodeTestService, mockLatePenaltyService,
      mockNotificationService, mockPlagiarismAutoAnalysisService,
    )
  })

  afterEach(() => { vi.resetAllMocks() })

  it("should submit assignment successfully", async () => {
    const assignment = createMockAssignment({
      id: 1, isActive: true, deadline: futureDeadline, programmingLanguage: "python", allowResubmission: true,
    })
    const mockSubmission = createMockSubmission({ id: 1 })

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)
    mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([])
    mockSubmissionRepo.createSubmission.mockResolvedValue(mockSubmission)

    const result = await submissionService.submitAssignment(1, 1, validFile)

    expect(result).toBeDefined()
    expect(result.id).toBe(mockSubmission.id)
    expect(mockSubmissionRepo.createSubmission).toHaveBeenCalled()
    expect(mockStorageService.uploadSubmission).toHaveBeenCalledWith(1, 1, 1, "solution.py", validFile.data, "text/x-python")
    expect(mockCodeTestService.runTestsForSubmission).toHaveBeenCalledWith(mockSubmission.id)
    expect(mockPlagiarismAutoAnalysisService.scheduleFromSubmission).toHaveBeenCalledWith(1)
  })
})
