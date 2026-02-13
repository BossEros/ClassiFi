import { injectable, inject } from "tsyringe"
import { GradebookRepository } from "@/repositories/gradebook.repository.js"
import { SubmissionRepository } from "@/repositories/submission.repository.js"
import { AssignmentRepository } from "@/repositories/assignment.repository.js"
import { NotificationService } from "@/services/notification/notification.service.js"
import {
  LatePenaltyService,
  type PenaltyResult,
} from "@/services/latePenalty.service.js"
import { TestResultRepository } from "@/repositories/testResult.repository.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("GradebookService")

/**
 * Grade entry for a single assignment in the gradebook.
 */
export interface GradeEntry {
  assignmentId: number
  assignmentName: string
  totalScore: number
  deadline: Date
  submissionId: number | null
  grade: number | null
  percentage: number | null
  isOverridden: boolean
  feedback: string | null
  submittedAt: Date | null
  isLate: boolean
  latePenalty: PenaltyResult | null
}

/**
 * Detailed grade information for a specific submission.
 */
export interface SubmissionGradeDetails {
  grade: number | null
  isOverridden: boolean
  feedback: string | null
  overriddenAt: Date | null
  testsPassed: number
  testsTotal: number
  latePenalty: PenaltyResult | null
}

/**
 * Gradebook Service
 * Handles all gradebook-related business logic including
 * grade aggregation, overrides, exports, and statistics.
 */
@injectable()
export class GradebookService {
  constructor(
    @inject(GradebookRepository)
    private gradebookRepo: GradebookRepository,
    @inject(SubmissionRepository)
    private submissionRepo: SubmissionRepository,
    @inject(AssignmentRepository)
    private assignmentRepo: AssignmentRepository,
    @inject(LatePenaltyService)
    private latePenaltyService: LatePenaltyService,
    @inject(TestResultRepository)
    private testResultRepo: TestResultRepository,
    @inject("NotificationService")
    private notificationService: NotificationService,
  ) {}

  /**
   * Get the complete gradebook for a class.
   * Returns all students with their grades for all assignments.
   */
  async getClassGradebook(classId: number) {
    return await this.gradebookRepo.getClassGradebook(classId)
  }

  /**
   * Get grades for a student, optionally filtered by class.
   */
  async getStudentGrades(studentId: number, classId?: number) {
    return await this.gradebookRepo.getStudentGrades(studentId, classId)
  }

  /**
   * Get class statistics.
   */
  async getClassStatistics(classId: number) {
    return await this.gradebookRepo.getClassStatistics(classId)
  }

  /**
   * Get student's rank in a class.
   */
  async getStudentRank(studentId: number, classId: number) {
    return await this.gradebookRepo.getStudentRank(studentId, classId)
  }

  /**
   * Override a grade for a submission.
   * Only the class teacher should be able to do this (enforced at controller level).
   */
  async overrideGrade(
    submissionId: number,
    grade: number,
    feedback: string | null,
  ): Promise<void> {
    // Validate grade
    const submission = await this.submissionRepo.getSubmissionById(submissionId)
    if (!submission) {
      throw new Error("Submission not found")
    }

    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId,
    )
    if (!assignment) {
      throw new Error("Assignment not found")
    }

    // Validate grade is within bounds
    if (grade < 0 || grade > assignment.totalScore) {
      throw new Error(`Grade must be between 0 and ${assignment.totalScore}`)
    }

    await this.submissionRepo.setGradeOverride(submissionId, grade, feedback)

    // Create notification for student
    this.notificationService
      .createNotification(submission.studentId, "SUBMISSION_GRADED", {
        submissionId: submission.id,
        assignmentId: assignment.id,
        assignmentTitle: assignment.assignmentName,
        grade,
        maxGrade: assignment.totalScore,
        submissionUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
      })
      .catch((error) => {
        logger.error("Failed to send grade notification:", error)
      })
  }

  /**
   * Remove a grade override and recalculate the grade from test results.
   */
  async removeOverride(submissionId: number): Promise<void> {
    const submission = await this.submissionRepo.getSubmissionById(submissionId)
    if (!submission) {
      throw new Error("Submission not found")
    }

    // Get original test results to recalculate grade
    const testSummary = await this.testResultRepo.calculateScore(submissionId)

    // Get assignment for total score
    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId,
    )
    if (!assignment) {
      throw new Error("Assignment not found")
    }

    // Calculate grade from test results
    let recalculatedGrade = 0
    if (testSummary && testSummary.total > 0) {
      recalculatedGrade = Math.floor(
        (testSummary.passed / testSummary.total) * assignment.totalScore,
      )
    }

    // Remove override and set recalculated grade
    await this.submissionRepo.removeGradeOverride(submissionId)
    await this.submissionRepo.updateGrade(submissionId, recalculatedGrade)
  }

  /**
   * Export class gradebook to CSV format.
   * Returns a CSV string.
   */
  async exportGradebookCSV(classId: number): Promise<string> {
    const gradebook = await this.gradebookRepo.getClassGradebook(classId)

    // Build CSV header
    const headers = [
      "Student Name",
      "Email",
      ...gradebook.assignments.map((a) => `${a.name} (/${a.totalScore})`),
      "Average",
    ]

    // Helper to escape CSV cells
    const escapeCsvCell = (cell: string | number | null) => {
      if (cell === null || cell === undefined) return ""
      return `"${cell.toString().replace(/"/g, '""')}"`
    }

    // Build CSV rows
    const rows = gradebook.students.map((student) => {
      const gradeValues = student.grades.map((g) =>
        g.grade !== null ? g.grade.toString() : "",
      )

      // Calculate average
      const validGrades: number[] = []
      student.grades.forEach((g, i) => {
        if (g.grade !== null) {
          const assignment = gradebook.assignments[i]
          if (assignment && assignment.totalScore > 0) {
            validGrades.push((g.grade / assignment.totalScore) * 100)
          }
        }
      })

      const average =
        validGrades.length > 0
          ? Math.round(
              validGrades.reduce((a, b) => a + b, 0) / validGrades.length,
            )
          : ""

      return [student.name, student.email, ...gradeValues, average.toString()]
    })

    // Convert to CSV string
    const csvContent = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map(escapeCsvCell).join(",")),
    ].join("\n")

    return csvContent
  }

  /**
   * Get detailed grade information for a specific submission.
   */
  async getSubmissionGradeDetails(
    submissionId: number,
  ): Promise<SubmissionGradeDetails | null> {
    const submission = await this.submissionRepo.getSubmissionById(submissionId)
    if (!submission) return null

    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId,
    )
    if (!assignment) return null

    // Get test results summary
    const testSummary = await this.testResultRepo.calculateScore(submissionId)

    // Calculate late penalty if applicable
    let latePenalty: PenaltyResult | null = null
    const penaltyConfig = await this.latePenaltyService.getAssignmentConfig(
      submission.assignmentId,
    )
    if (penaltyConfig.enabled) {
      latePenalty = this.latePenaltyService.calculatePenalty(
        submission.submittedAt,
        assignment.deadline,
        penaltyConfig.config,
      )
    }

    return {
      grade: submission.grade,
      isOverridden: submission.isGradeOverridden,
      feedback: submission.overrideFeedback,
      overriddenAt: submission.overriddenAt,
      testsPassed: testSummary?.passed ?? 0,
      testsTotal: testSummary?.total ?? 0,
      latePenalty,
    }
  }
}




