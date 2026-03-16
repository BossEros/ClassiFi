import { inject, injectable } from "tsyringe"
import { db } from "@/shared/database.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import {
  SubmissionRepository,
  type SubmissionWithStudent,
} from "@/modules/submissions/submission.repository.js"
import { Report, Pair } from "@/lib/plagiarism/index.js"
import {
  PLAGIARISM_CONFIG,
  type PlagiarismFileDTO,
  type PlagiarismPairDTO,
} from "@/modules/plagiarism/plagiarism.mapper.js"
import type {
  NewSimilarityResult,
  NewMatchFragment,
  MatchFragment,
  SimilarityResult,
  Submission,
  SimilarityReport,
} from "@/models/index.js"
import type { TransactionContext } from "@/shared/transaction.js"
import type { AnalyzeResponse } from "@/modules/plagiarism/plagiarism.service.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

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
    const reusableReportId =
      await this.getReusableAssignmentReportId(assignmentId)

    if (!reusableReportId) {
      return null
    }

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
    const latestReport =
      await this.similarityRepo.getLatestReportByAssignment(assignmentId)

    if (!latestReport) {
      return null
    }

    const latestSubmissions =
      await this.submissionRepo.getSubmissionsByAssignment(assignmentId, true)

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

      await similarityRepositoryWithContext.acquireAssignmentReportLock(
        assignmentId,
      )

      const resolvedTeacherId =
        teacherId ??
        (await similarityRepositoryWithContext.getTeacherIdByAssignment(
          assignmentId,
        )) ??
        null

      const dbReport = await similarityRepositoryWithContext.createReport({
        assignmentId,
        teacherId: resolvedTeacherId,
        totalSubmissions: report.files.length,
        totalComparisons: pairs.length,
        flaggedPairs: pairs.filter(
          (pair) => pair.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD,
        ).length,
        averageSimilarity: (
          pairs.reduce((sum, pair) => sum + pair.similarity, 0) /
          Math.max(1, pairs.length)
        ).toFixed(4),
        highestSimilarity: Math.max(...pairs.map((pair) => pair.similarity), 0).toFixed(4),
      })

      const { resultsToInsert, pairMap, swappedMap } =
        this.prepareResultsForInsert(dbReport.id, pairs, semanticScores)

      const resultIdMap = new Map<string, number>()

      if (resultsToInsert.length > 0) {
        const insertedResults =
          await similarityRepositoryWithContext.createResults(resultsToInsert)

        for (const insertedResult of insertedResults) {
          const pairKey = `${insertedResult.submission1Id}-${insertedResult.submission2Id}`
          resultIdMap.set(pairKey, insertedResult.id)
        }

        const fragmentsToInsert = this.prepareFragmentsForInsert(
          insertedResults,
          pairMap,
          swappedMap,
        )

        if (fragmentsToInsert.length > 0) {
          await similarityRepositoryWithContext.createFragments(fragmentsToInsert)
        }
      }

      await similarityRepositoryWithContext.deleteReportsByAssignmentExcept(
        assignmentId,
        dbReport.id,
      )

      return { dbReport, resultIdMap }
    })
  }

  /** Get report from database and reconstruct the API response. */
  async getReport(reportId: number): Promise<AnalyzeResponse | null> {
    const report = await this.similarityRepo.getReportById(reportId)
    if (!report) {
      return null
    }

    const results = await this.similarityRepo.getResultsByReport(reportId)

    const submissionIds = new Set<number>()
    for (const result of results) {
      submissionIds.add(result.submission1Id)
      submissionIds.add(result.submission2Id)
    }

    const pairSubmissions = await this.submissionRepo.getBatchSubmissionsWithStudents(
      Array.from(submissionIds),
    )
    const submissionMap = new Map(
      pairSubmissions.map((submissionWithStudent) => [
        submissionWithStudent.submission.id,
        submissionWithStudent,
      ]),
    )

    const pairs: PlagiarismPairDTO[] = results.map((result) => {
      const leftSubmission = submissionMap.get(result.submission1Id)
      const rightSubmission = submissionMap.get(result.submission2Id)
      const structuralScore = parseFloat(result.structuralScore || "0")
      const rawHybridScore = parseFloat(result.hybridScore || "0")
      const hybridScore = rawHybridScore > 0 ? rawHybridScore : structuralScore

      return {
        id: result.id,
        leftFile: {
          id: result.submission1Id,
          path: leftSubmission?.submission.filePath || "",
          filename: leftSubmission?.submission.fileName || "Unknown",
          lineCount: result.leftTotal,
          studentId: leftSubmission?.submission.studentId?.toString(),
          studentName: leftSubmission?.studentName || "Unknown",
        },
        rightFile: {
          id: result.submission2Id,
          path: rightSubmission?.submission.filePath || "",
          filename: rightSubmission?.submission.fileName || "Unknown",
          lineCount: result.rightTotal,
          studentId: rightSubmission?.submission.studentId?.toString(),
          studentName: rightSubmission?.studentName || "Unknown",
        },
        structuralScore,
        semanticScore: parseFloat(result.semanticScore || "0"),
        hybridScore,
        overlap: result.overlap,
        longest: result.longestFragment,
      }
    })

    const reportSubmissions = await this.getReportSubmissions(reportId)
    const submissionDTOs = this.mapSubmissionsToDTOs(reportSubmissions)

    return {
      reportId: reportId.toString(),
      isReusedReport: true,
      generatedAt: report.generatedAt.toISOString(),
      assignmentId: report.assignmentId,
      summary: {
        totalFiles: report.totalSubmissions,
        totalPairs: report.totalComparisons,
        suspiciousPairs: report.flaggedPairs,
        averageSimilarity: parseFloat(report.averageSimilarity || "0"),
        maxSimilarity: parseFloat(report.highestSimilarity || "0"),
      },
      submissions: submissionDTOs,
      pairs,
      warnings: [],
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
    }))
  }

  private isReportCurrent(
    report: SimilarityReport,
    latestSubmissions: Submission[],
  ): boolean {
    if (report.totalSubmissions !== latestSubmissions.length) {
      return false
    }

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

      const needsSwap = leftSubmissionId > rightSubmissionId
      const [firstSubmissionId, secondSubmissionId] = needsSwap
        ? [rightSubmissionId, leftSubmissionId]
        : [leftSubmissionId, rightSubmissionId]

      const pairKey = `${firstSubmissionId}-${secondSubmissionId}`
      pairMap.set(pairKey, pair)
      swappedMap.set(pairKey, needsSwap)

      const semanticScore = semanticScores.get(pairKey) ?? 0

      resultsToInsert.push({
        reportId,
        submission1Id: firstSubmissionId,
        submission2Id: secondSubmissionId,
        structuralScore: pair.similarity.toFixed(6),
        semanticScore: semanticScore.toFixed(6),
        hybridScore: this.computeHybrid(pair.similarity, semanticScore),
        overlap: pair.overlap,
        longestFragment: pair.longest,
        leftCovered: pair.leftCovered,
        rightCovered: pair.rightCovered,
        leftTotal: pair.leftTotal,
        rightTotal: pair.rightTotal,
        isFlagged: pair.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD,
      })
    }

    return { resultsToInsert, pairMap, swappedMap }
  }

  /**
   * Compute the hybrid score as an equal-weighted average of structural
   * and semantic scores. Returns a 6-decimal fixed-point string ready
   * for the numeric(7,6) database column.
   */
  private computeHybrid(structural: number, semantic: number): string {
    return (0.5 * structural + 0.5 * semantic).toFixed(6)
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

