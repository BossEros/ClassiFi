import { inject, injectable } from "tsyringe"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { PlagiarismPersistenceService } from "@/modules/plagiarism/plagiarism-persistence.service.js"
import { TestResultRepository } from "@/modules/test-cases/test-result.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import {
  normalizeSimilarityPenaltyConfig,
  type SimilarityPenaltyConfig,
} from "@/modules/assignments/similarity-penalty-config.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import type { Assignment, Submission } from "@/models/index.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"

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
    @inject(DI_TOKENS.services.plagiarismPersistence)
    private persistenceService: PlagiarismPersistenceService,
    @inject(DI_TOKENS.repositories.testResult)
    private testResultRepo: TestResultRepository,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
  ) {}

  async syncAssignmentPenaltyState(assignmentId: number): Promise<void> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    const latestSubmissions =
      await this.submissionRepo.getSubmissionsByAssignment(assignmentId, true)

    if (!assignment) {
      return
    }

    if (!assignment.enableSimilarityPenalty) {
      await this.restoreAutomaticGrades(latestSubmissions, assignment)
      return
    }

    const reusableReportId =
      await this.persistenceService.getReusableAssignmentReportId(assignmentId)

    if (reusableReportId === null) {
      await this.restoreAutomaticGrades(latestSubmissions, assignment)
      return
    }

    await this.applyAssignmentPenaltyFromReport(assignmentId, reusableReportId)
  }

  async applyAssignmentPenaltyFromReport(
    assignmentId: number,
    reportId: number,
  ): Promise<void> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    const latestSubmissions =
      await this.submissionRepo.getSubmissionsByAssignment(assignmentId, true)

    if (!assignment) {
      return
    }

    if (!assignment.enableSimilarityPenalty) {
      await this.restoreAutomaticGrades(latestSubmissions, assignment)
      return
    }

    const similarityPenaltyConfig = normalizeSimilarityPenaltyConfig(
      undefined,
    )
    const latestSubmissionIds = new Set(
      latestSubmissions.map((latestSubmission) => latestSubmission.id),
    )

    if (latestSubmissionIds.size === 0) {
      return
    }

    const reportResults = await this.similarityRepo.getResultsByReport(reportId)
    const candidateBySubmissionId = new Map<
      number,
      SubmissionPenaltyCandidate
    >()

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

      this.recordHigherPriorityCandidate(
        candidateBySubmissionId,
        reportResult.submission1Id,
        penaltyCandidate,
      )
      this.recordHigherPriorityCandidate(
        candidateBySubmissionId,
        reportResult.submission2Id,
        penaltyCandidate,
      )
    }

    for (const latestSubmission of latestSubmissions) {
      const automaticGrade = await this.calculateAutomaticGrade(
        latestSubmission,
        assignment,
      )

      if (automaticGrade === null) {
        continue
      }

      const penaltyCandidate = candidateBySubmissionId.get(latestSubmission.id)
      const adjustedGrade = penaltyCandidate
        ? this.applySimilarityPenalty(
            automaticGrade,
            penaltyCandidate.penaltyPercent,
          )
        : automaticGrade

      await this.submissionRepo.updateGrade(latestSubmission.id, adjustedGrade)
      await this.notifySimilarityDeductionIfNeeded(
        latestSubmission,
        assignment,
        automaticGrade,
        adjustedGrade,
        penaltyCandidate?.penaltyPercent ?? 0,
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

    return Math.max(
      0,
      Math.round(
        automaticGrade * ((100 - (submission.penaltyApplied ?? 0)) / 100),
      ),
    )
  }

  private applySimilarityPenalty(
    automaticGrade: number,
    penaltyPercent: number,
  ): number {
    return Math.max(
      0,
      Math.round(automaticGrade * ((100 - penaltyPercent) / 100)),
    )
  }

  private async notifySimilarityDeductionIfNeeded(
    submission: Submission,
    assignment: Assignment,
    automaticGrade: number,
    adjustedGrade: number,
    penaltyPercent: number,
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

    void this.notificationService
      .sendEmailNotificationIfEnabled(
        submission.studentId,
        "SUBMISSION_GRADED",
        notificationPayload,
      )
      .catch((error) => {
        logger.error("Failed to send similarity deduction notification email", {
          submissionId: submission.id,
          studentId: submission.studentId,
          error,
        })
      })
  }
}
