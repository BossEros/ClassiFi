/**
 * IT-010: Teacher Deletes Assignment Successfully
 *
 * Module: Assignment Management
 * Unit: Delete assignment
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can delete an assignment successfully.
 * Expected Result: The assignment is deleted successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-010 Integration Test Pass - Teacher Deletes Assignment Successfully
 * Suggested Figure Title (System UI): Assignment Management UI - Class Page with Assignment Delete Success Toast Notification
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { AssignmentService } from "../../backend-ts/src/modules/assignments/assignment.service.js"
import { createMockAssignment, createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("IT-010: Teacher Deletes Assignment Successfully", () => {
  let assignmentService: AssignmentService
  let mockAssignmentRepo: any
  let mockClassRepo: any

  beforeEach(() => {
    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
      deleteAssignment: vi.fn(),
      createAssignment: vi.fn(),
      updateAssignment: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateLastReminderSentAt: vi.fn(),
    }
    mockClassRepo = { getClassById: vi.fn() }

    assignmentService = new AssignmentService(
      mockAssignmentRepo,
      mockClassRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { deleteAssignmentInstructionsImage: vi.fn() } as any,
      {} as any,
      {} as any,
    )
  })

  it("should delete the assignment after ownership is verified", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(
      createMockAssignment({ id: 1, classId: 1, instructionsImageUrl: null }),
    )
    mockClassRepo.getClassById.mockResolvedValue(
      createMockClass({ id: 1, teacherId: 5 }),
    )
    mockAssignmentRepo.deleteAssignment.mockResolvedValue(true)

    await assignmentService.deleteAssignment(1, 5)

    expect(mockAssignmentRepo.deleteAssignment).toHaveBeenCalledWith(1)
  })
})
