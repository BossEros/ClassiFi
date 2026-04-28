/**
 * IT-018: Teacher Creates Assignment Successfully
 *
 * Module: Assignment Management
 * Unit: Create assignment
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can create an assignment successfully.
 * Expected Result: A new assignment is created successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-018 Integration Test Pass - Teacher Creates Assignment Successfully
 * Suggested Figure Title (System UI): Assignment Management UI - Class View with Updated Assignment List and Create Assignment Success Notification
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MockedObject } from "vitest"
import { AssignmentService } from "../../backend-ts/src/modules/assignments/assignment.service.js"
import type { ClassRepository } from "../../backend-ts/src/modules/classes/class.repository.js"
import type { AssignmentRepository } from "../../backend-ts/src/modules/assignments/assignment.repository.js"
import type { TestCaseRepository } from "../../backend-ts/src/repositories/test-case.repository.js"
import type { EnrollmentRepository } from "../../backend-ts/src/modules/enrollments/enrollment.repository.js"
import type { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"
import type { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import type { StorageService } from "../../backend-ts/src/services/storage.service.js"
import type { ModuleRepository } from "../../backend-ts/src/modules/modules/module.repository.js"
import { createMockAssignment, createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("IT-018: Teacher Creates Assignment Successfully", () => {
  let assignmentService: AssignmentService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockAssignmentRepo: Partial<MockedObject<AssignmentRepository>>
  let mockEnrollmentRepo: Partial<MockedObject<EnrollmentRepository>>
  let mockModuleRepo: Partial<MockedObject<ModuleRepository>>

  beforeEach(() => {
    mockClassRepo = {
      getClassById: vi.fn(),
    }

    mockAssignmentRepo = {
      createAssignment: vi.fn(),
      getAssignmentById: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
    }

    mockEnrollmentRepo = {
      getEnrolledStudentsWithInfo: vi.fn().mockResolvedValue([]),
    }

    mockModuleRepo = {
      getModuleById: vi.fn().mockResolvedValue({
        id: 1,
        classId: 1,
        name: "Module 1",
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }

    assignmentService = new AssignmentService(
      mockAssignmentRepo as AssignmentRepository,
      mockClassRepo as ClassRepository,
      {} as TestCaseRepository,
      mockEnrollmentRepo as EnrollmentRepository,
      {} as SubmissionRepository,
      mockModuleRepo as ModuleRepository,
      { deleteAssignmentInstructionsImage: vi.fn() } as unknown as StorageService,
      {
        createNotification: vi.fn(),
        sendEmailNotificationIfEnabled: vi.fn(),
      } as unknown as NotificationService,
    )
  })

  it("should create and return the assignment", async () => {
    const classData = createMockClass({ id: 1, teacherId: 1 })
    const createdAssignment = createMockAssignment({ id: 20, classId: 1 })

    mockClassRepo.getClassById!.mockResolvedValue(classData)
    mockAssignmentRepo.createAssignment!.mockResolvedValue(createdAssignment)

    const result = await assignmentService.createAssignment({
      classId: 1,
      teacherId: 1,
      moduleId: 1,
      assignmentName: "Essay 1",
      instructions: "Write an essay",
      programmingLanguage: "python",
      deadline: new Date("2026-12-31T00:00:00.000Z"),
      allowResubmission: true,
      maxAttempts: null,
      templateCode: null,
      totalScore: 100,
      scheduledDate: null,
      allowLateSubmissions: false,
      latePenaltyConfig: null,
      instructionsImageUrl: null,
      enableSimilarityPenalty: false,
      similarityPenaltyConfig: null,
    })

    expect(result.id).toBe(20)
    expect(mockAssignmentRepo.createAssignment).toHaveBeenCalled()
  })
})

