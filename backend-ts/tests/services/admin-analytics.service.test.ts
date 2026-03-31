import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { AdminAnalyticsService } from "../../src/modules/admin/admin-analytics.service.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import type { SimilarityRepository } from "../../src/modules/plagiarism/similarity.repository.js"

describe("AdminAnalyticsService", () => {
  let analyticsService: AdminAnalyticsService
  let mockUserRepo: Partial<MockedObject<UserRepository>>
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockSubmissionRepo: Partial<MockedObject<SubmissionRepository>>
  let mockSimilarityRepo: Partial<MockedObject<SimilarityRepository>>

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserRepo = {
      getCountsByRole: vi.fn(),
      getRecentUsers: vi.fn(),
    } as any

    mockClassRepo = {
      getClassCounts: vi.fn(),
      getRecentClassesWithTeacher: vi.fn(),
    } as any

    mockSubmissionRepo = {
      getTotalCount: vi.fn(),
    } as any

    mockSimilarityRepo = {
      getReportCount: vi.fn(),
    } as any

    analyticsService = new AdminAnalyticsService(
      mockUserRepo as unknown as UserRepository,
      mockClassRepo as unknown as ClassRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockSimilarityRepo as unknown as SimilarityRepository,
    )
  })

  describe("getAdminStats", () => {
    it("should aggregate statistics from all repositories", async () => {
      mockUserRepo.getCountsByRole!.mockResolvedValue({
        student: 50,
        teacher: 10,
        admin: 2,
      })
      mockClassRepo.getClassCounts!.mockResolvedValue({
        total: 15,
        active: 12,
      })
      mockSubmissionRepo.getTotalCount!.mockResolvedValue(200)
      mockSimilarityRepo.getReportCount!.mockResolvedValue(5)

      const stats = await analyticsService.getAdminStats()

      expect(stats).toEqual({
        totalUsers: 62,
        totalStudents: 50,
        totalTeachers: 10,
        totalAdmins: 2,
        totalClasses: 15,
        activeClasses: 12,
        totalSubmissions: 200,
        totalPlagiarismReports: 5,
      })
    })

    it("should handle zero counts gracefully", async () => {
      mockUserRepo.getCountsByRole!.mockResolvedValue({})
      mockClassRepo.getClassCounts!.mockResolvedValue({
        total: 0,
        active: 0,
      })
      mockSubmissionRepo.getTotalCount!.mockResolvedValue(0)
      mockSimilarityRepo.getReportCount!.mockResolvedValue(0)

      const stats = await analyticsService.getAdminStats()

      expect(stats.totalUsers).toBe(0)
      expect(stats.totalStudents).toBe(0)
      expect(stats.totalTeachers).toBe(0)
      expect(stats.totalAdmins).toBe(0)
    })

    it("should fetch all counts in parallel", async () => {
      mockUserRepo.getCountsByRole!.mockResolvedValue({ student: 1 })
      mockClassRepo.getClassCounts!.mockResolvedValue({
        total: 1,
        active: 1,
      })
      mockSubmissionRepo.getTotalCount!.mockResolvedValue(1)
      mockSimilarityRepo.getReportCount!.mockResolvedValue(1)

      await analyticsService.getAdminStats()

      expect(mockUserRepo.getCountsByRole).toHaveBeenCalledTimes(1)
      expect(mockClassRepo.getClassCounts).toHaveBeenCalledTimes(1)
      expect(mockSubmissionRepo.getTotalCount).toHaveBeenCalledTimes(1)
      expect(mockSimilarityRepo.getReportCount).toHaveBeenCalledTimes(1)
    })
  })

  describe("getRecentActivity", () => {
    it("should combine user and class activities sorted by timestamp", async () => {
      const recentDate = new Date("2026-03-30")
      const olderDate = new Date("2026-03-28")

      mockUserRepo.getRecentUsers!.mockResolvedValue([
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          role: "student",
          createdAt: recentDate,
          email: "john@example.com",
          supabaseUserId: "sub-1",
          avatarUrl: null,
          isActive: true,
          emailNotificationsEnabled: true,
          inAppNotificationsEnabled: true,
          updatedAt: null,
        },
      ])

      mockClassRepo.getRecentClassesWithTeacher!.mockResolvedValue([
        {
          class: {
            id: 1,
            className: "CS101",
            createdAt: olderDate,
            teacherId: 2,
            classCode: "ABC",
            description: null,
            semester: 1,
            academicYear: "2024-2025",
            schedule: { days: [], startTime: "09:00", endTime: "10:00" },
            isActive: true,
            allowLateSubmissions: false,
            latePenaltyConfig: null,
          },
          teacherName: "Jane Smith",
        },
      ])

      const activities = await analyticsService.getRecentActivity(10)

      expect(activities).toHaveLength(2)
      expect(activities[0].type).toBe("user_registered")
      expect(activities[1].type).toBe("class_created")
    })

    it("should limit results to the specified count", async () => {
      const users = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        firstName: `User${i}`,
        lastName: "Test",
        role: "student" as const,
        createdAt: new Date(2026, 2, 30 - i),
        email: `user${i}@example.com`,
        supabaseUserId: `sub-${i}`,
        avatarUrl: null,
        isActive: true,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        updatedAt: null,
      }))

      mockUserRepo.getRecentUsers!.mockResolvedValue(users)
      mockClassRepo.getRecentClassesWithTeacher!.mockResolvedValue([])

      const activities = await analyticsService.getRecentActivity(3)

      expect(activities).toHaveLength(3)
    })

    it("should default to 10 results when no limit specified", async () => {
      mockUserRepo.getRecentUsers!.mockResolvedValue([])
      mockClassRepo.getRecentClassesWithTeacher!.mockResolvedValue([])

      await analyticsService.getRecentActivity()

      expect(mockUserRepo.getRecentUsers).toHaveBeenCalledWith(10)
      expect(mockClassRepo.getRecentClassesWithTeacher).toHaveBeenCalledWith(10)
    })
  })
})
