/**
 * TC-034: Get Assignment Details
 *
 * Module: Assignment Management
 * Unit: Create, Update, and Delete Assignment
 * Date Tested: 4/11/26
 * Description: Verify that a teacher can view the full details of an assignment, including its test cases.
 * Expected Result: Assignment details are returned including the class name and visible test cases.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-034 Unit Test Pass - Assignment Details Retrieved Successfully
 * Suggested Figure Title (System UI): Assignment Management UI - Assignment Details View
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AssignmentService } from "../../backend-ts/src/modules/assignments/assignment.service.js"
import { AssignmentNotFoundError } from "../../backend-ts/src/shared/errors.js"
import { createMockAssignment, createMockClass } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))

describe("TC-034: Get Assignment Details", () => {
  let assignmentService: AssignmentService
  let mockAssignmentRepo: any
  let mockClassRepo: any
  let mockTestCaseRepo: any

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

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getNextSortOrder: vi.fn(),
    }

    assignmentService = new AssignmentService(
      mockAssignmentRepo,
      mockClassRepo,
      mockTestCaseRepo,
      { getEnrolledStudentsWithInfo: vi.fn().mockResolvedValue([]) } as any,
      { getSubmissionsWithStudentInfo: vi.fn() } as any,
      { getModuleById: vi.fn() } as any,
      { deleteAssignmentInstructionsImage: vi.fn() } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
      {} as any,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should return assignment details including class name and test cases", async () => {
    const assignment = createMockAssignment({ id: 5, classId: 1 })
    const classData = createMockClass({ id: 1, className: "Programming 101" })
    const testCases = [
      { id: 1, assignmentId: 5, name: "Sample Test", input: "5", expectedOutput: "25", isHidden: false, timeLimit: 5, sortOrder: 1, createdAt: new Date() },
    ]

    mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
    mockClassRepo.getClassById.mockResolvedValue(classData)
    mockTestCaseRepo.getByAssignmentId.mockResolvedValue(testCases)

    const result = await assignmentService.getAssignmentDetails(5)

    expect(result.id).toBe(5)
    expect(result.className).toBe("Programming 101")
    expect(result.testCases).toHaveLength(1)
    expect(result.testCases![0].name).toBe("Sample Test")
  })

  it("should throw an error when the assignment does not exist", async () => {
    mockAssignmentRepo.getAssignmentById.mockResolvedValue(undefined)

    await expect(assignmentService.getAssignmentDetails(999)).rejects.toThrow(AssignmentNotFoundError)
  })
})
