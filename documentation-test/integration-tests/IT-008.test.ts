/**
 * IT-008: Submission Created → Plagiarism Auto-Analysis Scheduled Flow
 *
 * Module: Similarity Detection
 * Unit: Batch Analyze Assignment Submissions
 * Date Tested: 4/10/26
 * Description: Verify that a plagiarism analysis is automatically scheduled when a student submits an assignment.
 * Expected Result: A plagiarism analysis is automatically scheduled for the submitted assignment.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-008 Integration Test Pass - Submission Triggers Plagiarism Auto-Analysis
 * Suggested Figure Title (System UI): Similarity Detection UI - Submission Queue or Analysis Trigger Context
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))
vi.mock("../../backend-ts/src/shared/supabase.js", () => ({
  supabase: { storage: { from: vi.fn(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() })) } },
}))

describe("IT-008: Submission Created → Plagiarism Auto-Analysis Scheduled Flow", () => {
  let submissionService: SubmissionService
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockEnrollmentRepo: any
  let mockStorageService: any
  let mockCodeTestService: any
  let mockLatePenaltyService: any
  let mockNotificationService: any
  let mockPlagiarismAutoAnalysisService: any
  let mockSimilarityRepo: any

  const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  beforeEach(() => {
    vi.clearAllMocks()

    const submissionRecord = createMockSubmission({ id: 1, assignmentId: 1, studentId: 5 })

    const mockTransactionalSubmissionRepo = {
      updateGrade: vi.fn().mockResolvedValue(undefined),
      updateOriginalGrade: vi.fn().mockResolvedValue(undefined),
    }

    mockSubmissionRepo = {
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
      withContext: vi.fn().mockReturnValue(mockTransactionalSubmissionRepo),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi.fn().mockResolvedValue(
        createMockAssignment({ id: 1, classId: 1, deadline: futureDeadline }),
      ),
    }

    mockEnrollmentRepo = { isEnrolled: vi.fn().mockResolvedValue(true) }

    mockStorageService = {
      upload: vi.fn().mockResolvedValue("submissions/1/5/1/solution.py"),
      uploadSubmission: vi.fn().mockResolvedValue("submissions/1/5/1/solution.py"),
      download: vi.fn(),
      deleteFiles: vi.fn(),
      getSignedUrl: vi.fn().mockResolvedValue("https://example.com/signed-url"),
      deleteSubmissionFiles: vi.fn(),
      deleteAvatar: vi.fn(),
    }

    mockCodeTestService = {
      runTestsForSubmission: vi.fn().mockResolvedValue({ passed: 1, total: 1, percentage: 100 }),
    }

    mockLatePenaltyService = {
      calculatePenalty: vi.fn().mockReturnValue({ isLate: false, hoursLate: 0, penaltyPercent: 0, isRejected: false }),
      getDefaultConfig: vi.fn().mockReturnValue({ tiers: [], rejectAfterHours: null }),
      applyPenalty: vi.fn((grade: number) => grade),
      getAssignmentConfig: vi.fn(),
    }

    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue(undefined),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    }

    mockPlagiarismAutoAnalysisService = {
      scheduleFromSubmission: vi.fn().mockResolvedValue(undefined),
    }

    mockSimilarityRepo = {
      getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()),
    }

    submissionService = new SubmissionService(
      mockSubmissionRepo,
      mockAssignmentRepo,
      mockEnrollmentRepo,
      { getClassById: vi.fn() } as any,
      { getUserById: vi.fn() } as any,
      { deleteBySubmissionId: vi.fn(), createMany: vi.fn() } as any,
      mockStorageService,
      mockCodeTestService,
      mockLatePenaltyService,
      mockNotificationService,
      mockPlagiarismAutoAnalysisService,
      mockSimilarityRepo,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should trigger plagiarism auto-analysis after a student submits an assignment", async () => {
    await submissionService.submitAssignment(1, 5, {
      filename: "solution.py",
      data: Buffer.from('print("hello")'),
      mimetype: "text/x-python",
    })

    expect(mockPlagiarismAutoAnalysisService.scheduleFromSubmission).toHaveBeenCalledWith(1)
  })
})
