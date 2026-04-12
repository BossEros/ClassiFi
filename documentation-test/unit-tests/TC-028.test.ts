/**
 * TC-028: Student Pending Assignments
 *
 * Module: Dashboard
 * Unit: View Pending Assignments
 * Date Tested: 3/29/26
 * Description: Verify that pending assignments are shown in dashboard.
 * Expected Result: Only upcoming and not-yet-submitted assignments are shown.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-028 Unit Test Pass - Pending Assignments Filtered Correctly
 * Suggested Figure Title (System UI): Dashboard UI - Pending Assignments Section
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"
import { createMockClass, createMockAssignment } from "../../backend-ts/tests/utils/factories.js"

describe("TC-028: Student Pending Assignments", () => {
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

  it("shows only pending assignments in the dashboard", async () => {
    const now = Date.now()
    const classRecord = createMockClass({ id: 1 })
    const futureA = createMockAssignment({ id: 1, classId: 1, deadline: new Date(now + 100000) })
    const futureB = createMockAssignment({ id: 2, classId: 1, deadline: new Date(now + 200000) })
    const past = createMockAssignment({ id: 3, classId: 1, deadline: new Date(now - 100000) })

    mockClassRepo.getClassesByStudent.mockResolvedValue([classRecord])
    mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue([futureA, futureB, past])
    mockSubmissionRepo.getLatestSubmission
      .mockResolvedValueOnce({ id: 100 })
      .mockResolvedValueOnce(null)

    const result = await dashboardService.getPendingAssignments(10)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })
})
