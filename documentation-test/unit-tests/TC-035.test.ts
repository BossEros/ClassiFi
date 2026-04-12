/**
 * TC-035: Update Assignment
 *
 * Module: Assignment Management
 * Unit: Create, Update, and Delete Assignment
 * Date Tested: 4/11/26
 * Description: Verify that a teacher can update an assignment's name.
 * Expected Result: The assignment is updated and the new name is returned.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-035 Unit Test Pass - Assignment Updated Successfully
 * Suggested Figure Title (System UI): Assignment Management UI - Edit Assignment Form
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AssignmentService } from "../../backend-ts/src/modules/assignments/assignment.service.js"
import { createMockAssignment, createMockClass } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))

describe("TC-035: Update Assignment", () => {
  let assignmentService: AssignmentService
  let mockAssignmentRepo: any
  let mockClassRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
      createAssignment: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateLastReminderSentAt: vi.fn(),
    }

    mockClassRepo = { getClassById: vi.fn() }

    assignmentService = new AssignmentService(
      mockAssignmentRepo,
      mockClassRepo,
      { getByAssignmentId: vi.fn().mockResolvedValue([]) } as any,
      { getEnrolledStudentsWithInfo: vi.fn().mockResolvedValue([]) } as any,
      { getSubmissionsWithStudentInfo: vi.fn() } as any,
      { getModuleById: vi.fn() } as any,
      { deleteAssignmentInstructionsImage: vi.fn() } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      { syncAssignmentPenaltyState: vi.fn() } as any,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should update the assignment name successfully", async () => {
    const existingAssignment = createMockAssignment({ id: 3, classId: 1 })
    const updatedAssignment = { ...existingAssignment, assignmentName: "Updated Functions Exercise" }

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(existingAssignment)
    mockClassRepo.getClassById.mockResolvedValue(createMockClass({ id: 1, teacherId: 2 }))
    mockAssignmentRepo.updateAssignment.mockResolvedValue(updatedAssignment)

    const result = await assignmentService.updateAssignment({
      assignmentId: 3,
      teacherId: 2,
      assignmentName: "Updated Functions Exercise",
    })

    expect(result.assignmentName).toBe("Updated Functions Exercise")
    expect(mockAssignmentRepo.updateAssignment).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ assignmentName: "Updated Functions Exercise" }),
    )
  })
})
