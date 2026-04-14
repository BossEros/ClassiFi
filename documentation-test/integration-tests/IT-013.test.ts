/**
 * IT-013: Student Join Class Rejects Invalid Code
 *
 * Module: Student Dashboard
 * Unit: Join class
 * Date Tested: 4/13/26
 * Description: Verify that joining a class rejects an invalid code.
 * Expected Result: The system shows that the class code is invalid.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-013 Integration Test Pass - Student Join Class Rejects Invalid Code
 * Suggested Figure Title (System UI): Student Dashboard UI - Join Class Form Showing Invalid Code Error
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"
import { ClassNotFoundError } from "../../backend-ts/src/shared/errors.js"

describe("IT-013: Student Join Class Rejects Invalid Code", () => {
  let dashboardService: StudentDashboardService
  let mockClassRepo: any

  beforeEach(() => {
    mockClassRepo = {
      getClassByCode: vi.fn(),
      getStudentCount: vi.fn(),
      getClassesByStudentWithDetails: vi.fn(),
      getClassesByStudent: vi.fn(),
      getClassById: vi.fn(),
    }

    dashboardService = new StudentDashboardService(
      mockClassRepo,
      { isEnrolled: vi.fn(), enrollStudent: vi.fn(), unenrollStudent: vi.fn() } as any,
      {} as any,
      {} as any,
      { getUserById: vi.fn() } as any,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn() } as any,
    )
  })

  it("should reject the join request when the class code is invalid", async () => {
    mockClassRepo.getClassByCode.mockResolvedValue(null)

    await expect(dashboardService.joinClass(5, "INVALID")).rejects.toThrow(
      ClassNotFoundError,
    )
  })
})
