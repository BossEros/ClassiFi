/**
 * IT-017: Submission Triggers Plagiarism Auto Analysis
 *
 * Module: Similarity Detection
 * Unit: Submit assignment
 * Date Tested: 4/13/26
 * Description: Verify that a submission triggers plagiarism auto analysis.
 * Expected Result: The submission is scheduled for plagiarism auto analysis.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-017 Integration Test Pass - Submission Triggers Plagiarism Auto Analysis
 * Suggested Figure Title (System UI): Similarity Detection UI - Plagiarism Auto Analysis Scheduled After Successful Submission
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))
vi.mock("../../backend-ts/src/shared/supabase.js", () => ({
  supabase: {
    storage: { from: vi.fn(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() })) },
  },
}))

describe("IT-017: Submission Triggers Plagiarism Auto Analysis", () => {
  let submissionService: SubmissionService
  let mockPlagiarismAutoAnalysisService: any

  beforeEach(() => {
    vi.clearAllMocks()

    const submissionRecord = createMockSubmission({
      id: 1,
      assignmentId: 1,
      studentId: 5,
    })

    mockPlagiarismAutoAnalysisService = {
      scheduleFromSubmission: vi.fn().mockResolvedValue(undefined),
    }

    submissionService = new SubmissionService(
      {
        getLatestSubmission: vi.fn().mockResolvedValue(null),
        getSubmissionCount: vi.fn().mockResolvedValue(0),
        getSubmissionHistory: vi.fn().mockResolvedValue([]),
        createSubmission: vi.fn().mockResolvedValue(submissionRecord),
        getSubmissionById: vi.fn().mockResolvedValue(submissionRecord),
        getSubmissionsWithStudentInfo: vi.fn().mockResolvedValue([]),
        getSubmissionsByStudent: vi.fn().mockResolvedValue([]),
        saveTeacherFeedback: vi.fn(),
        updateGrade: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn(),
        withContext: vi.fn().mockReturnValue({
          updateGrade: vi.fn().mockResolvedValue(undefined),
          updateOriginalGrade: vi.fn().mockResolvedValue(undefined),
        }),
      } as any,
      {
        getAssignmentById: vi.fn().mockResolvedValue(
          createMockAssignment({
            id: 1,
            classId: 1,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }),
        ),
      } as any,
      { isEnrolled: vi.fn().mockResolvedValue(true) } as any,
      { deleteBySubmissionId: vi.fn(), createMany: vi.fn() } as any,
      {
        upload: vi.fn().mockResolvedValue("submissions/1/5/1/solution.py"),
        uploadSubmission: vi.fn().mockResolvedValue(
          "submissions/1/5/1/solution.py",
        ),
        download: vi.fn(),
        deleteFiles: vi.fn(),
        getSignedUrl: vi.fn().mockResolvedValue("https://example.com/signed-url"),
        deleteSubmissionFiles: vi.fn(),
        deleteAvatar: vi.fn(),
      } as any,
      { runTestsForSubmission: vi.fn().mockResolvedValue({ passed: 1, total: 1, percentage: 100 }) } as any,
      {
        calculatePenalty: vi.fn().mockReturnValue({
          isLate: false,
          hoursLate: 0,
          penaltyPercent: 0,
          isRejected: false,
        }),
        getDefaultConfig: vi.fn().mockReturnValue({ tiers: [], rejectAfterHours: null }),
        applyPenalty: vi.fn((grade: number) => grade),
        getAssignmentPenaltyConfig: vi.fn(),
        setAssignmentPenaltyConfig: vi.fn(),
      } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      mockPlagiarismAutoAnalysisService,
      { getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()) } as any,
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should schedule plagiarism auto analysis after a successful submission", async () => {
    await submissionService.submitAssignment(1, 5, {
      filename: "solution.py",
      data: Buffer.from('print("hello")'),
      mimetype: "text/x-python",
    })

    expect(
      mockPlagiarismAutoAnalysisService.scheduleFromSubmission,
    ).toHaveBeenCalledWith(1)
  })
})

