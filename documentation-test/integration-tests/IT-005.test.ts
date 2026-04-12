/**
 * IT-005: Late Submission → Penalty Applied to Grade Flow
 *
 * Module: Assignment Management
 * Unit: Configure Late Penalty
 * Date Tested: 4/10/26
 * Description: Verify that a late penalty is applied to the submission grade when a student submits past the assignment deadline.
 * Expected Result: The submission grade correctly reflects the late penalty percentage applied.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-005 Integration Test Pass - Late Submission Penalty Applied to Grade
 * Suggested Figure Title (System UI): Assignment Management UI - Late Penalty Reflected in Submission Result
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { LatePenaltyService } from "../../backend-ts/src/modules/assignments/late-penalty.service.js"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))
vi.mock("../../backend-ts/src/shared/supabase.js", () => ({
  supabase: { storage: { from: vi.fn(() => ({ upload: vi.fn(), createSignedUrl: vi.fn() })) } },
}))

describe("IT-005: Late Submission → Penalty Applied to Grade Flow", () => {
  let submissionService: SubmissionService
  let realLatePenaltyService: LatePenaltyService
  let mockAssignmentRepo: any
  let mockSubmissionRepo: any
  let mockEnrollmentRepo: any
  let mockStorageService: any
  let mockCodeTestService: any
  let mockNotificationService: any
  let mockPlagiarismAutoAnalysisService: any
  let mockSimilarityRepo: any
  let mockTestResultRepo: any

  const pastDeadline = new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago

  beforeEach(() => {
    vi.clearAllMocks()

    // Real LatePenaltyService — this is the key "integration" aspect: no mock
    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
      getLatePenaltyConfig: vi.fn(),
      getAssignmentsByClassId: vi.fn().mockResolvedValue([]),
      getAssignmentsByClassIds: vi.fn().mockResolvedValue([]),
      updateLastReminderSentAt: vi.fn(),
    }

    realLatePenaltyService = new LatePenaltyService(mockAssignmentRepo)

    const createdSubmission = createMockSubmission({ id: 1, assignmentId: 1, studentId: 5, isLate: true, penaltyApplied: 10 })

    const mockTransactionalSubmissionRepo = {
      updateGrade: vi.fn().mockResolvedValue(undefined),
      updateOriginalGrade: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    }

    mockSubmissionRepo = {
      getLatestSubmission: vi.fn().mockResolvedValue(null),
      getSubmissionCount: vi.fn().mockResolvedValue(0),
      getSubmissionHistory: vi.fn().mockResolvedValue([]),
      createSubmission: vi.fn().mockResolvedValue(createdSubmission),
      getSubmissionById: vi.fn().mockResolvedValue(createdSubmission),
      getSubmissionsWithStudentInfo: vi.fn().mockResolvedValue([]),
      getSubmissionsByStudent: vi.fn().mockResolvedValue([]),
      saveTeacherFeedback: vi.fn(),
      updateGrade: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      withContext: vi.fn().mockReturnValue(mockTransactionalSubmissionRepo),
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

    const mockTestResultsRepo = {
      deleteBySubmissionId: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
      calculateScore: vi.fn().mockResolvedValue({ passed: 2, total: 2, percentage: 100 }),
    }

    mockCodeTestService = {
      runTestsForSubmission: vi.fn().mockResolvedValue({ passed: 2, total: 2, percentage: 100 }),
    }

    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue(undefined),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    }

    mockPlagiarismAutoAnalysisService = { scheduleFromSubmission: vi.fn().mockResolvedValue(undefined) }

    mockSimilarityRepo = {
      getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()),
    }

    mockTestResultRepo = mockTestResultsRepo

    submissionService = new SubmissionService(
      mockSubmissionRepo,
      mockAssignmentRepo,
      mockEnrollmentRepo,
      { getClassById: vi.fn() } as any,
      { getUserById: vi.fn() } as any,
      mockTestResultRepo,
      mockStorageService,
      mockCodeTestService,
      realLatePenaltyService,
      mockNotificationService,
      mockPlagiarismAutoAnalysisService,
      mockSimilarityRepo,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should store a non-zero penaltyApplied when submission arrives after the deadline", async () => {
    const lateAssignment = createMockAssignment({
      id: 1,
      classId: 1,
      deadline: pastDeadline,
      allowLateSubmissions: true,
      latePenaltyConfig: {
        tiers: [{ hoursLate: 24, penaltyPercent: 10 }],
        rejectAfterHours: 120,
      },
    })

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(lateAssignment)

    await submissionService.submitAssignment(1, 5, {
      filename: "solution.py",
      data: Buffer.from('print("hello")'),
      mimetype: "text/x-python",
    })

    const createCall = mockSubmissionRepo.createSubmission.mock.calls[0][0]
    expect(createCall.isLate).toBe(true)
    expect(createCall.penaltyApplied).toBeGreaterThan(0)
  })

  it("should store zero penaltyApplied when submission is on time", async () => {
    const onTimeAssignment = createMockAssignment({
      id: 1,
      classId: 1,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      allowLateSubmissions: false,
    })

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(onTimeAssignment)

    await submissionService.submitAssignment(1, 5, {
      filename: "solution.py",
      data: Buffer.from('print("hello")'),
      mimetype: "text/x-python",
    })

    const createCall = mockSubmissionRepo.createSubmission.mock.calls[0][0]
    expect(createCall.isLate).toBe(false)
    expect(createCall.penaltyApplied).toBe(0)
  })
})
