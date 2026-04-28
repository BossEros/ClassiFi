/**
 * IT-020: Student Sees Enrolled Classes
 *
 * Module: Student Dashboard
 * Unit: View classes
 * Date Tested: 4/13/26
 * Description: Verify that a student can view enrolled classes.
 * Expected Result: The student's enrolled classes are displayed.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-020 Integration Test Pass - Student Sees Enrolled Classes
 * Suggested Figure Title (System UI): Student Dashboard UI - Enrolled Classes List
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"
import { createMockClass } from "../../backend-ts/tests/utils/factories.js"

describe("IT-020: Student Sees Enrolled Classes", () => {
  let dashboardService: StudentDashboardService
  let mockClassRepo: any

  beforeEach(() => {
    mockClassRepo = {
      getClassesByStudentWithDetails: vi.fn(),
      getClassesByStudent: vi.fn(),
      getStudentCount: vi.fn(),
      getClassByCode: vi.fn(),
      getClassById: vi.fn(),
    }

    dashboardService = new StudentDashboardService(
      mockClassRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        createNotification: vi.fn(),
        sendEmailNotificationIfEnabled: vi.fn(),
      } as any,
    )
  })

  it("should return the classes where the student is enrolled", async () => {
    mockClassRepo.getClassesByStudentWithDetails.mockResolvedValue([
      {
        ...createMockClass({ id: 1, className: "Programming 1" }),
        studentCount: 24,
        teacherName: "Teacher One",
      },
    ])

    const result = await dashboardService.getEnrolledClasses(5)

    expect(result).toHaveLength(1)
    expect(result[0].className).toBe("Programming 1")
  })
})

