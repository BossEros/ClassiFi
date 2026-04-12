/**
 * TC-029: Student Leave Class
 *
 * Module: Dashboard
 * Unit: View and Join Classes
 * Date Tested: 3/29/26
 * Description: Verify that a student can leave an enrolled class.
 * Expected Result: Student is removed from the class roster.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-029 Unit Test Pass - Student Left Class Successfully
 * Suggested Figure Title (System UI): Dashboard UI - Leave Class Action
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"

describe("TC-029: Student Leave Class", () => {
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
      getClassById: vi.fn(),
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
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined), withContext: vi.fn().mockReturnThis() } as any,
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
