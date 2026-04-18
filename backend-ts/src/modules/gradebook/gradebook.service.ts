import { injectable, inject } from "tsyringe"
import { GradebookRepository } from "@/modules/gradebook/gradebook-query.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import {
  LatePenaltyService,
  type PenaltyResult,
} from "@/modules/assignments/late-penalty.service.js"
import { TestResultRepository } from "@/modules/test-cases/test-result.repository.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import type { PlagiarismAutoAnalysisService } from "@/modules/plagiarism/plagiarism-auto-analysis.service.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { withTransaction } from "@/shared/transaction.js"
import { buildSubmissionGradeComputation, type GradeBreakdown } from "@/modules/submissions/submission-grade.js"
import {
  buildSubmissionNotificationUrl,
  formatSubmissionLatenessText,
} from "@/modules/notifications/submission-grade-notification.js"

const logger = createLogger("GradebookService")

/**
 * Grade entry for a single assignment in the gradebook.
 */
export interface GradeEntry {
  assignmentId: number
  assignmentName: string
  totalScore: number
  deadline: Date | null
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
  gradeBreakdown: GradeBreakdown
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
 * grade aggregation, overrides, and exports.
 */
@injectable()
export class GradebookService {
  constructor(
    @inject(DI_TOKENS.repositories.gradebook)
    private gradebookRepo: GradebookRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.services.latePenalty)
    private latePenaltyService: LatePenaltyService,
    @inject(DI_TOKENS.repositories.testResult)
    private testResultRepo: TestResultRepository,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
    @inject(DI_TOKENS.repositories.similarity)
    private similarityRepo: SimilarityRepository,
    @inject(DI_TOKENS.services.plagiarismAutoAnalysis)
    private plagiarismAutoAnalysisService: PlagiarismAutoAnalysisService,
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
    // STEP 1: Load the submission and its parent assignment
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

    // STEP 2: Validate the override grade is a whole number within the assignment's score bounds
    if (!Number.isInteger(grade) || grade < 0 || grade > assignment.totalScore) {
      throw new Error(`Grade must be a whole number between 0 and ${assignment.totalScore}`)
    }

    // STEP 3: Persist the grade override and create an in-app notification in a single transaction
    try {
      await withTransaction(async (transactionContext) => {
        const transactionSubmissionRepo =
          this.submissionRepo.withContext(transactionContext)
        const transactionNotificationService =
          this.notificationService.withContext(transactionContext)

        await transactionSubmissionRepo.setGradeOverride(
          submissionId,
          grade,
          feedback,
        )
        await transactionNotificationService.createNotification(
          submission.studentId,
          "SUBMISSION_GRADED",
          {
            submissionId: submission.id,
            assignmentId: assignment.id,
            assignmentTitle: assignment.assignmentName,
            grade,
            maxGrade: assignment.totalScore,
            submissionUrl: buildSubmissionNotificationUrl(
              settings.frontendUrl,
              assignment.id,
            ),
            reason: "grade_override",
            previousGrade: submission.grade ?? undefined,
          },
        )
      })
    } catch (error) {
      logger.error("Failed to persist grade override notification", {
        submissionId,
        studentId: submission.studentId,
        error,
      })
      throw error
    }

    // STEP 4: Send an email notification to the student (fire-and-forget)
    void this.notificationService
      .sendEmailNotificationIfEnabled(
        submission.studentId,
        "SUBMISSION_GRADED",
        {
          submissionId: submission.id,
          assignmentId: assignment.id,
          assignmentTitle: assignment.assignmentName,
          grade,
          maxGrade: assignment.totalScore,
          submissionUrl: buildSubmissionNotificationUrl(
            settings.frontendUrl,
            assignment.id,
          ),
          reason: "grade_override",
          previousGrade: submission.grade ?? undefined,
        },
      )
      .catch((error) => {
        logger.error("Failed to send grade notification email", {
          submissionId,
          studentId: submission.studentId,
          error,
        })
      })
  }

  /**
   * Set a manual grade for a submission that has no auto-calculated grade (e.g. no test cases).
   * Writes directly to the grade column — does NOT set the override flag.
   * Only the class teacher should be able to do this (enforced at controller level).
   */
  async setManualGrade(submissionId: number, grade: number): Promise<void> {
    // STEP 1: Load the submission and its parent assignment
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

    // STEP 2: Validate grade is a whole number within the assignment's score bounds
    if (!Number.isInteger(grade) || grade < 0 || grade > assignment.totalScore) {
      throw new Error(`Grade must be a whole number between 0 and ${assignment.totalScore}`)
    }

    // STEP 3: Apply the stored late penalty to arrive at the final grade.
    // penaltyApplied is a percentage (e.g. 20 means 20% of totalScore deducted).
    // This mirrors the auto-graded flow where the late penalty is deducted after the raw score is computed.
    const latePenaltyPoints = Math.round(
      assignment.totalScore * ((submission.penaltyApplied ?? 0) / 100),
    )
    const gradeAfterLatePenalty = Math.max(0, grade - latePenaltyPoints)

    // STEP 4: Persist and create an in-app notification in a single transaction
    try {
      await withTransaction(async (transactionContext) => {
        const transactionSubmissionRepo =
          this.submissionRepo.withContext(transactionContext)
        const transactionNotificationService =
          this.notificationService.withContext(transactionContext)

        await transactionSubmissionRepo.setManualGrade(
          submissionId,
          grade,
          gradeAfterLatePenalty,
        )
        await transactionNotificationService.createNotification(
          submission.studentId,
          "SUBMISSION_GRADED",
          {
            submissionId: submission.id,
            assignmentId: assignment.id,
            assignmentTitle: assignment.assignmentName,
            grade,
            maxGrade: assignment.totalScore,
            submissionUrl: buildSubmissionNotificationUrl(
              settings.frontendUrl,
              assignment.id,
            ),
            reason: "manual_grade",
          },
        )
      })
    } catch (error) {
      logger.error("Failed to persist manual grade notification", {
        submissionId,
        studentId: submission.studentId,
        error,
      })
      throw error
    }

    // STEP 5: Send an email notification to the student (fire-and-forget)
    void this.notificationService
      .sendEmailNotificationIfEnabled(
        submission.studentId,
        "SUBMISSION_GRADED",
        {
          submissionId: submission.id,
          assignmentId: assignment.id,
          assignmentTitle: assignment.assignmentName,
          grade,
          maxGrade: assignment.totalScore,
          submissionUrl: buildSubmissionNotificationUrl(
            settings.frontendUrl,
            assignment.id,
          ),
          reason: "manual_grade",
        },
      )
      .catch((error) => {
        logger.error("Failed to send manual grade notification email", {
          submissionId,
          studentId: submission.studentId,
          error,
        })
      })

    if (gradeAfterLatePenalty !== grade) {
      const latePenaltyNotificationPayload = {
        submissionId: submission.id,
        assignmentId: assignment.id,
        assignmentTitle: assignment.assignmentName,
        grade: gradeAfterLatePenalty,
        maxGrade: assignment.totalScore,
        submissionUrl: buildSubmissionNotificationUrl(
          settings.frontendUrl,
          assignment.id,
        ),
        reason: "late_penalty_applied" as const,
        previousGrade: grade,
        deductedPoints: grade - gradeAfterLatePenalty,
        latenessText: this.buildSubmissionLatenessText(
          submission.submittedAt,
          assignment.deadline,
        ),
      }

      try {
        await this.notificationService.createNotification(
          submission.studentId,
          "SUBMISSION_GRADED",
          latePenaltyNotificationPayload,
        )
      } catch (error) {
        logger.error("Failed to persist late penalty notification", {
          submissionId,
          studentId: submission.studentId,
          error,
        })
      }

      void this.notificationService
        .sendEmailNotificationIfEnabled(
          submission.studentId,
          "SUBMISSION_GRADED",
          latePenaltyNotificationPayload,
        )
        .catch((error) => {
          logger.error("Failed to send late penalty notification email", {
            submissionId,
            studentId: submission.studentId,
            error,
          })
        })
    }

    // STEP 6: Re-trigger similarity analysis now that a grade exists.
    // This is necessary because when the student originally submitted, grade was null so
    // the automatic analysis skipped this submission. The debounce collapses rapid
    // teacher grading into a single analysis run.
    void this.plagiarismAutoAnalysisService
      .scheduleFromSubmission(assignment.id)
      .catch((error) => {
        logger.error("Failed to schedule similarity analysis after manual grade", {
          submissionId,
          assignmentId: assignment.id,
          error,
        })
      })
  }

  /**
   * Remove a grade override.
   */
  async removeOverride(submissionId: number): Promise<void> {
    const submission = await this.submissionRepo.getSubmissionById(submissionId)
    if (!submission) {
      throw new Error("Submission not found")
    }
    await this.submissionRepo.removeGradeOverride(submissionId)
  }

  private buildSubmissionLatenessText(
    submittedAt: Date,
    deadline: Date | null | undefined,
  ): string {
    if (!deadline) {
      return "You submitted late"
    }

    const hoursLate = Math.max(
      0,
      (submittedAt.getTime() - deadline.getTime()) / (1000 * 60 * 60),
    )

    return formatSubmissionLatenessText(hoursLate)
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
    if (penaltyConfig.enabled && assignment.deadline) {
      latePenalty = this.latePenaltyService.calculatePenalty(
        submission.submittedAt,
        assignment.deadline,
        penaltyConfig.config,
      )
    }

    const similarityScoreMap = await this.similarityRepo.getMaxSimilarityScoresBySubmissionIds([submission.id])

    const submissionGradeComputation = buildSubmissionGradeComputation({
      grade: submission.grade,
      originalGrade: submission.originalGrade,
      isGradeOverridden: submission.isGradeOverridden,
      overrideGrade: submission.overrideGrade,
      penaltyApplied: submission.penaltyApplied,
      similarityPenaltyApplied: submission.similarityPenaltyApplied,
      similarityScore: similarityScoreMap.get(submission.id) ?? null,
    })

    return {
      grade: submissionGradeComputation.effectiveGrade,
      gradeBreakdown: submissionGradeComputation.gradeBreakdown,
      isOverridden: submission.isGradeOverridden,
      feedback: submission.overrideReason,
      overriddenAt: submission.overriddenAt,
      testsPassed: testSummary?.passed ?? 0,
      testsTotal: testSummary?.total ?? 0,
      latePenalty,
    }
  }
}
