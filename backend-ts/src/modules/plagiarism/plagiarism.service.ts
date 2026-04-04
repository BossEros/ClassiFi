import { inject, injectable } from "tsyringe"
import {
  File,
  LanguageName,
  Report,
  Pair,
  Fragment,
} from "@/lib/plagiarism/index.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { PlagiarismSubmissionFileService } from "@/modules/plagiarism/plagiarism-submission-file.service.js"
import { PlagiarismPersistenceService } from "@/modules/plagiarism/plagiarism-persistence.service.js"
import { SimilarityPenaltyService } from "@/modules/plagiarism/similarity-penalty.service.js"
import { SemanticSimilarityClient, cosineSimilarity } from "@/modules/plagiarism/semantic-similarity.client.js"
import {
  PLAGIARISM_CONFIG,
  PLAGIARISM_LANGUAGE_MAP,
  createPlagiarismDetector,
  toPlagiarismPairDTO,
  toPlagiarismFragmentDTO,
  type PlagiarismFileDTO,
  type PlagiarismPairDTO,
  type PlagiarismFragmentDTO,
  type PlagiarismSummaryDTO,
} from "@/modules/plagiarism/plagiarism.mapper.js"
import {
  buildPairSimilarityScoreBreakdown,
  normalizeSubmissionPair,
  summarizePairSimilarityScores,
  type PairSimilarityScoreBreakdown,
} from "@/modules/plagiarism/plagiarism-scoring.js"
import {
  AssignmentNotFoundError,
  PlagiarismReportNotFoundError,
  PlagiarismResultNotFoundError,
  PlagiarismPairNotFoundError,
  InsufficientFilesError,
  UnsupportedLanguageError,
  LanguageRequiredError,
} from "@/shared/errors.js"
import type { MatchFragment } from "@/modules/plagiarism/match-fragment.model.js"
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
    semanticScore: string
    hybridScore: string
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
  private legacyReportsStore = new Map<
    string,
    { report: Report; createdAt: Date }
  >()

  /** Interval ID for cleanup timer - stored to allow cleanup in dispose(). */
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null

  constructor(
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.services.plagiarismSubmissionFile)
    private fileService: PlagiarismSubmissionFileService,
    @inject(DI_TOKENS.services.plagiarismPersistence)
    private persistenceService: PlagiarismPersistenceService,
    @inject(DI_TOKENS.services.similarityPenalty)
    private similarityPenaltyService: SimilarityPenaltyService,
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
    // Validate that the request has enough files and a language specified before doing anything.
    this.validateAnalyzeRequest(request)

    const detector = createPlagiarismDetector(request.language, request.kgramLength)

    // Wrap each raw file object into the detector's File type, preserving student metadata.
    const files = request.files.map(
      (file) =>
        new File(file.path, file.content, {
          studentId: file.studentId,
          studentName: file.studentName,
        }),
    )

    // If a template file is provided, pass it to the detector so shared boilerplate is ignored.
    const ignoredFile = request.templateFile
      ? new File(request.templateFile.path, request.templateFile.content)
      : undefined

    const report = await detector.analyze(files, ignoredFile)

    // Purge stale in-memory reports before storing this new one to keep memory usage bounded.
    this.cleanupExpiredReports()
    const createdAt = new Date()
    const reportId = this.generateReportId()
    // Store in-memory — ad-hoc reports are not persisted to the database.
    this.legacyReportsStore.set(reportId, { report, createdAt })

    const threshold = request.threshold ?? settings.plagiarismHybridThreshold
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
    // First check if this is an in-memory (ad-hoc) report — these are not in the database.
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

    // If the reportId is a numeric string, it refers to a persisted DB report.
    // Delegate to getResultDetails to fetch the full pair with file content and fragments.
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
          semanticScore: parseFloat(details.result.semanticScore),
          hybridScore: parseFloat(details.result.hybridScore),
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
    // Numeric IDs belong to persisted DB reports — delegate to the persistence service.
    const numericReportId = parseInt(reportId, 10)
    if (!Number.isNaN(numericReportId)) {
      return this.persistenceService.getReport(numericReportId)
    }

    // Non-numeric IDs are in-memory ad-hoc reports; look them up in the local store.
    const storedReport = this.legacyReportsStore.get(reportId)
    if (!storedReport) {
      return null
    }

    const summary = storedReport.report.getSummary()
    const pairs = storedReport.report.getPairs()
    const threshold = settings.plagiarismHybridThreshold

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
    // Numeric ID → delete from the database via persistence service.
    const numericReportId = parseInt(reportId, 10)
    if (!Number.isNaN(numericReportId)) {
      return this.persistenceService.deleteReport(numericReportId)
    }

    // Non-numeric ID → remove from in-memory store.
    return this.legacyReportsStore.delete(reportId)
  }

  /** Get result details from database with fragments and file content. */
  async getResultDetails(resultId: number): Promise<ResultDetailsResponse> {
    // Load the result row, its fragments, and both submission records from the database.
    const resultData = await this.persistenceService.getResultData(resultId)

    if (!resultData || !resultData.submission1 || !resultData.submission2) {
      throw new PlagiarismResultNotFoundError(resultId)
    }

    const { result, fragments, submission1, submission2 } = resultData

    // Download the actual source code for both submissions from storage in parallel.
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
        semanticScore: result.semanticScore,
        hybridScore: result.hybridScore,
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
    // STEP 1: Verify the assignment exists
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    // STEP 2: Check if a current report already exists and can be reused
    // A report is reusable if submission count and latest-modification times haven't changed since generation.
    const reusableAssignmentReport =
      await this.persistenceService.getReusableAssignmentReport(assignmentId)

    if (reusableAssignmentReport) {
      // Sync penalty state in case grades changed since the report was generated, then return.
      await this.similarityPenaltyService.syncAssignmentPenaltyState(
        assignmentId,
      )
      return reusableAssignmentReport
    }

    // STEP 3: Download all latest submission files for this assignment from storage
    const files = await this.fileService.fetchSubmissionFiles(assignmentId)

    const language = this.getLanguage(assignment.programmingLanguage)
    let ignoredFile: File | undefined

    // STEP 4: If the assignment has template code, wrap it as an ignored file so shared
    // boilerplate is excluded from comparisons and doesn't inflate similarity scores
    if (assignment.templateCode) {
      ignoredFile = new File(
        `template.${this.getFileExtension(language)}`,
        assignment.templateCode,
      )
    }

    // STEP 5: Run structural detection (Winnowing fingerprinting) across all submission files
    const detector = createPlagiarismDetector(language)
    const report = await detector.analyze(files, ignoredFile)
    const pairs = report.getPairs()

    // STEP 6: Compute semantic similarity scores for all pairs using the GraphCodeBERT microservice
    const semanticScores = await this.computeSemanticScores(pairs, language)

    // STEP 7: Persist the report, per-pair results, and fragment positions to the database
    const { dbReport, resultIdMap } =
      await this.persistenceService.persistReport(
        assignmentId,
        teacherId,
        report,
        pairs,
        semanticScores,
      )

    // STEP 8: Apply grade penalties to any student pairs that exceed the suspicious threshold
    await this.similarityPenaltyService.applyAssignmentPenaltyFromReport(
      assignmentId,
      dbReport.id,
    )

    // STEP 9: Build and return the analysis response DTO
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
    // Guard: assignment must exist before checking report status.
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)
    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    // Check whether a current (non-stale) report already exists.
    // The frontend uses this to decide whether to show "Review" or "Run Analysis" button.
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

    // First pass: remove any reports older than the TTL (24 hours by default).
    for (const [reportId, reportData] of this.legacyReportsStore.entries()) {
      const reportAgeMs = currentTimestampMs - reportData.createdAt.getTime()
      if (reportAgeMs > PlagiarismService.LEGACY_REPORT_TTL_MS) {
        this.legacyReportsStore.delete(reportId)
      }
    }

    // Second pass: if the store still exceeds the max count, evict the oldest entries first.
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
    // Ensure the minimum number of files are present to form at least one comparison pair.
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

  // Shapes the freshly persisted report and all detector pairs into the AnalyzeResponse
  // contract returned to the API controller and ultimately to the frontend.
  private buildAssignmentAnalysisResponse(
    dbReport: { id: number; generatedAt: Date },
    report: Report,
    pairs: Pair[],
    resultIdMap: Map<string, number>,
    semanticScores: Map<string, number>,
  ): AnalyzeResponse {
    const pairScoreBreakdowns = this.buildPairScoreBreakdowns(
      pairs,
      semanticScores,
    )
    const pairSimilaritySummary =
      summarizePairSimilarityScores(pairScoreBreakdowns)

    return {
      reportId: dbReport.id.toString(),
      isReusedReport: false,
      generatedAt: dbReport.generatedAt.toISOString(),
      summary: {
        totalFiles: report.files.length,
        totalPairs: pairs.length,
        suspiciousPairs: pairSimilaritySummary.suspiciousPairs,
        averageSimilarity: parseFloat(
          pairSimilaritySummary.averageSimilarity.toFixed(4),
        ),
        maxSimilarity: parseFloat(
          pairSimilaritySummary.maxSimilarity.toFixed(4),
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
        const normalizedSubmissionPair = normalizeSubmissionPair(
          leftSubmissionId,
          rightSubmissionId,
        )
        const resultId = resultIdMap.get(normalizedSubmissionPair.pairKey) ?? 0
        const semanticScore =
          semanticScores.get(normalizedSubmissionPair.pairKey) ?? 0
        const pairScoreBreakdown = buildPairSimilarityScoreBreakdown(
          pair.similarity,
          semanticScore,
        )

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
          structuralScore: pairScoreBreakdown.structuralScore,
          semanticScore: pairScoreBreakdown.semanticScore,
          hybridScore: pairScoreBreakdown.hybridScore,
          overlap: pair.overlap,
          longest: pair.longest,
        }
      }),
      warnings: [],
    }
  }

  // Builds the score breakdown (structural, semantic, hybrid, flagged) for each pair
  // so the breakdown can be reused for both summary stats and per-pair DTO building.
  private buildPairScoreBreakdowns(
    pairs: Pair[],
    semanticScores: Map<string, number>,
  ): PairSimilarityScoreBreakdown[] {
    return pairs
      .map((pair) => {
        const leftSubmissionId = parseInt(
          pair.leftFile.info?.submissionId || "0",
          10,
        )
        const rightSubmissionId = parseInt(
          pair.rightFile.info?.submissionId || "0",
          10,
        )

        // Skip pairs where metadata is missing — these can't be meaningfully scored.
        if (!leftSubmissionId || !rightSubmissionId) {
          return null
        }

        const normalizedSubmissionPair = normalizeSubmissionPair(
          leftSubmissionId,
          rightSubmissionId,
        )
        const semanticScore =
          semanticScores.get(normalizedSubmissionPair.pairKey) ?? 0

        return buildPairSimilarityScoreBreakdown(pair.similarity, semanticScore)
      })
      .filter(
        (
          pairScoreBreakdown,
        ): pairScoreBreakdown is PairSimilarityScoreBreakdown =>
          pairScoreBreakdown !== null,
      )
  }

  /**
   * Compute semantic similarity scores for all pairs using cached embeddings.
   *
   * Instead of sending every pair to the semantic service (O(n²) model calls),
   * this method embeds each unique submission once (O(n)), then computes
   * pairwise cosine similarity locally.
   */
  private async computeSemanticScores(
    pairs: Pair[],
    _language: LanguageName,
  ): Promise<Map<string, number>> {
    const semanticScores = new Map<string, number>()

    // ── Collect unique submissions from all pairs ──────────────────────────
    const submissionContentMap = new Map<string, string>()
    const pairEntries: Array<{
      key: string
      leftSubmissionId: string
      rightSubmissionId: string
    }> = []
    const seenPairKeys = new Set<string>()

    for (const pair of pairs) {
      const leftSubmissionId = pair.leftFile.info?.submissionId || "0"
      const rightSubmissionId = pair.rightFile.info?.submissionId || "0"

      if (leftSubmissionId === "0" || rightSubmissionId === "0") continue

      const normalizedSubmissionPair = normalizeSubmissionPair(
        parseInt(leftSubmissionId),
        parseInt(rightSubmissionId),
      )

      if (seenPairKeys.has(normalizedSubmissionPair.pairKey)) continue
      seenPairKeys.add(normalizedSubmissionPair.pairKey)

      submissionContentMap.set(leftSubmissionId, pair.leftFile.content)
      submissionContentMap.set(rightSubmissionId, pair.rightFile.content)
      pairEntries.push({
        key: normalizedSubmissionPair.pairKey,
        leftSubmissionId,
        rightSubmissionId,
      })
    }

    if (pairEntries.length === 0) return semanticScores

    // ── Embed each unique submission once (O(n) model calls) ───────────────
    const embeddingCache = new Map<string, number[]>()
    const submissionIds = [...submissionContentMap.keys()]

    const maxConcurrency = Math.max(
      1,
      settings.semanticSimilarityMaxConcurrentRequests ?? 4,
    )
    const workerCount = Math.min(maxConcurrency, submissionIds.length)
    let nextIndex = 0

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (nextIndex < submissionIds.length) {
          const currentIndex = nextIndex
          nextIndex += 1
          const submissionId = submissionIds[currentIndex]
          const code = submissionContentMap.get(submissionId)!

          const embedding = await this.semanticClient.getEmbedding(code)

          if (embedding) {
            embeddingCache.set(submissionId, embedding)
          }
        }
      }),
    )

    // ── Compute pairwise cosine similarity locally (instant) ───────────────
    for (const { key, leftSubmissionId, rightSubmissionId } of pairEntries) {
      const leftEmbedding = embeddingCache.get(leftSubmissionId)
      const rightEmbedding = embeddingCache.get(rightSubmissionId)

      if (!leftEmbedding || !rightEmbedding) {
        semanticScores.set(key, 0)
        continue
      }

      const similarity = cosineSimilarity(leftEmbedding, rightEmbedding)
      const clampedScore = Math.min(1, Math.max(0, similarity))

      semanticScores.set(key, Math.round(clampedScore * 10000) / 10000)
    }

    return semanticScores
  }
}
