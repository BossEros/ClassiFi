/**
 * IT-016: Late Submission Applies Grade Penalty
 *
 * Module: Assignment Management
 * Unit: Late submission
 * Date Tested: 4/13/26
 * Description: Verify that a late submission applies a grade penalty.
 * Expected Result: A late penalty is applied to the submission grade.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-016 Integration Test Pass - Late Submission Applies Grade Penalty
 * Suggested Figure Title (System UI): Assignment Management UI - Late Penalty Reflected In Grade Breakdown
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LatePenaltyService } from "../../backend-ts/src/modules/assignments/late-penalty.service.js"
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

describe("IT-016: Late Submission Applies Grade Penalty", () => {
  let submissionService: SubmissionService
  let realLatePenaltyService: LatePenaltyService
  let mockAssignmentRepo: any
  let mockSubmissionRepo: any

  const pastDeadline = new Date(Date.now() - 12 * 60 * 60 * 1000)

  beforeEach(() => {
    vi.clearAllMocks()

    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
      getLatePenaltyConfig: vi.fn(),
      getAssignmentsByClassId: vi.fn().mockResolvedValue([]),
      getAssignmentsByClassIds: vi.fn().mockResolvedValue([]),
      updateLastReminderSentAt: vi.fn(),
    }
    realLatePenaltyService = new LatePenaltyService(mockAssignmentRepo)

    const createdSubmission = createMockSubmission({
      id: 1,
      assignmentId: 1,
      studentId: 5,
      isLate: true,
      penaltyApplied: 10,
    })

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
      withContext: vi.fn().mockReturnValue({
        updateGrade: vi.fn().mockResolvedValue(undefined),
        updateOriginalGrade: vi.fn().mockResolvedValue(undefined),
      }),
    }

    submissionService = new SubmissionService(
      mockSubmissionRepo,
      mockAssignmentRepo,
      { isEnrolled: vi.fn().mockResolvedValue(true) } as any,
      {
        deleteBySubmissionId: vi.fn().mockResolvedValue(undefined),
        createMany: vi.fn().mockResolvedValue(undefined),
        calculateScore: vi.fn().mockResolvedValue({
          passed: 2,
          total: 2,
          percentage: 100,
        }),
      } as any,
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
      { runTestsForSubmission: vi.fn().mockResolvedValue({ passed: 2, total: 2, percentage: 100 }) } as any,
      realLatePenaltyService,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      { scheduleFromSubmission: vi.fn().mockResolvedValue(undefined) } as any,
      { getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()) } as any,
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should save a non-zero penalty for a late submission", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(
      createMockAssignment({
        id: 1,
        classId: 1,
        deadline: pastDeadline,
        allowLateSubmissions: true,
        latePenaltyConfig: {
          tiers: [{ hoursLate: 24, penaltyPercent: 10 }],
          rejectAfterHours: 120,
        },
      }),
    )

    await submissionService.submitAssignment(1, 5, {
      filename: "solution.py",
      data: Buffer.from('print("hello")'),
      mimetype: "text/x-python",
    })

    const createCall = mockSubmissionRepo.createSubmission.mock.calls[0][0]
    expect(createCall.isLate).toBe(true)
    expect(createCall.penaltyApplied).toBeGreaterThan(0)
  })
})

