/**
 * TC-029: Student Join Class
 *
 * Module: Student Dashboard
 * Unit: Join Class
 * Date Tested: 3/29/26
 * Description: Verify that a student can join a class using a valid class code.
 * Expected Result: Class appears in the student's enrolled classes.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"
import { createMockClass, createMockUser } from "../../backend-ts/tests/utils/factories.js"

describe("TC-029: Student Join Class", () => {
  let dashboardService: StudentDashboardService
  let mockClassRepo: any
  let mockEnrollmentRepo: any
  let mockAssignmentRepo: any
  let mockSubmissionRepo: any
  let mockUserRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockClassRepo = {
      getClassesByStudent: vi.fn(),
      getClassesByStudentWithDetails: vi.fn(),
      getStudentCount: vi.fn(),
      getClassByCode: vi.fn(),
    }

    mockEnrollmentRepo = {
      isEnrolled: vi.fn(),
      enrollStudent: vi.fn(),
      unenrollStudent: vi.fn(),
    }

    mockAssignmentRepo = { getAssignmentsByClassId: vi.fn() }
    mockSubmissionRepo = { getLatestSubmission: vi.fn() }
    mockUserRepo = { getUserById: vi.fn() }

    dashboardService = new StudentDashboardService(
      mockClassRepo,
      mockEnrollmentRepo,
      mockAssignmentRepo,
      mockSubmissionRepo,
      mockUserRepo,
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("joins class successfully with valid class code", async () => {
    const classRecord = createMockClass({ id: 1, classCode: "ABC123", isActive: true, teacherId: 2 })
    const teacher = createMockUser({ id: 2, firstName: "Test", lastName: "Teacher" })

    mockClassRepo.getClassByCode.mockResolvedValue(classRecord)
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(false)
    mockEnrollmentRepo.enrollStudent.mockResolvedValue(undefined)
    mockClassRepo.getStudentCount.mockResolvedValue(15)
    mockUserRepo.getUserById.mockResolvedValue(teacher)

    const result = await dashboardService.joinClass(10, "ABC123")

    expect(result.id).toBe(1)
    expect(result.teacherName).toBe("Test Teacher")
    expect(mockEnrollmentRepo.enrollStudent).toHaveBeenCalledWith(10, 1)
  })
})
