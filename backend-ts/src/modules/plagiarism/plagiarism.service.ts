import { inject, injectable } from "tsyringe"
import { File, LanguageName, Report, Pair } from "@/lib/plagiarism/index.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { PlagiarismSubmissionFileService } from "@/modules/plagiarism/plagiarism-submission-file.service.js"
import { PlagiarismPersistenceService } from "@/modules/plagiarism/plagiarism-persistence.service.js"
import { SimilarityPenaltyService } from "@/modules/plagiarism/similarity-penalty.service.js"
import { SemanticSimilarityClient } from "@/modules/plagiarism/semantic-similarity.client.js"
import {
  computeSemanticScoresFromEmbeddings,
  type SemanticScorePairEntry,
} from "@/modules/plagiarism/semantic-scoring.js"
import {
  PLAGIARISM_LANGUAGE_MAP,
  createPlagiarismDetector,
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
  UnsupportedLanguageError,
} from "@/shared/errors.js"
import type { MatchFragment } from "@/modules/plagiarism/match-fragment.model.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { settings } from "@/shared/config.js"

/** Weights used to compute the hybrid similarity score */
export interface ScoringWeights {
  structuralWeight: number
  semanticWeight: number
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
  scoringWeights: ScoringWeights
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
    submittedAt: string | null
  }
  rightFile: {
    filename: string
    content: string
    lineCount: number
    studentName: string
    submittedAt: string | null
  }
}

/**
 * Business logic for plagiarism detection operations.
 * Refactored to use dedicated services for persistence and file operations.
 */
@injectable()
export class PlagiarismService {
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
  ) {}

  /** Get pair details with fragments. */
  async getPairDetails(
    reportId: string,
    pairId: number,
  ): Promise<PairDetailsResponse> {
    // The reportId is a numeric string referring to a persisted DB report.
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
    const numericReportId = parseInt(reportId, 10)
    if (!Number.isNaN(numericReportId)) {
      return this.persistenceService.getReport(numericReportId)
    }

    return null
  }

  /** Delete a report. */
  async deleteReport(reportId: string): Promise<boolean> {
    const numericReportId = parseInt(reportId, 10)
    if (!Number.isNaN(numericReportId)) {
      return this.persistenceService.deleteReport(numericReportId)
    }

    return false
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
        submittedAt: submission1.submission.submittedAt?.toISOString() ?? null,
      },
      rightFile: {
        filename: submission2.submission.fileName,
        content: rightContent,
        lineCount: rightContent.split("\n").length,
        studentName: submission2.studentName || "Unknown",
        submittedAt: submission2.submission.submittedAt?.toISOString() ?? null,
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

  private mapReportFilesToDTOs(files: File[]): PlagiarismFileDTO[] {
    return files.map((file) => ({
      id: parseInt(file.info?.submissionId || String(file.id), 10),
      path: file.path,
      filename: file.filename,
      lineCount: file.lineCount,
      studentId: file.info?.studentId,
      studentName: file.info?.studentName,
      submittedAt: file.info?.submittedAt,
    }))
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
        averageSimilarity: parseFloat(
          pairSimilaritySummary.averageSimilarity.toFixed(4),
        ),
        maxSimilarity: parseFloat(
          pairSimilaritySummary.maxSimilarity.toFixed(4),
        ),
      },
      submissions: this.mapReportFilesToDTOs(report.files),
      scoringWeights: {
        structuralWeight: settings.plagiarismStructuralWeight,
        semanticWeight: settings.plagiarismSemanticWeight,
      },
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
            submittedAt: pair.leftFile.info?.submittedAt,
          },
          rightFile: {
            id: rightSubmissionId,
            path: pair.rightFile.path,
            filename: pair.rightFile.filename,
            lineCount: pair.rightTotal,
            studentId: pair.rightFile.info?.studentId,
            studentName: pair.rightFile.info?.studentName,
            submittedAt: pair.rightFile.info?.submittedAt,
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
    // Step 1: Collect the unique submissions and normalized pair entries.
    const submissionContentMap = new Map<string, string>()
    const pairEntries: SemanticScorePairEntry[] = []
    const seenPairKeys = new Set<string>()

    for (const pair of pairs) {
      const leftSubmissionId = pair.leftFile.info?.submissionId || "0"
      const rightSubmissionId = pair.rightFile.info?.submissionId || "0"

      // Step 1a: Skip pairs that do not have valid submission IDs.
      if (leftSubmissionId === "0" || rightSubmissionId === "0") continue

      const normalizedSubmissionPair = normalizeSubmissionPair(
        parseInt(leftSubmissionId),
        parseInt(rightSubmissionId),
      )

      // Step 1b: Skip duplicate pairs like A-B and B-A.
      if (seenPairKeys.has(normalizedSubmissionPair.pairKey)) continue

      seenPairKeys.add(normalizedSubmissionPair.pairKey)

      // Step 1c: Save the code once per submission and track the pair to score.
      submissionContentMap.set(leftSubmissionId, pair.leftFile.content)
      submissionContentMap.set(rightSubmissionId, pair.rightFile.content)
      pairEntries.push({
        pairKey: normalizedSubmissionPair.pairKey,
        leftSubmissionId,
        rightSubmissionId,
      })
    }

    // Step 2: Pass the prepared data to the shared semantic scorer.
    return computeSemanticScoresFromEmbeddings({
      embeddingClient: this.semanticClient,
      maxConcurrentRequests:
        settings.semanticSimilarityMaxConcurrentRequests ?? 4,
      pairEntries,
      submissionContentById: submissionContentMap,
    })
  }
}
