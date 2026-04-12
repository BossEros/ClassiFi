/**
 * TC-033: Teacher Dashboard Data
 *
 * Module: Dashboard
 * Unit: View Dashboard
 * Date Tested: 4/10/26
 * Description: Verify that the teacher dashboard returns recent classes and pending assignment tasks.
 * Expected Result: Dashboard returns a list of classes with counts and a list of pending tasks.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-033 Unit Test Pass - Teacher Dashboard Data Aggregated Correctly
 * Suggested Figure Title (System UI): Dashboard UI - Teacher Dashboard Overview
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TeacherDashboardService } from "../../backend-ts/src/modules/dashboard/teacher-dashboard.service.js"
import { createMockClass, createMockAssignment } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/modules/classes/class.repository.js")
vi.mock("../../backend-ts/src/modules/assignments/assignment.repository.js")

describe("TC-033: Teacher Dashboard Data", () => {
  let teacherDashboardService: TeacherDashboardService
  let mockClassRepo: any
  let mockAssignmentRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockClassRepo = {
      getRecentClassesWithStudentCounts: vi.fn().mockResolvedValue([]),
      getClassesByTeacher: vi.fn().mockResolvedValue([]),
    }

    mockAssignmentRepo = {
      getAssignmentsByClassIds: vi.fn().mockResolvedValue([]),
      getPendingTasksForTeacher: vi.fn().mockResolvedValue([]),
    }

    teacherDashboardService = new TeacherDashboardService(mockClassRepo, mockAssignmentRepo)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should return recent classes and pending tasks for the teacher", async () => {
    const mockClassWithCount = { ...createMockClass({ id: 1, teacherId: 2 }), studentCount: 10 }

    mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue([mockClassWithCount])
    mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue([
      createMockAssignment({ id: 1, classId: 1 }),
    ])
    mockAssignmentRepo.getPendingTasksForTeacher.mockResolvedValue([
      { assignmentId: 1, assignmentName: "Functions Exercise", classId: 1, className: "CS101", ungraded: 5 },
    ])

    const result = await teacherDashboardService.getDashboardData(2)

    expect(result.recentClasses).toHaveLength(1)
    expect(result.recentClasses[0].id).toBe(1)
    expect(result.pendingTasks).toHaveLength(1)
    expect(result.pendingTasks[0].assignmentName).toBe("Functions Exercise")
  })

  it("should return empty arrays when teacher has no classes or pending tasks", async () => {
    const result = await teacherDashboardService.getDashboardData(99)

    expect(result.recentClasses).toEqual([])
    expect(result.pendingTasks).toEqual([])
  })
})
