import { inject, injectable } from "tsyringe"
import { UserRepository } from "@/modules/users/user.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import type { AdminStats, ActivityItem } from "@/services/admin/admin.types.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Admin service for analytics and dashboard statistics.
 * Follows SRP - handles only analytics-related concerns.
 * Uses repositories for all database access (DIP).
 */
@injectable()
export class AdminAnalyticsService {
  constructor(
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.similarity)
    private similarityRepo: SimilarityRepository,
  ) {}

  /**
   * Get admin dashboard statistics.
   * Delegates to repositories for all counts.
   */
  async getAdminStats(): Promise<AdminStats> {
    // Get all counts from repositories
    const [roleMap, classCounts, submissionCount, reportCount] =
      await Promise.all([
        this.userRepo.getCountsByRole(),
        this.classRepo.getClassCounts(),
        this.submissionRepo.getTotalCount(),
        this.similarityRepo.getReportCount(),
      ])

    return {
      totalUsers:
        (roleMap["student"] || 0) +
        (roleMap["teacher"] || 0) +
        (roleMap["admin"] || 0),
      totalStudents: roleMap["student"] || 0,
      totalTeachers: roleMap["teacher"] || 0,
      totalAdmins: roleMap["admin"] || 0,
      totalClasses: classCounts.total,
      activeClasses: classCounts.active,
      totalSubmissions: submissionCount,
      totalPlagiarismReports: reportCount,
    }
  }

  /**
   * Get recent platform activity.
   * Delegates to repositories for data retrieval.
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    const activities: ActivityItem[] = []

    // Get recent users and classes from repositories
    const [recentUsers, recentClasses] = await Promise.all([
      this.userRepo.getRecentUsers(limit),
      this.classRepo.getRecentClassesWithTeacher(limit),
    ])

    // Build user activity items
    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: "user_registered",
        description: "registered as",
        user: `${user.firstName} ${user.lastName}`,
        target: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        timestamp: user.createdAt ?? new Date(),
      })
    })

    // Build class activity items
    recentClasses.forEach((row) => {
      activities.push({
        id: `class-${row.class.id}`,
        type: "class_created",
        description: "created class",
        user: row.teacherName,
        target: row.class.className,
        timestamp: row.class.createdAt ?? new Date(),
      })
    })

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }
}