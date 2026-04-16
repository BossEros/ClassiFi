/**
 * IT-014: Student Leaves Class Successfully
 *
 * Module: Student Dashboard
 * Unit: Leave class
 * Date Tested: 4/13/26
 * Description: Verify that a student can leave a class successfully.
 * Expected Result: The student leaves the class successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-014 Integration Test Pass - Student Leaves Class Successfully
 * Suggested Figure Title (System UI): Student Dashboard UI - Class Page with One less Class and Leave Class Success Notification
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"
import { createMockClass, createMockUser } from "../../backend-ts/tests/utils/factories.js"

describe("IT-014: Student Leaves Class Successfully", () => {
  let dashboardService: StudentDashboardService
  let mockEnrollmentRepo: any
  let mockClassRepo: any
  let mockUserRepo: any

  beforeEach(() => {
    mockEnrollmentRepo = {
      isEnrolled: vi.fn(),
      unenrollStudent: vi.fn(),
      enrollStudent: vi.fn(),
    }
    mockClassRepo = {
      getClassById: vi.fn(),
      getClassesByStudentWithDetails: vi.fn(),
      getClassesByStudent: vi.fn(),
      getClassByCode: vi.fn(),
      getStudentCount: vi.fn(),
    }
    mockUserRepo = { getUserById: vi.fn() }

    dashboardService = new StudentDashboardService(
      mockClassRepo,
      mockEnrollmentRepo,
      {} as any,
      {} as any,
      mockUserRepo,
      {
        createNotification: vi.fn().mockResolvedValue(undefined),
        sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
      } as any,
    )
  })

  it("should remove the student enrollment from the class", async () => {
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)
    mockEnrollmentRepo.unenrollStudent.mockResolvedValue(true)
    mockClassRepo.getClassById.mockResolvedValue(
      createMockClass({ id: 1, teacherId: 2 }),
    )
    mockUserRepo.getUserById.mockResolvedValue(
      createMockUser({
        id: 5 as any,
        email: "student@test.com",
        role: "student" as any,
      }),
    )

    await dashboardService.leaveClass(5, 1)

    expect(mockEnrollmentRepo.unenrollStudent).toHaveBeenCalledWith(5, 1)
  })
})
