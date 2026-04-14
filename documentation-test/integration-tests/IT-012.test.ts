/**
 * IT-012: Student Joins Class With Valid Code
 *
 * Module: Student Dashboard
 * Unit: Join class
 * Date Tested: 4/13/26
 * Description: Verify that a student can join a class with a valid code.
 * Expected Result: The student joins the class successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-012 Integration Test Pass - Student Joins Class With Valid Code
 * Suggested Figure Title (System UI): Student Dashboard UI - Class List Showing New Class and Join Class Success Notification
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { StudentDashboardService } from "../../backend-ts/src/modules/dashboard/student-dashboard.service.js"
import { createMockClass, createMockTeacher, createMockUser } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: { frontendUrl: "http://localhost:3000" },
}))

describe("IT-012: Student Joins Class With Valid Code", () => {
  let dashboardService: StudentDashboardService
  let mockClassRepo: any
  let mockEnrollmentRepo: any
  let mockUserRepo: any
  let mockNotificationService: any

  beforeEach(() => {
    mockClassRepo = {
      getClassByCode: vi.fn(),
      getStudentCount: vi.fn(),
      getClassesByStudentWithDetails: vi.fn(),
      getClassesByStudent: vi.fn(),
      getClassById: vi.fn(),
    }
    mockEnrollmentRepo = {
      isEnrolled: vi.fn(),
      enrollStudent: vi.fn(),
      unenrollStudent: vi.fn(),
    }
    mockUserRepo = { getUserById: vi.fn() }
    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue(undefined),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
    }

    dashboardService = new StudentDashboardService(
      mockClassRepo,
      mockEnrollmentRepo,
      {} as any,
      {} as any,
      mockUserRepo,
      mockNotificationService,
    )
  })

  it("should enroll the student and return the class info", async () => {
    const classData = createMockClass({ id: 1, teacherId: 2, isActive: true })
    const teacher = createMockTeacher({ id: 2 })
    const student = createMockUser({
      id: 5 as any,
      email: "student@test.com",
      role: "student" as any,
    })

    mockClassRepo.getClassByCode.mockResolvedValue(classData)
    mockEnrollmentRepo.isEnrolled.mockResolvedValue(false)
    mockEnrollmentRepo.enrollStudent.mockResolvedValue({
      id: 100,
      studentId: 5,
      classId: 1,
    })
    mockClassRepo.getStudentCount.mockResolvedValue(21)
    mockUserRepo.getUserById
      .mockResolvedValueOnce(teacher)
      .mockResolvedValueOnce(student)

    const result = await dashboardService.joinClass(5, classData.classCode)

    expect(result.id).toBe(1)
    expect(mockEnrollmentRepo.enrollStudent).toHaveBeenCalledWith(5, 1)
  })
})
