import { inject, injectable } from "tsyringe"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { DashboardQueryRepository } from "@/modules/dashboard/dashboard-query.repository.js"
// Note: SubmissionRepository reserved for future use
import {
  toDashboardClassDTO,
  type DashboardClassDTO,
  type PendingTaskDTO,
  type AllTeacherAssignmentDTO,
} from "@/modules/dashboard/dashboard.mapper.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Business logic for teacher dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class TeacherDashboardService {
  constructor(
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.dashboardQuery)
    private dashboardQueryRepo?: DashboardQueryRepository,
  ) {}

  /** Get complete dashboard data for a teacher */
  async getDashboardData(
    teacherId: number,
    recentClassesLimit: number = 12,
    pendingTasksLimit: number = 10,
  ): Promise<{
    recentClasses: DashboardClassDTO[]
    pendingTasks: PendingTaskDTO[]
  }> {
    const recentClasses = await this.getRecentClasses(
      teacherId,
      recentClassesLimit,
    )
    const pendingTasks = await this.getPendingTasks(
      teacherId,
      pendingTasksLimit,
    )

    return {
      recentClasses,
      pendingTasks,
    }
  }

  /** Get recent classes for a teacher */
  async getRecentClasses(
    teacherId: number,
    limit: number = 5,
  ): Promise<DashboardClassDTO[]> {
    if (this.dashboardQueryRepo?.getRecentClassesForTeacher) {
      const classesWithCounts =
        await this.dashboardQueryRepo.getRecentClassesForTeacher(
          teacherId,
          limit,
        )

      return classesWithCounts.map((dashboardClass) =>
        toDashboardClassDTO(dashboardClass, {
          studentCount: dashboardClass.studentCount,
          assignmentCount: dashboardClass.assignmentCount,
        }),
      )
    }

    // Use optimized query that fetches student counts in a single query
    const classesWithCounts =
      await this.classRepo.getRecentClassesWithStudentCounts(teacherId, limit)

    // Optimized: Batch fetch assignments for all classes
    const classIds = classesWithCounts.map((c) => c.id)
    const assignments = await this.assignmentRepo.getAssignmentsByClassIds(
      classIds,
      true,
    )

    // Group assignments by classId
    const assignmentCountMap = new Map<number, number>()
    for (const assignment of assignments) {
      const count = assignmentCountMap.get(assignment.classId) || 0
      assignmentCountMap.set(assignment.classId, count + 1)
    }

    return classesWithCounts.map((c) =>
      toDashboardClassDTO(c, {
        studentCount: c.studentCount,
        assignmentCount: assignmentCountMap.get(c.id) || 0,
      }),
    )
  }

  /** Get pending tasks for a teacher (assignments needing review) */
  async getPendingTasks(
    teacherId: number,
    limit: number = 10,
  ): Promise<PendingTaskDTO[]> {
    const tasks = await this.assignmentRepo.getPendingTasksForTeacher(
      teacherId,
      limit,
    )

    return tasks.map((t) => ({
      id: t.id,
      assignmentName: t.assignmentName,
      className: t.className,
      classId: t.classId,
      deadline: t.deadline?.toISOString() ?? null,
      submittedCount: t.submittedCount,
      submissionCount: t.submissionCount,
      totalStudents: t.studentCount,
    }))
  }

  /** Get all assignments for a teacher across all active classes */
  async getAllAssignments(teacherId: number): Promise<AllTeacherAssignmentDTO[]> {
    if (!this.dashboardQueryRepo) {
      return []
    }

    const allAssignments = await this.dashboardQueryRepo.getAllAssignmentsForTeacher(teacherId)

    return allAssignments.map((a) => ({
      id: a.id,
      assignmentName: a.assignmentName,
      className: a.className,
      classCode: a.classCode,
      classId: a.classId,
      deadline: a.deadline?.toISOString() ?? null,
      submittedCount: a.submittedCount,
      ungradedSubmissionCount: a.ungradedSubmissionCount,
      totalStudents: a.studentCount,
      programmingLanguage: a.programmingLanguage,
    }))
  }
}
