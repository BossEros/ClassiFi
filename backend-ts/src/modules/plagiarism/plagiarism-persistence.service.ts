import { inject, injectable } from "tsyringe"
import { db } from "@/shared/database.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import {
  SubmissionRepository,
  type SubmissionWithStudent,
} from "@/modules/submissions/submission.repository.js"
import { Report, Pair } from "@/lib/plagiarism/index.js"
import {
  type PlagiarismFileDTO,
  type PlagiarismPairDTO,
} from "@/modules/plagiarism/plagiarism.mapper.js"
import {
  buildPairSimilarityScoreBreakdown,
  formatSimilarityScore,
  normalizeSubmissionPair,
  summarizePairSimilarityScores,
  type PairSimilarityScoreBreakdown,
} from "@/modules/plagiarism/plagiarism-scoring.js"
import type { SimilarityReport } from "@/modules/plagiarism/similarity-report.model.js"
import type { MatchFragment, NewMatchFragment } from "@/modules/plagiarism/match-fragment.model.js"
import type { SimilarityResult, NewSimilarityResult } from "@/modules/plagiarism/similarity-result.model.js"
import type { Submission } from "@/modules/submissions/submission.model.js"
import type { TransactionContext } from "@/shared/transaction.js"
import type { AnalyzeResponse } from "@/modules/plagiarism/plagiarism.service.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { settings } from "@/shared/config.js"

@injectable()
export class PlagiarismPersistenceService {
  constructor(
    @inject(DI_TOKENS.repositories.similarity)
    private similarityRepo: SimilarityRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
  ) {}

  /** Get result with fragments and related submission info. */
  async getResultData(resultId: number): Promise<{
    result: SimilarityResult
    fragments: MatchFragment[]
    submission1: Awaited<
      ReturnType<SubmissionRepository["getSubmissionWithStudent"]>
    >
    submission2: Awaited<
      ReturnType<SubmissionRepository["getSubmissionWithStudent"]>
    >
  } | null> {
    const resultData = await this.similarityRepo.getResultWithFragments(resultId)
    if (!resultData) {
      return null
    }

    const { result, fragments } = resultData

    // Fetch both submission rows (with student info) in parallel to save round-trip time.
    const [submission1, submission2] = await Promise.all([
      this.submissionRepo.getSubmissionWithStudent(result.submission1Id),
      this.submissionRepo.getSubmissionWithStudent(result.submission2Id),
    ])

    return { result, fragments, submission1, submission2 }
  }

  /**
   * Returns an existing assignment report when it is still current.
   * A report is current when latest-submission count matches and
   * no latest submission is newer than the report generation time.
   */
  async getReusableAssignmentReport(
    assignmentId: number,
  ): Promise<AnalyzeResponse | null> {
    // Check freshness first — no point fetching the full report if it’s stale.
    const reusableReportId =
      await this.getReusableAssignmentReportId(assignmentId)

    if (!reusableReportId) {
      return null
    }

    // Prune any older reports for this assignment now that we know one is reusable.
    // This keeps the table tidy even when the report is being reused.
    await this.similarityRepo.deleteReportsByAssignmentExcept(
      assignmentId,
      reusableReportId,
    )

    return this.getReport(reusableReportId)
  }

  /** Returns reusable report ID when the latest report is still current. */
  async getReusableAssignmentReportId(
    assignmentId: number,
  ): Promise<number | null> {
    // Fetch the most recently generated report for this assignment.
    const latestReport =
      await this.similarityRepo.getLatestReportByAssignment(assignmentId)

    if (!latestReport) {
      return null
    }

    // Fetch only the current (latest) submissions to compare against the stored report.
    const latestSubmissions =
      await this.submissionRepo.getSubmissionsByAssignment(assignmentId, true)

    // Run the two-part freshness check: count match + no newer submission than report time.
    if (!this.isReportCurrent(latestReport, latestSubmissions)) {
      return null
    }

    return latestReport.id
  }

  /** Persist report, results, and fragments to database. */
  async persistReport(
    assignmentId: number,
    teacherId: number | undefined,
    report: Report,
    pairs: Pair[],
    semanticScores: Map<string, number>,
  ): Promise<{ dbReport: { id: number; generatedAt: Date }; resultIdMap: Map<string, number> }> {
    return await db.transaction(async (transaction) => {
      const similarityRepositoryWithContext = this.similarityRepo.withContext(
        transaction as unknown as TransactionContext,
      )

      // STEP 1: Acquire a per-assignment advisory lock to prevent duplicate concurrent reports
      await similarityRepositoryWithContext.acquireAssignmentReportLock(
        assignmentId,
      )

      // STEP 2: Resolve the teacher ID — falls back to a DB lookup when not passed directly
      const resolvedTeacherId =
        teacherId ??
        (await similarityRepositoryWithContext.getTeacherIdByAssignment(
          assignmentId,
        )) ??
        null

      // STEP 3: Build per-pair score breakdowns and derive summary statistics for the report header
      const pairScoreBreakdowns = this.buildPairScoreBreakdowns(
        pairs,
        semanticScores,
      )
      const pairSimilaritySummary = summarizePairSimilarityScores(
        pairScoreBreakdowns,
      )

      // STEP 4: Create the report header record in the database
      const dbReport = await similarityRepositoryWithContext.createReport({
        assignmentId,
        teacherId: resolvedTeacherId,
        totalSubmissions: report.files.length,
        totalComparisons: pairs.length,
        averageSimilarity: formatSimilarityScore(pairSimilaritySummary.averageSimilarity, 4),
        highestSimilarity: formatSimilarityScore(pairSimilaritySummary.maxSimilarity, 4),
      })

      // STEP 5: Prepare result rows and orientation maps (canonical ascending-ID pair ordering)
      const { resultsToInsert, pairMap, swappedMap } =
        this.prepareResultsForInsert(dbReport.id, pairs, semanticScores)

      const resultIdMap = new Map<string, number>()

      if (resultsToInsert.length > 0) {
        const insertedResults =
          await similarityRepositoryWithContext.createResults(resultsToInsert)

        // STEP 6: Build a lookup map from pairKey → DB result ID for callers to reference pairs without extra queries
        for (const insertedResult of insertedResults) {
          const pairKey = `${insertedResult.submission1Id}-${insertedResult.submission2Id}`
          resultIdMap.set(pairKey, insertedResult.id)
        }

        // STEP 7: Insert matching code fragment position records
        const fragmentsToInsert = this.prepareFragmentsForInsert(
          insertedResults,
          pairMap,
          swappedMap,
        )

        if (fragmentsToInsert.length > 0) {
          await similarityRepositoryWithContext.createFragments(fragmentsToInsert)
        }
      }

      // STEP 8: Prune all older reports for this assignment — keep only the freshly created one
      await similarityRepositoryWithContext.deleteReportsByAssignmentExcept(
        assignmentId,
        dbReport.id,
      )

      return { dbReport, resultIdMap }
    })
  }

  /** Get report from database and reconstruct the API response. */
  async getReport(reportId: number): Promise<AnalyzeResponse | null> {
    // STEP 1: Fetch the report header from the database
    const report = await this.similarityRepo.getReportById(reportId)
    if (!report) {
      return null
    }

    const results = await this.similarityRepo.getResultsByReport(reportId)

    // STEP 2: Collect all unique submission IDs referenced by the results
    const submissionIds = new Set<number>()
    for (const result of results) {
      submissionIds.add(result.submission1Id)
      submissionIds.add(result.submission2Id)
    }

    // STEP 3: Batch-fetch submission + student info for all involved submissions
    const pairSubmissions = await this.submissionRepo.getBatchSubmissionsWithStudents(
      Array.from(submissionIds),
    )
    const submissionMap = new Map(
      pairSubmissions.map((submissionWithStudent) => [
        submissionWithStudent.submission.id,
        submissionWithStudent,
      ]),
    )

    // STEP 4: Re-derive the hybrid score using current configured weights and build pair DTOs
    // Recalculating ensures the response reflects any weight changes since the report was first saved.
    const persistedPairsWithScores = results
      .map((result) => {
        const leftSubmission = submissionMap.get(result.submission1Id)
        const rightSubmission = submissionMap.get(result.submission2Id)

        const pairScoreBreakdown = this.buildCurrentPairSimilarityScoreBreakdown(
          result.structuralScore,
          result.semanticScore,
        )

        return {
          pair: {
            id: result.id,
            leftFile: {
              id: result.submission1Id,
              path: leftSubmission?.submission.filePath || "",
              filename: leftSubmission?.submission.fileName || "Unknown",
              lineCount: result.leftTotal,
              studentId: leftSubmission?.submission.studentId?.toString(),
              studentName: leftSubmission?.studentName || "Unknown",
              submittedAt: leftSubmission?.submission.submittedAt?.toISOString(),
            },
            rightFile: {
              id: result.submission2Id,
              path: rightSubmission?.submission.filePath || "",
              filename: rightSubmission?.submission.fileName || "Unknown",
              lineCount: result.rightTotal,
              studentId: rightSubmission?.submission.studentId?.toString(),
              studentName: rightSubmission?.studentName || "Unknown",
              submittedAt: rightSubmission?.submission.submittedAt?.toISOString(),
            },
            structuralScore: pairScoreBreakdown.structuralScore,
            semanticScore: pairScoreBreakdown.semanticScore,
            hybridScore: pairScoreBreakdown.hybridScore,
            overlap: result.overlap,
            longest: result.longestFragment,
          },
          pairScoreBreakdown,
        }
      })
      // STEP 5: Sort pairs by hybrid score descending so the most suspicious appear first
      .sort(
        (leftPairWithScore, rightPairWithScore) =>
          rightPairWithScore.pairScoreBreakdown.hybridScore -
          leftPairWithScore.pairScoreBreakdown.hybridScore,
      )

    const pairs: PlagiarismPairDTO[] = persistedPairsWithScores.map(
      (persistedPairWithScore) => persistedPairWithScore.pair,
    )
    const pairSimilaritySummary = summarizePairSimilarityScores(
      persistedPairsWithScores.map(
        (persistedPairWithScore) => persistedPairWithScore.pairScoreBreakdown,
      ),
    )

    const reportSubmissions = await this.getReportSubmissions(reportId)
    const submissionDTOs = this.mapSubmissionsToDTOs(reportSubmissions)

    // STEP 6: Build and return the full analysis response DTO
    return {
      reportId: reportId.toString(),
      isReusedReport: true,
      generatedAt: report.generatedAt.toISOString(),
      assignmentId: report.assignmentId,
      summary: {
        totalFiles: report.totalSubmissions,
        totalPairs: report.totalComparisons,
        averageSimilarity: pairSimilaritySummary.averageSimilarity,
        maxSimilarity: pairSimilaritySummary.maxSimilarity,
      },
      submissions: submissionDTOs,
      pairs,
      warnings: [],
      scoringWeights: {
        structuralWeight: settings.plagiarismStructuralWeight,
        semanticWeight: settings.plagiarismSemanticWeight,
      },
    }
  }

  /** Delete a report. */
  async deleteReport(reportId: number): Promise<boolean> {
    return this.similarityRepo.deleteReport(reportId)
  }

  /** Get all submissions for a report's assignment. */
  async getReportSubmissions(reportId: number): Promise<
    Array<{
      submission: Submission
      studentName: string
    }>
  > {
    const report = await this.similarityRepo.getReportById(reportId)
    if (!report) {
      return []
    }

    // Fetch only the latest submission per student so stale re-submissions are excluded.
    return this.submissionRepo.getSubmissionsWithStudentInfo(
      report.assignmentId,
      true,
    )
  }

  private mapSubmissionsToDTOs(
    submissionsWithInfo: SubmissionWithStudent[],
  ): PlagiarismFileDTO[] {
    return submissionsWithInfo.map(({ submission, studentName }) => ({
      id: submission.id,
      path: submission.filePath,
      filename: submission.fileName,
      lineCount: 0,
      studentId: submission.studentId.toString(),
      studentName,
      submittedAt: submission.submittedAt.toISOString(),
    }))
  }

  /**
   * Parse a persisted numeric similarity score while preserving valid zero values.
   */
  private parseStoredSimilarityScore(
    storedScore: string | null | undefined,
  ): number | null {
    // Treat null and undefined as "not set" — distinct from a legitimate score of 0.
    if (storedScore === null || storedScore === undefined) {
      return null
    }

    const normalizedStoredScore = storedScore.trim()
    if (normalizedStoredScore.length === 0) {
      return null
    }

    const parsedScore = Number.parseFloat(normalizedStoredScore)

    return Number.isNaN(parsedScore) ? null : parsedScore
  }

  /**
   * Recomputes the hybrid score using the current configured weights.
   * This keeps reused reports aligned even when older persisted rows used a different formula.
   */
  private buildCurrentPairSimilarityScoreBreakdown(
    structuralScore: string,
    semanticScore: string,
  ): PairSimilarityScoreBreakdown {
    // Fall back to 0 if either score was never stored (e.g., semantic service was down).
    const parsedStructuralScore =
      this.parseStoredSimilarityScore(structuralScore) ?? 0
    const parsedSemanticScore =
      this.parseStoredSimilarityScore(semanticScore) ?? 0

    return buildPairSimilarityScoreBreakdown(
      parsedStructuralScore,
      parsedSemanticScore,
    )
  }

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

        // Pairs with missing submission IDs can’t be scored — skip them.
        if (!leftSubmissionId || !rightSubmissionId) {
          return null
        }

        const normalizedSubmissionPair = normalizeSubmissionPair(
          leftSubmissionId,
          rightSubmissionId,
        )
        const semanticScore =
          semanticScores.get(normalizedSubmissionPair.pairKey) ?? 0

        return buildPairSimilarityScoreBreakdown(
          pair.similarity,
          semanticScore,
        )
      })
      .filter(
        (
          pairScoreBreakdown,
        ): pairScoreBreakdown is PairSimilarityScoreBreakdown =>
          pairScoreBreakdown !== null,
      )
  }

  private isReportCurrent(
    report: SimilarityReport,
    latestSubmissions: Submission[],
  ): boolean {
    // Check 1: the number of submissions must match exactly.
    // A new submission or a deleted one means the report is outdated.
    if (report.totalSubmissions !== latestSubmissions.length) {
      return false
    }

    // Check 2: no submission can be newer than when the report was generated.
    // If a student re-submitted after the report was run, the report is outdated.
    const newestLatestSubmissionMs = latestSubmissions.reduce(
      (currentMax, submission) => {
        const submittedAtMs = new Date(submission.submittedAt).getTime()
        return Math.max(currentMax, submittedAtMs)
      },
      0,
    )

    const reportGeneratedAtMs = new Date(report.generatedAt).getTime()

    return newestLatestSubmissionMs <= reportGeneratedAtMs
  }

  /** Prepare results for database insertion. */
  private prepareResultsForInsert(
    reportId: number,
    pairs: Pair[],
    semanticScores: Map<string, number>,
  ): {
    resultsToInsert: NewSimilarityResult[]
    pairMap: Map<string, Pair>
    swappedMap: Map<string, boolean>
  } {
    const resultsToInsert: NewSimilarityResult[] = []
    const pairMap = new Map<string, Pair>()
    const swappedMap = new Map<string, boolean>()

    for (const pair of pairs) {
      const leftSubmissionId = parseInt(pair.leftFile.info?.submissionId || "0")
      const rightSubmissionId = parseInt(pair.rightFile.info?.submissionId || "0")

      if (!leftSubmissionId || !rightSubmissionId) {
        continue
      }

      // Normalize so the lower submission ID is always submission1.
      // Track whether IDs were swapped so fragments can be flipped accordingly later.
      const normalizedSubmissionPair = normalizeSubmissionPair(
        leftSubmissionId,
        rightSubmissionId,
      )
      pairMap.set(normalizedSubmissionPair.pairKey, pair)
      swappedMap.set(
        normalizedSubmissionPair.pairKey,
        normalizedSubmissionPair.isSwapped,
      )

      const semanticScore =
        semanticScores.get(normalizedSubmissionPair.pairKey) ?? 0
      const pairScoreBreakdown = buildPairSimilarityScoreBreakdown(
        pair.similarity,
        semanticScore,
      )

      const isSwapped = normalizedSubmissionPair.isSwapped

      resultsToInsert.push({
        reportId,
        submission1Id: normalizedSubmissionPair.submission1Id,
        submission2Id: normalizedSubmissionPair.submission2Id,
        structuralScore: formatSimilarityScore(pairScoreBreakdown.structuralScore, 6),
        semanticScore: formatSimilarityScore(pairScoreBreakdown.semanticScore, 6),
        hybridScore: formatSimilarityScore(pairScoreBreakdown.hybridScore, 6),
        overlap: pair.overlap,
        longestFragment: pair.longest,
        leftCovered: isSwapped ? pair.rightCovered : pair.leftCovered,
        rightCovered: isSwapped ? pair.leftCovered : pair.rightCovered,
        leftTotal: isSwapped ? pair.rightTotal : pair.leftTotal,
        rightTotal: isSwapped ? pair.leftTotal : pair.rightTotal,
      })
    }

    return { resultsToInsert, pairMap, swappedMap }
  }

  /** Prepare fragments for database insertion. */
  private prepareFragmentsForInsert(
    insertedResults: {
      id: number
      submission1Id: number
      submission2Id: number
    }[],
    pairMap: Map<string, Pair>,
    swappedMap: Map<string, boolean>,
  ): NewMatchFragment[] {
    const fragmentsToInsert: NewMatchFragment[] = []

    for (const insertedResult of insertedResults) {
      const pairKey = `${insertedResult.submission1Id}-${insertedResult.submission2Id}`
      const pair = pairMap.get(pairKey)
      const swapped = swappedMap.get(pairKey) || false

      if (!pair) {
        continue
      }

      const fragments = pair.buildFragments()

      for (const fragment of fragments) {
        // If the submission IDs were swapped during normalization, the detector’s
        // left/right fragment positions are also flipped relative to the stored row.
        // We flip them back here so the diff view renders correctly in the frontend.
        if (swapped) {
          fragmentsToInsert.push({
            similarityResultId: insertedResult.id,
            leftStartRow: fragment.rightSelection.startRow,
            leftStartCol: fragment.rightSelection.startCol,
            leftEndRow: fragment.rightSelection.endRow,
            leftEndCol: fragment.rightSelection.endCol,
            rightStartRow: fragment.leftSelection.startRow,
            rightStartCol: fragment.leftSelection.startCol,
            rightEndRow: fragment.leftSelection.endRow,
            rightEndCol: fragment.leftSelection.endCol,
            length: fragment.length,
          })

          continue
        }

        fragmentsToInsert.push({
          similarityResultId: insertedResult.id,
          leftStartRow: fragment.leftSelection.startRow,
          leftStartCol: fragment.leftSelection.startCol,
          leftEndRow: fragment.leftSelection.endRow,
          leftEndCol: fragment.leftSelection.endCol,
          rightStartRow: fragment.rightSelection.startRow,
          rightStartCol: fragment.rightSelection.startCol,
          rightEndRow: fragment.rightSelection.endRow,
          rightEndCol: fragment.rightSelection.endCol,
          length: fragment.length,
        })
      }
    }

    return fragmentsToInsert
  }
}

