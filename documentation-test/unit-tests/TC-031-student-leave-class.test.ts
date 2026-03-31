/**
 * TC-031: Student Leave Class
 *
 * Module: Student Dashboard
 * Unit: Leave Class
 * Date Tested: 3/29/26
 * Description: Verify that a student can leave an enrolled class.
 * Expected Result: Student is removed from the class roster.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"

describe("TC-031: Student Leave Class", () => {
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

  it("leaves class successfully when student is enrolled", async () => {
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)
    mockEnrollmentRepo.unenrollStudent.mockResolvedValue(undefined)

    await dashboardService.leaveClass(10, 1)

    expect(mockEnrollmentRepo.unenrollStudent).toHaveBeenCalledWith(10, 1)
  })
})
