import { inject, injectable } from "tsyringe"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import type { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import type { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import type { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import type { PlagiarismService } from "@/modules/plagiarism/plagiarism.service.js"

type AutoAnalysisTrigger = "submission" | "reconciliation" | "rerun"

const logger = createLogger("PlagiarismAutoAnalysisService")

/**
 * Coordinates automatic similarity analysis without introducing a new queue table.
 * Uses in-memory debounced scheduling plus periodic reconciliation against existing
 * submissions and similarity report tables.
 */
@injectable()
export class PlagiarismAutoAnalysisService {
  private scheduledTimers = new Map<number, ReturnType<typeof setTimeout>>()
  private inProgressAssignments = new Set<number>()
  private pendingReruns = new Set<number>()
  private reconciliationIntervalId: ReturnType<typeof setInterval> | null = null
  private isReconciliationRunning = false

  constructor(
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.similarity)
    private similarityRepo: SimilarityRepository,
    @inject(DI_TOKENS.services.plagiarism)
    private plagiarismService: PlagiarismService,
  ) {}

  /**
   * Starts the periodic reconciliation loop for automatic similarity analysis.
   */
  start(): void {
    if (!settings.autoSimilarityEnabled) {
      logger.info("Automatic similarity analysis is disabled")
      return
    }

    if (this.reconciliationIntervalId !== null) {
      return
    }

    this.reconciliationIntervalId = setInterval(
      () => void this.runReconciliationNow(),
      settings.autoSimilarityReconciliationIntervalMs,
    )

    logger.info("Automatic similarity analysis started", {
      debounceMs: settings.autoSimilarityDebounceMs,
      reconciliationIntervalMs: settings.autoSimilarityReconciliationIntervalMs,
      minLatestSubmissions: settings.autoSimilarityMinLatestSubmissions,
    })

    void this.runReconciliationNow()
  }

  /**
   * Stops reconciliation and clears all pending analysis timers.
   */
  stop(): void {
    for (const timerId of this.scheduledTimers.values()) {
      clearTimeout(timerId)
    }

    this.scheduledTimers.clear()
    this.pendingReruns.clear()
    this.inProgressAssignments.clear()

    if (this.reconciliationIntervalId !== null) {
      clearInterval(this.reconciliationIntervalId)
      this.reconciliationIntervalId = null
    }
  }

  /**
   * Schedules automatic similarity analysis after a successful submission.
   *
   * @param assignmentId - Assignment whose latest-submission set changed.
   */
  async scheduleFromSubmission(assignmentId: number): Promise<void> {
    if (!settings.autoSimilarityEnabled) {
      return
    }

    this.scheduleAssignmentAnalysis(
      assignmentId,
      settings.autoSimilarityDebounceMs,
      "submission",
    )
  }

  /**
   * Executes one reconciliation cycle immediately.
   */
  async runReconciliationNow(): Promise<void> {
    if (!settings.autoSimilarityEnabled || this.isReconciliationRunning) {
      return
    }

    this.isReconciliationRunning = true

    try {
      const latestSubmissionSnapshots =
        await this.submissionRepo.getLatestSubmissionSnapshots(
          settings.autoSimilarityMinLatestSubmissions,
        )

      for (const snapshot of latestSubmissionSnapshots) {
        const hasCurrentReport = await this.hasCurrentSimilarityReport(
          snapshot.assignmentId,
          snapshot.latestSubmissionCount,
          snapshot.latestSubmittedAt,
        )

        if (!hasCurrentReport) {
          this.scheduleAssignmentAnalysis(
            snapshot.assignmentId,
            0,
            "reconciliation",
          )
        }
      }
    } catch (error) {
      logger.error("Automatic similarity reconciliation failed", { error })
    } finally {
      this.isReconciliationRunning = false
    }
  }

  private scheduleAssignmentAnalysis(
    assignmentId: number,
    delayMs: number,
    trigger: AutoAnalysisTrigger,
  ): void {
    const existingTimer = this.scheduledTimers.get(assignmentId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timeoutId = setTimeout(() => {
      this.scheduledTimers.delete(assignmentId)
      void this.processAssignment(assignmentId, trigger)
    }, delayMs)

    this.scheduledTimers.set(assignmentId, timeoutId)
  }

  private async processAssignment(
    assignmentId: number,
    trigger: AutoAnalysisTrigger,
  ): Promise<void> {
    if (this.inProgressAssignments.has(assignmentId)) {
      this.pendingReruns.add(assignmentId)
      return
    }

    this.inProgressAssignments.add(assignmentId)

    try {
      const shouldAnalyze = await this.shouldAnalyzeAssignment(assignmentId)
      if (!shouldAnalyze) {
        return
      }

      await this.plagiarismService.analyzeAssignmentSubmissions(assignmentId)
      logger.info("Automatic similarity analysis completed", {
        assignmentId,
        trigger,
      })
    } catch (error) {
      logger.error("Automatic similarity analysis failed", {
        assignmentId,
        trigger,
        error,
      })
    } finally {
      this.inProgressAssignments.delete(assignmentId)

      if (this.pendingReruns.has(assignmentId)) {
        this.pendingReruns.delete(assignmentId)
        this.scheduleAssignmentAnalysis(assignmentId, 0, "rerun")
      }
    }
  }

  private async shouldAnalyzeAssignment(assignmentId: number): Promise<boolean> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    if (!assignment || !assignment.isActive) {
      return false
    }

    const latestSubmissions = await this.submissionRepo.getSubmissionsByAssignment(
      assignmentId,
      true,
    )
    if (
      latestSubmissions.length < settings.autoSimilarityMinLatestSubmissions
    ) {
      return false
    }

    const latestSubmittedAtMs = latestSubmissions.reduce(
      (currentLatest, submission) =>
        Math.max(currentLatest, new Date(submission.submittedAt).getTime()),
      0,
    )

    const latestReport = await this.similarityRepo.getLatestReportByAssignment(
      assignmentId,
    )
    if (!latestReport) {
      return true
    }

    if (latestReport.totalSubmissions !== latestSubmissions.length) {
      return true
    }

    return latestSubmittedAtMs > new Date(latestReport.generatedAt).getTime()
  }

  private async hasCurrentSimilarityReport(
    assignmentId: number,
    latestSubmissionCount: number,
    latestSubmittedAt: Date,
  ): Promise<boolean> {
    const latestReport = await this.similarityRepo.getLatestReportByAssignment(
      assignmentId,
    )

    if (!latestReport) {
      return false
    }

    if (latestReport.totalSubmissions !== latestSubmissionCount) {
      return false
    }

    return new Date(latestReport.generatedAt).getTime() >= latestSubmittedAt.getTime()
  }
}
