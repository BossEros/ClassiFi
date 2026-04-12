/**
 * TC-036: Delete Assignment
 *
 * Module: Assignment Management
 * Unit: Create, Update, and Delete Assignment
 * Date Tested: 4/11/26
 * Description: Verify that a teacher can delete an assignment they own.
 * Expected Result: The assignment is removed from the system.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-036 Unit Test Pass - Assignment Deleted Successfully
 * Suggested Figure Title (System UI): Assignment Management UI - Delete Assignment Confirmation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AssignmentService } from "../../backend-ts/src/modules/assignments/assignment.service.js"
import { createMockAssignment, createMockClass } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))

describe("TC-036: Delete Assignment", () => {
  let assignmentService: AssignmentService
  let mockAssignmentRepo: any
  let mockClassRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn().mockResolvedValue(undefined),
      createAssignment: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateLastReminderSentAt: vi.fn(),
    }

    mockClassRepo = { getClassById: vi.fn() }

    assignmentService = new AssignmentService(
      mockAssignmentRepo,
      mockClassRepo,
      { getByAssignmentId: vi.fn() } as any,
      { getEnrolledStudentsWithInfo: vi.fn() } as any,
      { getSubmissionsWithStudentInfo: vi.fn() } as any,
      { getModuleById: vi.fn() } as any,
      { deleteAssignmentInstructionsImage: vi.fn() } as any,
      { createNotification: vi.fn() } as any,
      {} as any,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should delete the assignment when the requesting teacher owns the class", async () => {
    const assignment = createMockAssignment({ id: 3, classId: 1 })

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
    mockClassRepo.getClassById.mockResolvedValue(createMockClass({ id: 1, teacherId: 2 }))

    await expect(assignmentService.deleteAssignment(3, 2)).resolves.toBeUndefined()
    expect(mockAssignmentRepo.deleteAssignment).toHaveBeenCalledWith(3)
  })
})
