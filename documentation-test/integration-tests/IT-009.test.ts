/**
 * IT-009: Teacher Updates Assignment Successfully
 *
 * Module: Assignment Management
 * Unit: Update assignment
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can update an assignment successfully.
 * Expected Result: The assignment information is updated successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-009 Integration Test Pass - Teacher Updates Assignment Successfully
 * Suggested Figure Title (System UI): Assignment Management UI - Class Page with Assignment Update Success Toast Notification
 */ 

import { beforeEach, describe, expect, it, vi } from "vitest"
import { AssignmentService } from "../../backend-ts/src/modules/assignments/assignment.service.js"
import { createMockAssignment, createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("IT-009: Teacher Updates Assignment Successfully", () => {
  let assignmentService: AssignmentService
  let mockAssignmentRepo: any
  let mockClassRepo: any
  let mockEnrollmentRepo: any

  beforeEach(() => {
    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
      updateAssignment: vi.fn(),
      createAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateLastReminderSentAt: vi.fn(),
    }
    mockClassRepo = { getClassById: vi.fn() }
    mockEnrollmentRepo = { getEnrolledStudentsWithInfo: vi.fn() }

    assignmentService = new AssignmentService(
      mockAssignmentRepo,
      mockClassRepo,
      { getByAssignmentId: vi.fn() } as any,
      mockEnrollmentRepo,
      {} as any,
      { getModuleById: vi.fn() } as any,
      { deleteAssignmentInstructionsImage: vi.fn() } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn() } as any,
      { syncAssignmentPenaltyState: vi.fn() } as any,
    )
  })

  it("should update an existing assignment", async () => {
    const existingAssignment = createMockAssignment({ id: 1, classId: 1 })
    const updatedAssignment = {
      ...existingAssignment,
      assignmentName: "Updated Assignment",
    }

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(existingAssignment)
    mockClassRepo.getClassById.mockResolvedValue(
      createMockClass({ id: 1, teacherId: 3 }),
    )
    mockAssignmentRepo.updateAssignment.mockResolvedValue(updatedAssignment)
    mockEnrollmentRepo.getEnrolledStudentsWithInfo.mockResolvedValue([])

    const result = await assignmentService.updateAssignment({
      assignmentId: 1,
      teacherId: 3,
      assignmentName: "Updated Assignment",
    })

    expect(result.assignmentName).toBe("Updated Assignment")
    expect(mockAssignmentRepo.updateAssignment).toHaveBeenCalled()
  })
})
