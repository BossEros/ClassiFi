/**
 * IT-023: Student Submits Assignment Successfully
 *
 * Module: Submission Management
 * Unit: Submit assignment
 * Date Tested: 4/13/26
 * Description: Verify that a student can submit an assignment successfully.
 * Expected Result: The assignment submission is saved successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-023 Integration Test Pass - Student Submits Assignment Successfully
 * Suggested Figure Title (System UI): Submission UI - Assignment View with Assignment Submission Success Notification
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (context: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))

describe("IT-023: Student Submits Assignment Successfully", () => {
  let submissionService: SubmissionService
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockEnrollmentRepo: any
  let mockStorageService: any
  let mockCodeTestService: any
  let mockLatePenaltyService: any
  let mockPlagiarismAutoAnalysisService: any
  let mockSimilarityRepo: any

  beforeEach(() => {
    mockSubmissionRepo = {
      getSubmissionHistory: vi.fn(),
      createSubmission: vi.fn(),
      getSubmissionById: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
    }

    mockEnrollmentRepo = {
      isEnrolled: vi.fn(),
    }

    mockStorageService = {
      uploadSubmission: vi.fn().mockResolvedValue("submissions/1/1/1_solution.py"),
      deleteSubmissionFiles: vi.fn(),
    }

    mockCodeTestService = {
      runTestsForSubmission: vi.fn().mockResolvedValue(true),
    }

    mockLatePenaltyService = {
      calculatePenalty: vi.fn().mockReturnValue({
        isLate: false,
        hoursLate: 0,
        penaltyPercent: 0,
        isRejected: false,
      }),
      getDefaultConfig: vi.fn(),
      applyPenalty: vi.fn((score: number) => score),
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
      {} as any,
      mockStorageService,
      mockCodeTestService,
      mockLatePenaltyService,
      {
        createNotification: vi.fn(),
        sendEmailNotificationIfEnabled: vi.fn(),
        withContext: vi.fn().mockReturnThis(),
      } as any,
      mockPlagiarismAutoAnalysisService,
      mockSimilarityRepo,
    )
  })

  it("should create and return the new submission", async () => {
    const validFile = {
      filename: "solution.py",
      data: Buffer.from('print("hello")'),
      mimetype: "text/x-python",
    }

    const assignment = createMockAssignment({
      id: 1,
      classId: 1,
      isActive: true,
      deadline: new Date("2026-12-31T00:00:00.000Z"),
      programmingLanguage: "python",
      allowResubmission: true,
      maxAttempts: null,
      totalScore: 100,
    })
    const createdSubmission = createMockSubmission({ id: 50 })

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)
    mockSubmissionRepo.getSubmissionHistory.mockResolvedValue([])
    mockSubmissionRepo.createSubmission.mockResolvedValue(createdSubmission)
    mockSubmissionRepo.getSubmissionById.mockResolvedValue(createdSubmission)

    const result = await submissionService.submitAssignment(1, 1, validFile)

    expect(result.id).toBe(50)
    expect(mockSubmissionRepo.createSubmission).toHaveBeenCalled()
  })
})
