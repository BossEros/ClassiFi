import { inject, injectable } from "tsyringe"
import {
  File,
  LanguageName,
  Report,
  Pair,
  Fragment,
} from "@/lib/plagiarism/index.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { PlagiarismDetectorFactory } from "@/modules/plagiarism/plagiarism-detector.factory.js"
import { PlagiarismSubmissionFileService } from "@/modules/plagiarism/plagiarism-submission-file.service.js"
import { PlagiarismPersistenceService } from "@/modules/plagiarism/plagiarism-persistence.service.js"
import { SemanticSimilarityClient } from "@/modules/plagiarism/semantic-similarity.client.js"
import {
  PLAGIARISM_CONFIG,
  PLAGIARISM_LANGUAGE_MAP,
  toPlagiarismPairDTO,
  toPlagiarismFragmentDTO,
  type PlagiarismFileDTO,
  type PlagiarismPairDTO,
  type PlagiarismFragmentDTO,
  type PlagiarismSummaryDTO,
} from "@/modules/plagiarism/plagiarism.mapper.js"
import {
  AssignmentNotFoundError,
  PlagiarismReportNotFoundError,
  PlagiarismResultNotFoundError,
  PlagiarismPairNotFoundError,
  InsufficientFilesError,
  UnsupportedLanguageError,
  LanguageRequiredError,
} from "@/shared/errors.js"
import type { MatchFragment } from "@/models/index.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { settings } from "@/shared/config.js"

/** Request body for analyzing files */
export interface AnalyzeRequest {
  files: Array<{
    id?: string
    path: string
    content: string
    studentId?: string
    studentName?: string
  }>
  language: LanguageName
  templateFile?: {
    path: string
    content: string
  }
  threshold?: number
  kgramLength?: number
}

/** Response for analyze endpoint */
export interface AnalyzeResponse {
  reportId: string
  isReusedReport: boolean
  generatedAt: string
  assignmentId?: number
  summary: PlagiarismSummaryDTO
  submissions: PlagiarismFileDTO[]
  pairs: PlagiarismPairDTO[]
  warnings: string[]
}

/** Response with pair details and fragments */
export interface PairDetailsResponse {
  pair: PlagiarismPairDTO
  fragments: PlagiarismFragmentDTO[]
  leftCode: string
  rightCode: string
}

/** Status response for assignment similarity review availability */
export interface AssignmentSimilarityStatusResponse {
  hasReusableReport: boolean
  reusableReportId: string | null
}

/** Detailed result with file contents and fragments */
export interface ResultDetailsResponse {
  result: {
    id: number
    submission1Id: number
    submission2Id: number
    structuralScore: string
    overlap: number
    longestFragment: number
  }
  fragments: PlagiarismFragmentDTO[]
  leftFile: {
    filename: string
    content: string
    lineCount: number
    studentName: string
  }
  rightFile: {
    filename: string
    content: string
    lineCount: number
    studentName: string
  }
}

/**
 * Business logic for plagiarism detection operations.
 * Refactored to use dedicated services for persistence and file operations.
 */
@injectable()
export class PlagiarismService {
  private static readonly LEGACY_REPORT_TTL_MS = 24 * 60 * 60 * 1000
  private static readonly MAX_LEGACY_REPORTS = 100

  /**
   * In-memory storage for ad-hoc reports (not tied to assignment submissions).
   * Kept for analyzeFiles flows that do not persist to the database.
   */
  private legacyReportsStore = new Map<string, { report: Report; createdAt: Date }>()

  /** Interval ID for cleanup timer - stored to allow cleanup in dispose(). */
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null

  constructor(
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.services.plagiarismDetectorFactory)
    private detectorFactory: PlagiarismDetectorFactory,
    @inject(DI_TOKENS.services.plagiarismSubmissionFile)
    private fileService: PlagiarismSubmissionFileService,
    @inject(DI_TOKENS.services.plagiarismPersistence)
    private persistenceService: PlagiarismPersistenceService,
    @inject(DI_TOKENS.services.semanticSimilarityClient)
    private semanticClient: SemanticSimilarityClient,
  ) {
    this.cleanupIntervalId = setInterval(
      () => this.cleanupExpiredReports(),
      60 * 60 * 1000,
    )
  }

  /**
   * Dispose of the service and clean up resources.
   * Should be called during application shutdown or test teardown.
   */
  public dispose(): void {
    if (this.cleanupIntervalId !== null) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }

    this.legacyReportsStore.clear()
  }

  /** Analyze files for plagiarism (ad-hoc analysis). */
  async analyzeFiles(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    this.validateAnalyzeRequest(request)

    const detector = this.detectorFactory.create({
      language: request.language,
      kgramLength: request.kgramLength,
    })

    const files = request.files.map(
      (file) =>
        new File(file.path, file.content, {
          studentId: file.studentId,
          studentName: file.studentName,
        }),
    )

    const ignoredFile = request.templateFile
      ? new File(request.templateFile.path, request.templateFile.content)
      : undefined

    const report = await detector.analyze(files, ignoredFile)

    this.cleanupExpiredReports()
    const createdAt = new Date()
    const reportId = this.generateReportId()
    this.legacyReportsStore.set(reportId, { report, createdAt })

    const threshold = request.threshold ?? PLAGIARISM_CONFIG.DEFAULT_THRESHOLD
    const summary = report.getSummary()
    const pairs = report.getPairs()

    return {
      reportId,
      isReusedReport: false,
      generatedAt: createdAt.toISOString(),
      summary: {
        totalFiles: summary.totalFiles,
        totalPairs: summary.totalPairs,
        suspiciousPairs: pairs.filter((pair) => pair.similarity >= threshold)
          .length,
        averageSimilarity: summary.averageSimilarity,
        maxSimilarity: summary.maxSimilarity,
      },
      submissions: this.mapReportFilesToDTOs(report.files),
      pairs: pairs.map((pair) => toPlagiarismPairDTO(pair)),
      warnings: summary.warnings,
    }
  }

  /** Get pair details with fragments. */
  async getPairDetails(
    reportId: string,
    pairId: number,
  ): Promise<PairDetailsResponse> {
    const legacyStored = this.legacyReportsStore.get(reportId)

    if (legacyStored) {
      const pairs = legacyStored.report.getPairs()
      const pair = pairs.find((storedPair: Pair) => storedPair.id === pairId)

      if (!pair) {
        throw new PlagiarismPairNotFoundError(pairId)
      }

      const fragments = legacyStored.report.getFragments(pair)

      return {
        pair: toPlagiarismPairDTO(pair),
        fragments: fragments.map((fragment: Fragment, index: number) =>
          toPlagiarismFragmentDTO(fragment, index),
        ),
        leftCode: pair.leftFile.content,
        rightCode: pair.rightFile.content,
      }
    }

    const numericReportId = parseInt(reportId, 10)
    if (!Number.isNaN(numericReportId)) {
      const details = await this.getResultDetails(pairId)

      return {
        pair: {
          id: details.result.id,
          leftFile: {
            id: details.result.submission1Id,
            path: details.leftFile.filename,
            filename: details.leftFile.filename,
            lineCount: details.leftFile.lineCount,
            studentName: details.leftFile.studentName,
          },
          rightFile: {
            id: details.result.submission2Id,
            path: details.rightFile.filename,
            filename: details.rightFile.filename,
            lineCount: details.rightFile.lineCount,
            studentName: details.rightFile.studentName,
          },
          structuralScore: parseFloat(details.result.structuralScore),
          semanticScore: 0,
          hybridScore: parseFloat(details.result.structuralScore),
          overlap: details.result.overlap,
          longest: details.result.longestFragment,
        },
        fragments: details.fragments,
        leftCode: details.leftFile.content,
        rightCode: details.rightFile.content,
      }
    }

    throw new PlagiarismReportNotFoundError(reportId)
  }

  /** Get report by ID. */
  async getReport(reportId: string): Promise<AnalyzeResponse | null> {
    const numericReportId = parseInt(reportId, 10)
    if (!Number.isNaN(numericReportId)) {
      return this.persistenceService.getReport(numericReportId)
    }

    const storedReport = this.legacyReportsStore.get(reportId)
    if (!storedReport) {
      return null
    }

    const summary = storedReport.report.getSummary()
    const pairs = storedReport.report.getPairs()
    const threshold = PLAGIARISM_CONFIG.DEFAULT_THRESHOLD

    return {
      reportId,
      isReusedReport: true,
      generatedAt: storedReport.createdAt.toISOString(),
      summary: {
        totalFiles: summary.totalFiles,
        totalPairs: summary.totalPairs,
        suspiciousPairs: pairs.filter(
          (pair: Pair) => pair.similarity >= threshold,
        ).length,
        averageSimilarity: summary.averageSimilarity,
        maxSimilarity: summary.maxSimilarity,
      },
      submissions: this.mapReportFilesToDTOs(storedReport.report.files),
      pairs: pairs.map((pair: Pair) => toPlagiarismPairDTO(pair)),
      warnings: summary.warnings,
    }
  }

  /** Delete a report. */
  async deleteReport(reportId: string): Promise<boolean> {
    const numericReportId = parseInt(reportId, 10)
    if (!Number.isNaN(numericReportId)) {
      return this.persistenceService.deleteReport(numericReportId)
    }

    return this.legacyReportsStore.delete(reportId)
  }

  /** Get result details from database with fragments and file content. */
  async getResultDetails(resultId: number): Promise<ResultDetailsResponse> {
    const resultData = await this.persistenceService.getResultData(resultId)

    if (!resultData || !resultData.submission1 || !resultData.submission2) {
      throw new PlagiarismResultNotFoundError(resultId)
    }

    const { result, fragments, submission1, submission2 } = resultData

    const [leftContent, rightContent] =
      await this.fileService.downloadSubmissionFiles(
        submission1.submission.filePath,
        submission2.submission.filePath,
      )

    return {
      result: {
        id: result.id,
        submission1Id: result.submission1Id,
        submission2Id: result.submission2Id,
        structuralScore: result.structuralScore,
        overlap: result.overlap,
        longestFragment: result.longestFragment,
      },
      fragments: fragments.map((fragment: MatchFragment) => ({
        id: fragment.id,
        leftSelection: {
          startRow: fragment.leftStartRow,
          startCol: fragment.leftStartCol,
          endRow: fragment.leftEndRow,
          endCol: fragment.leftEndCol,
        },
        rightSelection: {
          startRow: fragment.rightStartRow,
          startCol: fragment.rightStartCol,
          endRow: fragment.rightEndRow,
          endCol: fragment.rightEndCol,
        },
        length: fragment.length,
      })),
      leftFile: {
        filename: submission1.submission.fileName,
        content: leftContent,
        lineCount: leftContent.split("\n").length,
        studentName: submission1.studentName || "Unknown",
      },
      rightFile: {
        filename: submission2.submission.fileName,
        content: rightContent,
        lineCount: rightContent.split("\n").length,
        studentName: submission2.studentName || "Unknown",
      },
    }
  }

  /** Analyze all submissions for an assignment. */
  async analyzeAssignmentSubmissions(
    assignmentId: number,
    teacherId?: number,
  ): Promise<AnalyzeResponse> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    const reusableAssignmentReport =
      await this.persistenceService.getReusableAssignmentReport(assignmentId)

    if (reusableAssignmentReport) {
      return reusableAssignmentReport
    }

    const files = await this.fileService.fetchSubmissionFiles(assignmentId)

    const language = this.getLanguage(assignment.programmingLanguage)
    let ignoredFile: File | undefined

    if (assignment.templateCode) {
      ignoredFile = new File(
        `template.${this.getFileExtension(language)}`,
        assignment.templateCode,
      )
    }

    const detector = this.detectorFactory.create({ language })
    const report = await detector.analyze(files, ignoredFile)
    const pairs = report.getPairs()

    const semanticScores = await this.computeSemanticScores(pairs, language)

    const { dbReport, resultIdMap } =
      await this.persistenceService.persistReport(
        assignmentId,
        teacherId,
        report,
        pairs,
        semanticScores,
      )

    return this.buildAssignmentAnalysisResponse(
      dbReport,
      report,
      pairs,
      resultIdMap,
      semanticScores,
    )
  }

  /** Get assignment similarity status for review button labeling. */
  async getAssignmentSimilarityStatus(
    assignmentId: number,
  ): Promise<AssignmentSimilarityStatusResponse> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    const reusableReportId =
      await this.persistenceService.getReusableAssignmentReportId(assignmentId)

    return {
      hasReusableReport: reusableReportId !== null,
      reusableReportId:
        reusableReportId !== null ? reusableReportId.toString() : null,
    }
  }

  private cleanupExpiredReports(): void {
    const currentTimestampMs = Date.now()

    for (const [reportId, reportData] of this.legacyReportsStore.entries()) {
      const reportAgeMs = currentTimestampMs - reportData.createdAt.getTime()
      if (reportAgeMs > PlagiarismService.LEGACY_REPORT_TTL_MS) {
        this.legacyReportsStore.delete(reportId)
      }
    }

    if (this.legacyReportsStore.size > PlagiarismService.MAX_LEGACY_REPORTS) {
      const sortedEntries = Array.from(this.legacyReportsStore.entries()).sort(
        (leftEntry, rightEntry) =>
          leftEntry[1].createdAt.getTime() - rightEntry[1].createdAt.getTime(),
      )

      const reportCountToRemove =
        this.legacyReportsStore.size - PlagiarismService.MAX_LEGACY_REPORTS
      for (let index = 0; index < reportCountToRemove; index += 1) {
        this.legacyReportsStore.delete(sortedEntries[index][0])
      }
    }
  }

  private validateAnalyzeRequest(request: AnalyzeRequest): void {
    if (
      !request.files ||
      request.files.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED
    ) {
      throw new InsufficientFilesError(
        PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED,
        request.files?.length ?? 0,
      )
    }

    if (!request.language) {
      throw new LanguageRequiredError()
    }
  }

  private mapReportFilesToDTOs(files: File[]): PlagiarismFileDTO[] {
    return files.map((file) => ({
      id: parseInt(file.info?.submissionId || String(file.id), 10),
      path: file.path,
      filename: file.filename,
      lineCount: file.lineCount,
      studentId: file.info?.studentId,
      studentName: file.info?.studentName,
    }))
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private getLanguage(programmingLanguage: string): LanguageName {
    const language = PLAGIARISM_LANGUAGE_MAP[programmingLanguage.toLowerCase()]
    if (!language) {
      throw new UnsupportedLanguageError(programmingLanguage)
    }

    return language
  }

  private getFileExtension(language: LanguageName): string {
    const extensionMap: Record<string, string> = {
      python: "py",
      java: "java",
      c: "c",
    }

    return extensionMap[language] || "txt"
  }

  private buildAssignmentAnalysisResponse(
    dbReport: { id: number; generatedAt: Date },
    report: Report,
    pairs: Pair[],
    resultIdMap: Map<string, number>,
    semanticScores: Map<string, number>,
  ): AnalyzeResponse {
    return {
      reportId: dbReport.id.toString(),
      isReusedReport: false,
      generatedAt: dbReport.generatedAt.toISOString(),
      summary: {
        totalFiles: report.files.length,
        totalPairs: pairs.length,
        suspiciousPairs: pairs.filter(
          (pair: Pair) => pair.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD,
        ).length,
        averageSimilarity: parseFloat(
          (
            pairs.reduce(
              (sum: number, pair: Pair) => sum + pair.similarity,
              0,
            ) / Math.max(1, pairs.length)
          ).toFixed(4),
        ),
        maxSimilarity: parseFloat(
          Math.max(...pairs.map((pair: Pair) => pair.similarity), 0).toFixed(4),
        ),
      },
      submissions: this.mapReportFilesToDTOs(report.files),
      pairs: pairs.map((pair: Pair) => {
        const leftSubmissionId = parseInt(
          pair.leftFile.info?.submissionId || "0",
          10,
        )
        const rightSubmissionId = parseInt(
          pair.rightFile.info?.submissionId || "0",
          10,
        )
        const [firstSubmissionId, secondSubmissionId] =
          leftSubmissionId < rightSubmissionId
            ? [leftSubmissionId, rightSubmissionId]
            : [rightSubmissionId, leftSubmissionId]
        const pairKey = `${firstSubmissionId}-${secondSubmissionId}`
        const resultId = resultIdMap.get(pairKey) ?? 0
        const semanticScore = semanticScores.get(pairKey) ?? 0

        return {
          id: resultId,
          leftFile: {
            id: leftSubmissionId,
            path: pair.leftFile.path,
            filename: pair.leftFile.filename,
            lineCount: pair.leftTotal,
            studentId: pair.leftFile.info?.studentId,
            studentName: pair.leftFile.info?.studentName,
          },
          rightFile: {
            id: rightSubmissionId,
            path: pair.rightFile.path,
            filename: pair.rightFile.filename,
            lineCount: pair.rightTotal,
            studentId: pair.rightFile.info?.studentId,
            studentName: pair.rightFile.info?.studentName,
          },
          structuralScore: pair.similarity,
          semanticScore,
          hybridScore: 0.5 * pair.similarity + 0.5 * semanticScore,
          overlap: pair.overlap,
          longest: pair.longest,
        }
      }),
      warnings: [],
    }
  }

  /**
   * Compute semantic similarity scores for all pairs with bounded concurrency.
   * Runs for all supported languages. Any individual pair failure is absorbed by the client.
   */
  private async computeSemanticScores(
    pairs: Pair[],
    _language: LanguageName,
  ): Promise<Map<string, number>> {
    const semanticScores = new Map<string, number>()
    const queuedRequests: Array<{
      key: string
      leftContent: string
      rightContent: string
    }> = []
    const queuedPairKeys = new Set<string>()

    for (const pair of pairs) {
      const leftSubmissionId = parseInt(pair.leftFile.info?.submissionId || "0")
      const rightSubmissionId = parseInt(pair.rightFile.info?.submissionId || "0")

      if (!leftSubmissionId || !rightSubmissionId) {
        continue
      }

      const [firstSubmissionId, secondSubmissionId] =
        leftSubmissionId < rightSubmissionId
          ? [leftSubmissionId, rightSubmissionId]
          : [rightSubmissionId, leftSubmissionId]
      const pairKey = `${firstSubmissionId}-${secondSubmissionId}`

      if (queuedPairKeys.has(pairKey)) {
        continue
      }

      queuedPairKeys.add(pairKey)
      queuedRequests.push({
        key: pairKey,
        leftContent: pair.leftFile.content,
        rightContent: pair.rightFile.content,
      })
    }

    if (queuedRequests.length === 0) {
      return semanticScores
    }

    const maxConcurrency = Math.max(
      1,
      settings.semanticSimilarityMaxConcurrentRequests ?? 4,
    )
    const workerCount = Math.min(maxConcurrency, queuedRequests.length)
    let nextRequestIndex = 0

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (nextRequestIndex < queuedRequests.length) {
          const requestIndex = nextRequestIndex
          nextRequestIndex += 1
          const queuedRequest = queuedRequests[requestIndex]

          const semanticScore = await this.semanticClient.getSemanticScore(
            queuedRequest.leftContent,
            queuedRequest.rightContent,
          )

          semanticScores.set(queuedRequest.key, semanticScore)
        }
      }),
    )

    return semanticScores
  }
}

