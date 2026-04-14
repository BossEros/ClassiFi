/**
 * IT-024: Teacher Reads Assignments In Class
 *
 * Module: Assignment Management
 * Unit: View assignments
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can view assignments in a class.
 * Expected Result: The class assignments are displayed successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-024 Integration Test Pass - Teacher Reads Assignments In Class
 * Suggested Figure Title (System UI): Assignment Management UI - Class View With Modules And Assignments
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MockedObject } from "vitest"
import { ClassService } from "../../backend-ts/src/modules/classes/class.service.js"
import type { ClassRepository } from "../../backend-ts/src/modules/classes/class.repository.js"
import type { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import type { EnrollmentRepository } from "../../backend-ts/src/modules/enrollments/enrollment.repository.js"
import type { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import type { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import type { StorageService } from "../../backend-ts/src/services/storage.service.js"

describe("IT-024: Teacher Reads Assignments In Class", () => {
  let classService: ClassService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockAssignmentRepo: Partial<MockedObject<AssignmentRepository>>
  let mockSubmissionRepo: Partial<MockedObject<SubmissionRepository>>

  beforeEach(() => {
    mockClassRepo = {
      getStudentCount: vi.fn(),
    } as any

    mockAssignmentRepo = {
      getAssignmentsByClassId: vi.fn(),
    } as any

    mockSubmissionRepo = {
      getLatestSubmissionCountsByAssignmentIds: vi.fn(),
      getSubmissionsByClass: vi.fn(),
      getLatestSubmissionsByStudentAndAssignmentIds: vi.fn(),
    } as any

    classService = new ClassService(
      mockClassRepo as ClassRepository,
      mockAssignmentRepo as AssignmentRepository,
      { isEnrolled: vi.fn(), unenrollStudent: vi.fn(), getEnrolledStudentsWithInfo: vi.fn() } as unknown as EnrollmentRepository,
      { getUserById: vi.fn() } as unknown as UserRepository,
      mockSubmissionRepo as SubmissionRepository,
      { deleteSubmissionFiles: vi.fn(), deleteAssignmentInstructionsImage: vi.fn() } as unknown as StorageService,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn() } as any,
    )
  })

  it("should return the assignments for the selected class", async () => {
    mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([
      {
        id: 11,
        classId: 1,
        assignmentName: "Intro Quiz",
        instructions: "Answer the questions",
        instructionsImageUrl: null,
        programmingLanguage: "python",
        deadline: null,
        allowResubmission: true,
        maxAttempts: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        isActive: true,
        templateCode: null,
        totalScore: 100,
        scheduledDate: null,
        allowLateSubmissions: false,
        latePenaltyConfig: null,
        lastReminderSentAt: null,
      } as any,
    ])
    mockClassRepo.getStudentCount!.mockResolvedValue(30)
    mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
      new Map([[11, 12]]),
    )

    const result = await classService.getClassAssignments(1)

    expect(result).toHaveLength(1)
    expect(result[0].assignmentName).toBe("Intro Quiz")
  })
})
