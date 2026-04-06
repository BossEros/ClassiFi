import { inject, injectable } from "tsyringe"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { UserRepository } from "@/modules/users/user.repository.js"
import { PlagiarismPersistenceService } from "@/modules/plagiarism/plagiarism-persistence.service.js"
import { TestResultRepository } from "@/modules/test-cases/test-result.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import {
  normalizeSimilarityPenaltyConfig,
  DEFAULT_SIMILARITY_PENALTY_CONFIG,
  type SimilarityPenaltyConfig,
} from "@/modules/assignments/similarity-penalty-config.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import type { Assignment } from "@/modules/assignments/assignment.model.js"
import type { Submission } from "@/modules/submissions/submission.model.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { fireAndForget, settlePromisesAndLogRejections } from "@/shared/utils.js"

interface SubmissionPenaltyCandidate {
  penaltyPercent: number
  sourceHybridScore: number
}

const logger = createLogger("SimilarityPenaltyService")

@injectable()
export class SimilarityPenaltyService {
  constructor(
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.similarity)
    private similarityRepo: SimilarityRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.services.plagiarismPersistence)
    private persistenceService: PlagiarismPersistenceService,
    @inject(DI_TOKENS.repositories.testResult)
    private testResultRepo: TestResultRepository,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
  ) {}

  /**
   * Returns the system-wide default similarity penalty configuration.
   */
  getDefaultConfig(): SimilarityPenaltyConfig {
    return normalizeSimilarityPenaltyConfig(DEFAULT_SIMILARITY_PENALTY_CONFIG)
  }

  /**
   * Retrieves the similarity penalty configuration for an assignment.
   * Falls back to the system default when no custom config has been set.
   *
   * @param assignmentId - The assignment to fetch the config for.
   * @returns The enabled flag and the resolved config.
   */
  async getAssignmentConfig(
    assignmentId: number,
  ): Promise<{ enabled: boolean; config: SimilarityPenaltyConfig }> {
    const storedConfig =
      await this.assignmentRepo.getSimilarityPenaltyConfig(assignmentId)

    if (!storedConfig) {
      return { enabled: false, config: this.getDefaultConfig() }
    }

    return {
      enabled: storedConfig.enabled,
      config: normalizeSimilarityPenaltyConfig(storedConfig.config),
    }
  }

  /**
   * Persists the similarity penalty configuration for an assignment.
   * Validates band values before writing.
   *
   * @param assignmentId - The assignment to configure.
   * @param enabled - Whether similarity penalty enforcement is active.
   * @param config - The penalty config to store, or null to reset to default.
   * @returns true when the update succeeded.
   */
  async setAssignmentConfig(
    assignmentId: number,
    enabled: boolean,
    config: SimilarityPenaltyConfig | null,
  ): Promise<boolean> {
    const configToValidate = config ?? DEFAULT_SIMILARITY_PENALTY_CONFIG

    if (
      configToValidate.warningThreshold < 0 ||
      configToValidate.warningThreshold > 1
    ) {
      throw new Error(
        "Invalid similarity penalty configuration: warningThreshold must be between 0 and 1",
      )
    }

    if (configToValidate.maxPenaltyPercent < 0 || configToValidate.maxPenaltyPercent > 100) {
      throw new Error(
        "Invalid similarity penalty configuration: maxPenaltyPercent must be between 0 and 100",
      )
    }

    for (const band of configToValidate.deductionBands) {
      if (band.minHybridScore < 0 || band.minHybridScore > 1) {
        throw new Error(
          "Invalid similarity penalty configuration: band minHybridScore must be between 0 and 1",
        )
      }

      if (band.penaltyPercent < 0 || band.penaltyPercent > 100) {
        throw new Error(
          "Invalid similarity penalty configuration: band penaltyPercent must be between 0 and 100",
        )
      }
    }

    const normalizedConfig = config ? normalizeSimilarityPenaltyConfig(config) : null

    return await this.assignmentRepo.setSimilarityPenaltyConfig(
      assignmentId,
      enabled,
      normalizedConfig,
    )
  }

  async syncAssignmentPenaltyState(assignmentId: number): Promise<void> {
    // STEP 1: Load the assignment and its current set of latest submissions
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    const latestSubmissions =
      await this.submissionRepo.getSubmissionsByAssignment(assignmentId, true)

    if (!assignment) {
      return
    }

    // STEP 2: If similarity penalty is disabled, restore base automatic grades and exit
    if (!assignment.enableSimilarityPenalty) {
      await this.restoreAutomaticGrades(latestSubmissions, assignment)
      return
    }

    // STEP 3: Check whether a current similarity report exists to score against
    const reusableReportId =
      await this.persistenceService.getReusableAssignmentReportId(assignmentId)

    if (reusableReportId === null) {
      await this.restoreAutomaticGrades(latestSubmissions, assignment)
      return
    }

    // STEP 4: Apply similarity-based penalty deductions from the latest report
    await this.applyAssignmentPenaltyFromReport(assignmentId, reusableReportId)
  }

  async applyAssignmentPenaltyFromReport(
    assignmentId: number,
    reportId: number,
  ): Promise<void> {
    // STEP 1: Load the assignment and all current latest submissions
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    const latestSubmissions =
      await this.submissionRepo.getSubmissionsByAssignment(assignmentId, true)

    if (!assignment) {
      return
    }

    // STEP 2: If penalty is disabled, restore base automatic grades and exit
    if (!assignment.enableSimilarityPenalty) {
      await this.restoreAutomaticGrades(latestSubmissions, assignment)
      return
    }

    // STEP 3: Load the normalized penalty configuration and build lookup structures
    const similarityPenaltyConfig = normalizeSimilarityPenaltyConfig(
      assignment.similarityPenaltyConfig,
    )
    const latestSubmissionIds = new Set(
      latestSubmissions.map((latestSubmission) => latestSubmission.id),
    )
    const submissionTimestampMap = new Map(
      latestSubmissions.map((latestSubmission) => [
        latestSubmission.id,
        latestSubmission.submittedAt,
      ]),
    )

    if (latestSubmissionIds.size === 0) {
      return
    }

    // STEP 4: Fetch all similarity results from this report and build a worst-case penalty map.
    // Only the submission that was submitted LATER in each flagged pair is penalized.
    // This protects the earlier submitter: if someone copies their work and submits after them,
    // only the later submitter is penalized — not the original author.
    // If timestamps are identical or unavailable, neither student is penalized.
    const reportResults = await this.similarityRepo.getResultsByReport(reportId)
    const candidateBySubmissionId = new Map<number, SubmissionPenaltyCandidate>()

    for (const reportResult of reportResults) {
      if (
        !latestSubmissionIds.has(reportResult.submission1Id) ||
        !latestSubmissionIds.has(reportResult.submission2Id)
      ) {
        continue
      }

      const penaltyCandidate = this.buildPenaltyCandidate(
        reportResult.hybridScore,
        reportResult.leftCovered,
        reportResult.rightCovered,
        reportResult.leftTotal,
        reportResult.rightTotal,
        reportResult.longestFragment,
        similarityPenaltyConfig,
      )

      if (!penaltyCandidate) {
        continue
      }

      const laterSubmissionId = this.resolveLaterSubmission(
        reportResult.submission1Id,
        reportResult.submission2Id,
        submissionTimestampMap,
      )

      if (laterSubmissionId === null) {
        continue
      }

      this.recordHigherPriorityCandidate(
        candidateBySubmissionId,
        laterSubmissionId,
        penaltyCandidate,
      )
    }

    // STEP 5: Apply the penalty to each submission's automatic grade and notify the student
    for (const latestSubmission of latestSubmissions) {
      const automaticGrade = await this.calculateAutomaticGrade(
        latestSubmission,
        assignment,
      )

      if (automaticGrade === null) {
        continue
      }

      const penaltyCandidate = candidateBySubmissionId.get(latestSubmission.id)
      const similarityPenaltyPercent = penaltyCandidate?.penaltyPercent ?? 0
      const adjustedGrade = penaltyCandidate
        ? this.applySimilarityPenalty(
            automaticGrade,
            penaltyCandidate.penaltyPercent,
            assignment.totalScore ?? 100,
          )
        : automaticGrade

      await this.submissionRepo.updateSimilarityPenalty(
        latestSubmission.id,
        similarityPenaltyPercent,
      )
      await this.submissionRepo.updateGrade(latestSubmission.id, adjustedGrade)
      await this.notifySimilarityDeductionIfNeeded(
        latestSubmission,
        assignment,
        automaticGrade,
        adjustedGrade,
        similarityPenaltyPercent,
        penaltyCandidate
          ? Math.round(penaltyCandidate.sourceHybridScore * 100)
          : 0,
      )
    }
  }

  private buildPenaltyCandidate(
    hybridScoreValue: string,
    _leftCovered: number,
    _rightCovered: number,
    _leftTotal: number,
    _rightTotal: number,
    _longestFragment: number,
    similarityPenaltyConfig: SimilarityPenaltyConfig,
  ): SubmissionPenaltyCandidate | null {
    const hybridScore = Number.parseFloat(hybridScoreValue)

    if (Number.isNaN(hybridScore)) {
      return null
    }

    if (hybridScore < similarityPenaltyConfig.warningThreshold) {
      return null
    }

    if (
      hybridScore < similarityPenaltyConfig.deductionBands[0]?.minHybridScore
    ) {
      return null
    }

    const matchingBand = [...similarityPenaltyConfig.deductionBands]
      .sort(
        (leftDeductionBand, rightDeductionBand) =>
          rightDeductionBand.minHybridScore - leftDeductionBand.minHybridScore,
      )
      .find((deductionBand) => hybridScore >= deductionBand.minHybridScore)

    if (!matchingBand) {
      return null
    }

    const penaltyPercent = Math.min(
      matchingBand.penaltyPercent,
      similarityPenaltyConfig.maxPenaltyPercent,
    )

    return {
      penaltyPercent,
      sourceHybridScore: hybridScore,
    }
  }

  /**
   * Determines which of two submissions was submitted later.
   * Returns the ID of the later submission, or null if timestamps are unavailable
   * or identical (no basis to assign blame to either student).
   */
  private resolveLaterSubmission(
    submission1Id: number,
    submission2Id: number,
    submissionTimestampMap: Map<number, Date>,
  ): number | null {
    const time1 = submissionTimestampMap.get(submission1Id)
    const time2 = submissionTimestampMap.get(submission2Id)

    if (!time1 || !time2) return null
    if (time1.getTime() === time2.getTime()) return null

    return time1 > time2 ? submission1Id : submission2Id
  }

  private recordHigherPriorityCandidate(
    candidateBySubmissionId: Map<number, SubmissionPenaltyCandidate>,
    submissionId: number,
    nextCandidate: SubmissionPenaltyCandidate,
  ): void {
    const existingCandidate = candidateBySubmissionId.get(submissionId)

    if (!existingCandidate) {
      candidateBySubmissionId.set(submissionId, nextCandidate)
      return
    }

    if (nextCandidate.penaltyPercent > existingCandidate.penaltyPercent) {
      candidateBySubmissionId.set(submissionId, nextCandidate)
      return
    }

    if (
      nextCandidate.penaltyPercent === existingCandidate.penaltyPercent &&
      nextCandidate.sourceHybridScore > existingCandidate.sourceHybridScore
    ) {
      candidateBySubmissionId.set(submissionId, nextCandidate)
    }
  }

  private async restoreAutomaticGrades(
    latestSubmissions: Submission[],
    assignment: Assignment,
  ): Promise<void> {
    for (const latestSubmission of latestSubmissions) {
      const automaticGrade = await this.calculateAutomaticGrade(
        latestSubmission,
        assignment,
      )

      if (automaticGrade === null) {
        continue
      }

      await this.submissionRepo.updateSimilarityPenalty(latestSubmission.id, 0)
      await this.submissionRepo.updateGrade(latestSubmission.id, automaticGrade)
    }
  }

  private async calculateAutomaticGrade(
    submission: Submission,
    assignment: Assignment,
  ): Promise<number | null> {
    const totalScore = assignment.totalScore ?? 100
    const testSummary = await this.testResultRepo.calculateScore(submission.id)

    let automaticGrade: number | null = null

    if (testSummary.total > 0) {
      automaticGrade = Math.floor((testSummary.passed / testSummary.total) * totalScore)
    } else if (submission.grade !== null) {
      automaticGrade = totalScore
    }

    if (automaticGrade === null) {
      return null
    }

    if ((submission.penaltyApplied ?? 0) <= 0) {
      return automaticGrade
    }

    const latePenaltyPoints = Math.round(totalScore * ((submission.penaltyApplied ?? 0) / 100))
    return Math.max(0, automaticGrade - latePenaltyPoints)
  }

  private applySimilarityPenalty(
    automaticGrade: number,
    penaltyPercent: number,
    totalScore: number,
  ): number {
    const penaltyPoints = Math.round(totalScore * (penaltyPercent / 100))
    return Math.max(0, automaticGrade - penaltyPoints)
  }

  private async notifySimilarityDeductionIfNeeded(
    submission: Submission,
    assignment: Assignment,
    automaticGrade: number,
    adjustedGrade: number,
    penaltyPercent: number,
    similarityPercentage: number,
  ): Promise<void> {
    if (penaltyPercent <= 0 || submission.isGradeOverridden) {
      return
    }

    if (adjustedGrade >= automaticGrade || submission.grade === adjustedGrade) {
      return
    }

    const notificationPayload = {
      submissionId: submission.id,
      assignmentId: assignment.id,
      assignmentTitle: assignment.assignmentName,
      grade: adjustedGrade,
      maxGrade: assignment.totalScore ?? 100,
      submissionUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
      reason: "similarity_deduction" as const,
      previousGrade: automaticGrade,
      deductedPoints: automaticGrade - adjustedGrade,
    }

    try {
      await this.notificationService.createNotification(
        submission.studentId,
        "SUBMISSION_GRADED",
        notificationPayload,
      )
    } catch (error) {
      logger.error("Failed to persist similarity deduction notification", {
        submissionId: submission.id,
        studentId: submission.studentId,
        error,
      })
    }

    fireAndForget(
      this.notificationService.sendEmailNotificationIfEnabled(
        submission.studentId,
        "SUBMISSION_GRADED",
        notificationPayload,
      ),
      logger,
      "Failed to send similarity deduction notification email",
      { submissionId: submission.id, studentId: submission.studentId },
    )

    // Notify teacher about similarity detection (fire-and-forget)
    fireAndForget(
      this.sendSimilarityDetectedToTeacher(
        submission,
        assignment,
        similarityPercentage,
      ),
      logger,
      "Failed to send similarity detected notification to teacher",
      { submissionId: submission.id },
    )
  }

  /**
   * Sends SIMILARITY_DETECTED notification to the teacher of the class.
   */
  private async sendSimilarityDetectedToTeacher(
    submission: Submission,
    assignment: Assignment,
    similarityPercentage: number,
  ): Promise<void> {
    const [classData, student] = await Promise.all([
      this.classRepo.getClassById(assignment.classId),
      this.userRepo.getUserById(submission.studentId),
    ])

    if (!classData) return

    const similarityData = {
      assignmentId: assignment.id,
      assignmentTitle: assignment.assignmentName,
      className: classData.className,
      classId: classData.id,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      similarityPercentage,
      submissionUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}/submissions/${submission.id}`,
    }

    await settlePromisesAndLogRejections([
      this.notificationService.createNotification(classData.teacherId, "SIMILARITY_DETECTED", similarityData),
      this.notificationService.sendEmailNotificationIfEnabled(classData.teacherId, "SIMILARITY_DETECTED", similarityData),
    ], logger, "Failed to send similarity detected notification to teacher", {
      teacherId: classData.teacherId,
      submissionId: submission.id,
      assignmentId: assignment.id,
    })
  }
}
