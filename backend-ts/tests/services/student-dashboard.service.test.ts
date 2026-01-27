/**
 * StudentDashboardService Unit Tests
 * Comprehensive tests for student dashboard operations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { StudentDashboardService } from "../../src/services/student-dashboard.service.js"
import {
  createMockClass,
  createMockAssignment,
  createMockUser,
} from "../utils/factories.js"
import {
  ClassNotFoundError,
  ClassInactiveError,
  AlreadyEnrolledError,
  NotEnrolledError,
} from "../../src/shared/errors.js"

describe("StudentDashboardService", () => {
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

    mockAssignmentRepo = {
      getAssignmentsByClassId: vi.fn(),
    }

    mockSubmissionRepo = {
      getLatestSubmission: vi.fn(),
    }

    mockUserRepo = {
      getUserById: vi.fn(),
    }

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

  // ============ getDashboardData Tests ============
  describe("getDashboardData", () => {
    it("should return combined dashboard data", async () => {
      const mockClassesWithDetails = [
        {
          ...createMockClass({ id: 1 }),
          studentCount: 10,
          teacherName: "Test Teacher",
        },
      ]

      mockClassRepo.getClassesByStudentWithDetails.mockResolvedValue(
        mockClassesWithDetails,
      )
      mockClassRepo.getClassesByStudent.mockResolvedValue([
        createMockClass({ id: 1 }),
      ])
      mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue([])

      const result = await dashboardService.getDashboardData(1)

      expect(result.enrolledClasses).toBeDefined()
      expect(result.pendingAssignments).toBeDefined()
    })

    it("should respect limit parameters", async () => {
      mockClassRepo.getClassesByStudentWithDetails.mockResolvedValue([])
      mockClassRepo.getClassesByStudent.mockResolvedValue([])
      mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue([])

      await dashboardService.getDashboardData(1, 5, 3)

      // Verify getClassesByStudentWithDetails is called
      expect(mockClassRepo.getClassesByStudentWithDetails).toHaveBeenCalled()
    })
  })

  // ============ getEnrolledClasses Tests ============
  describe("getEnrolledClasses", () => {
    it("should return enrolled classes with teacher names", async () => {
      const mockClassesWithDetails = [
        {
          ...createMockClass({ id: 1, teacherId: 2 }),
          studentCount: 10,
          teacherName: "John Doe",
        },
        {
          ...createMockClass({ id: 2, teacherId: 3 }),
          studentCount: 10,
          teacherName: "Jane Smith",
        },
      ]

      mockClassRepo.getClassesByStudentWithDetails.mockResolvedValue(
        mockClassesWithDetails,
      )

      const result = await dashboardService.getEnrolledClasses(1)

      expect(result).toHaveLength(2)
      expect(result[0].teacherName).toBe("John Doe")
      expect(result[1].teacherName).toBe("Jane Smith")
    })

    it("should apply limit when provided", async () => {
      const mockClassesWithDetails = [
        {
          ...createMockClass({ id: 1 }),
          studentCount: 5,
          teacherName: "Test Teacher",
        },
        {
          ...createMockClass({ id: 2 }),
          studentCount: 5,
          teacherName: "Test Teacher",
        },
        {
          ...createMockClass({ id: 3 }),
          studentCount: 5,
          teacherName: "Test Teacher",
        },
      ]

      mockClassRepo.getClassesByStudentWithDetails.mockResolvedValue(
        mockClassesWithDetails,
      )

      const result = await dashboardService.getEnrolledClasses(1, 2)

      expect(result).toHaveLength(2)
    })

    it("should handle classes with teacher info from batch query", async () => {
      // With batch query, teacher info is always included
      const mockClassesWithDetails = [
        {
          ...createMockClass({ id: 1, teacherId: 999 }),
          studentCount: 5,
          teacherName: "Unknown Teacher",
        },
      ]

      mockClassRepo.getClassesByStudentWithDetails.mockResolvedValue(
        mockClassesWithDetails,
      )

      const result = await dashboardService.getEnrolledClasses(1)

      expect(result[0].teacherName).toBe("Unknown Teacher")
    })
  })

  // ============ getPendingAssignments Tests ============
  describe("getPendingAssignments", () => {
    it("should return pending assignments sorted by deadline", async () => {
      const now = Date.now()
      const mockClasses = [createMockClass({ id: 1 })]
      const assignments = [
        createMockAssignment({ id: 1, deadline: new Date(now + 200000) }),
        createMockAssignment({ id: 2, deadline: new Date(now + 100000) }),
      ]

      mockClassRepo.getClassesByStudent.mockResolvedValue(mockClasses)
      mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments)
      mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null)

      const result = await dashboardService.getPendingAssignments(1)

      expect(result).toHaveLength(2)
      // Should be sorted by deadline ascending
      expect(new Date(result[0].deadline).getTime()).toBeLessThan(
        new Date(result[1].deadline).getTime(),
      )
    })

    it("should exclude assignments with past deadlines", async () => {
      const mockClasses = [createMockClass({ id: 1 })]
      const pastDeadline = new Date(Date.now() - 10000)
      const futureDeadline = new Date(Date.now() + 100000)
      const assignments = [
        createMockAssignment({ id: 1, deadline: pastDeadline }),
        createMockAssignment({ id: 2, deadline: futureDeadline }),
      ]

      mockClassRepo.getClassesByStudent.mockResolvedValue(mockClasses)
      mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments)
      mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null)

      const result = await dashboardService.getPendingAssignments(1)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })

    it("should exclude assignments that student has submitted", async () => {
      const mockClasses = [createMockClass({ id: 1 })]
      const futureDeadline = new Date(Date.now() + 100000)
      const assignments = [
        createMockAssignment({ id: 1, deadline: futureDeadline }),
        createMockAssignment({ id: 2, deadline: futureDeadline }),
      ]

      mockClassRepo.getClassesByStudent.mockResolvedValue(mockClasses)
      mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments)
      mockSubmissionRepo.getLatestSubmission
        .mockResolvedValueOnce({ id: 1 }) // Assignment 1 has submission
        .mockResolvedValueOnce(null) // Assignment 2 has no submission

      const result = await dashboardService.getPendingAssignments(1)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })

    it("should respect limit parameter", async () => {
      const mockClasses = [createMockClass({ id: 1 })]
      const futureDeadline = new Date(Date.now() + 100000)
      const assignments = [
        createMockAssignment({ id: 1, deadline: futureDeadline }),
        createMockAssignment({ id: 2, deadline: futureDeadline }),
        createMockAssignment({ id: 3, deadline: futureDeadline }),
      ]

      mockClassRepo.getClassesByStudent.mockResolvedValue(mockClasses)
      mockAssignmentRepo.getAssignmentsByClassId.mockResolvedValue(assignments)
      mockSubmissionRepo.getLatestSubmission.mockResolvedValue(null)

      const result = await dashboardService.getPendingAssignments(1, 2)

      expect(result).toHaveLength(2)
    })

    it("should return empty array when no enrolled classes", async () => {
      mockClassRepo.getClassesByStudent.mockResolvedValue([])

      const result = await dashboardService.getPendingAssignments(1)

      expect(result).toHaveLength(0)
    })
  })

  // ============ joinClass Tests ============
  describe("joinClass", () => {
    it("should successfully join a class", async () => {
      const mockClass = createMockClass({
        id: 1,
        classCode: "ABC123",
        isActive: true,
      })
      const teacher = createMockUser({
        id: 2,
        firstName: "Test",
        lastName: "Teacher",
      })

      mockClassRepo.getClassByCode.mockResolvedValue(mockClass)
      mockEnrollmentRepo.isEnrolled.mockResolvedValue(false)
      mockEnrollmentRepo.enrollStudent.mockResolvedValue(undefined)
      mockClassRepo.getStudentCount.mockResolvedValue(11)
      mockUserRepo.getUserById.mockResolvedValue(teacher)

      const result = await dashboardService.joinClass(1, "ABC123")

      expect(result.id).toBe(1)
      expect(result.teacherName).toBe("Test Teacher")
      expect(mockEnrollmentRepo.enrollStudent).toHaveBeenCalledWith(1, 1)
    })

    it("should throw ClassNotFoundError when class code is invalid", async () => {
      mockClassRepo.getClassByCode.mockResolvedValue(undefined)

      await expect(dashboardService.joinClass(1, "INVALID")).rejects.toThrow(
        ClassNotFoundError,
      )
    })

    it("should throw ClassInactiveError when class is inactive", async () => {
      const inactiveClass = createMockClass({ isActive: false })
      mockClassRepo.getClassByCode.mockResolvedValue(inactiveClass)

      await expect(dashboardService.joinClass(1, "ABC123")).rejects.toThrow(
        ClassInactiveError,
      )
    })

    it("should throw AlreadyEnrolledError when already enrolled", async () => {
      const mockClass = createMockClass({ isActive: true })
      mockClassRepo.getClassByCode.mockResolvedValue(mockClass)
      mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)

      await expect(dashboardService.joinClass(1, "ABC123")).rejects.toThrow(
        AlreadyEnrolledError,
      )
    })
  })

  // ============ leaveClass Tests ============
  describe("leaveClass", () => {
    it("should successfully leave a class", async () => {
      mockEnrollmentRepo.isEnrolled.mockResolvedValue(true)
      mockEnrollmentRepo.unenrollStudent.mockResolvedValue(undefined)

      await dashboardService.leaveClass(1, 1)

      expect(mockEnrollmentRepo.unenrollStudent).toHaveBeenCalledWith(1, 1)
    })

    it("should throw NotEnrolledError when not enrolled", async () => {
      mockEnrollmentRepo.isEnrolled.mockResolvedValue(false)

      await expect(dashboardService.leaveClass(1, 1)).rejects.toThrow(
        NotEnrolledError,
      )
    })
  })
})
