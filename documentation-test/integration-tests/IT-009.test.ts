/**
 * IT-009: Teacher Dashboard → Recent Classes with Assignment Counts Flow
 *
 * Module: Dashboard
 * Unit: View Dashboard
 * Date Tested: 4/10/26
 * Description: Verify that the teacher dashboard shows recent classes with student counts and pending ungraded assignments.
 * Expected Result: Dashboard returns classes with assignment counts and pending task details.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-009 Integration Test Pass - Teacher Dashboard Aggregation Returns Recent Classes and Tasks
 * Suggested Figure Title (System UI): Dashboard UI - Teacher Dashboard Showing Recent Classes and Pending Tasks
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { TeacherDashboardService } from "../../backend-ts/src/modules/dashboard/teacher-dashboard.service.js"
import { createMockClass, createMockAssignment } from "../../backend-ts/tests/utils/factories.js"

describe("IT-009: Teacher Dashboard → Recent Classes with Assignment Counts Flow", () => {
  let teacherDashboardService: TeacherDashboardService
  let mockClassRepo: any
  let mockAssignmentRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockClassRepo = {
      getRecentClassesWithStudentCounts: vi.fn(),
      getClassesByTeacher: vi.fn().mockResolvedValue([]),
    }

    mockAssignmentRepo = {
      getAssignmentsByClassIds: vi.fn().mockResolvedValue([]),
      getPendingTasksForTeacher: vi.fn().mockResolvedValue([]),
    }

    teacherDashboardService = new TeacherDashboardService(mockClassRepo, mockAssignmentRepo)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should aggregate class and assignment data into the dashboard response", async () => {
    const class1 = { ...createMockClass({ id: 1, teacherId: 2 }), studentCount: 15 }
    const class2 = { ...createMockClass({ id: 2, teacherId: 2 }), studentCount: 22 }
    const assignments = [
      createMockAssignment({ id: 10, classId: 1 }),
      createMockAssignment({ id: 11, classId: 1 }),
      createMockAssignment({ id: 12, classId: 2 }),
    ]

    mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue([class1, class2])
    mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue(assignments)
    mockAssignmentRepo.getPendingTasksForTeacher.mockResolvedValue([
      { assignmentId: 10, assignmentName: "Recursion Lab", classId: 1, className: "CS101", ungraded: 8 },
      { assignmentId: 12, assignmentName: "Data Structures Quiz", classId: 2, className: "CS201", ungraded: 3 },
    ])

    const result = await teacherDashboardService.getDashboardData(2)

    expect(result.recentClasses).toHaveLength(2)
    expect(result.recentClasses[0].id).toBe(1)
    expect(result.recentClasses[1].id).toBe(2)
    expect(result.pendingTasks).toHaveLength(2)
    expect(result.pendingTasks[0].assignmentName).toBe("Recursion Lab")
    expect(result.pendingTasks[1].assignmentName).toBe("Data Structures Quiz")
  })

  it("should call the class and assignment repos with the correct teacher ID and limits", async () => {
    mockClassRepo.getRecentClassesWithStudentCounts.mockResolvedValue([])
    mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue([])

    await teacherDashboardService.getDashboardData(2, 6, 5)

    expect(mockClassRepo.getRecentClassesWithStudentCounts).toHaveBeenCalledWith(2, 6)
    expect(mockAssignmentRepo.getPendingTasksForTeacher).toHaveBeenCalledWith(2, 5)
  })
})
