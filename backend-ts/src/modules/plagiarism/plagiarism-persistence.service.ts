import { inject, injectable } from "tsyringe"
import { db } from "@/shared/database.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { Report, Pair } from "@/lib/plagiarism/index.js"
import {
  PLAGIARISM_CONFIG,
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
// Note: Error classes are preserved for future use but not imported to avoid TS6192
// import { PlagiarismResultNotFoundError, PlagiarismReportNotFoundError, PlagiarismPairNotFoundError } from "@/shared/errors.js";
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

  /** Get result with fragments and related submission info */
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
    const data = await this.similarityRepo.getResultWithFragments(resultId)
    if (!data) return null

    const { result, fragments } = data

    const [submission1, submission2] = await Promise.all([
      this.submissionRepo.getSubmissionWithStudent(result.submission1Id),
      this.submissionRepo.getSubmissionWithStudent(result.submission2Id),
    ])

    return { result, fragments, submission1, submission2 }
  }

  /**
   * Returns an existing assignment report when it is still current.
   * A report is considered current when latest-submission count matches and
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

    const latestSubmissions = await this.submissionRepo.getSubmissionsByAssignment(
      assignmentId,
      true,
    )

    if (!this.isReportCurrent(latestReport, latestSubmissions)) {
      return null
    }

    return latestReport.id
  }

  /** Persist report, results, and fragments to database */
  async persistReport(
    assignmentId: number,
    teacherId: number | undefined,
    report: Report,
    pairs: Pair[],
  ): Promise<{ dbReport: { id: number }; resultIdMap: Map<string, number> }> {
    return await db.transaction(async (tx) => {
      // Use transaction-aware repository
      const similarityRepoTx = this.similarityRepo.withContext(
        tx as unknown as TransactionContext,
      )

      // Create report
      const dbReport = await similarityRepoTx.createReport({
        assignmentId,
        teacherId: teacherId ?? null,
        totalSubmissions: report.files.length,
        totalComparisons: pairs.length,
        flaggedPairs: pairs.filter(
          (p) => p.similarity >= PLAGIARISM_CONFIG.DEFAULT_THRESHOLD,
        ).length,
        averageSimilarity: (
          pairs.reduce((sum, p) => sum + p.similarity, 0) /
          Math.max(1, pairs.length)
        ).toFixed(4),
        highestSimilarity: Math.max(
          ...pairs.map((p) => p.similarity),
          0,
        ).toFixed(4),
      })

      // Prepare results for batch insert
      const { resultsToInsert, pairMap, swappedMap } =
        this.prepareResultsForInsert(dbReport.id, pairs)

      // Batch insert results and fragments
      const resultIdMap = new Map<string, number>()

      if (resultsToInsert.length > 0) {
        const insertedResults =
          await similarityRepoTx.createResults(resultsToInsert)

        // Build result ID map
        for (const result of insertedResults) {
          const key = `${result.submission1Id}-${result.submission2Id}`
          resultIdMap.set(key, result.id)
        }

        // Prepare and insert fragments
        const fragmentsToInsert = this.prepareFragmentsForInsert(
          insertedResults,
          pairMap,
          swappedMap,
        )
        if (fragmentsToInsert.length > 0) {
          await similarityRepoTx.createFragments(fragmentsToInsert)
        }
      }

      await similarityRepoTx.deleteReportsByAssignmentExcept(
        assignmentId,
        dbReport.id,
      )

      return { dbReport, resultIdMap }
    })
  }

  /** Get report from database and reconstruct response */
  async getReport(reportId: number): Promise<AnalyzeResponse | null> {
    const report = await this.similarityRepo.getReportById(reportId)
    if (!report) {
      return null
    }

    const results = await this.similarityRepo.getResultsByReport(reportId)

    // Collect all unique submission IDs
    const submissionIds = new Set<number>()
    for (const result of results) {
      submissionIds.add(result.submission1Id)
      submissionIds.add(result.submission2Id)
    }

    // Batch fetch submissions
    const submissions =
      await this.submissionRepo.getBatchSubmissionsWithStudents(
        Array.from(submissionIds),
      )
    const submissionMap = new Map(submissions.map((s) => [s.submission.id, s]))

    // Build pairs using memory map
    const pairs: PlagiarismPairDTO[] = results.map((result) => {
      const submission1 = submissionMap.get(result.submission1Id)
      const submission2 = submissionMap.get(result.submission2Id)
      const structuralScore = parseFloat(result.structuralScore || "0")
      const rawHybridScore = parseFloat(result.hybridScore || "0")
      const hybridScore = rawHybridScore > 0 ? rawHybridScore : structuralScore

      return {
        id: result.id,
        leftFile: {
          id: result.submission1Id,
          path: submission1?.submission.filePath || "",
          filename: submission1?.submission.fileName || "Unknown",
          // Pair metrics are tracked in k-grams, so this uses k-gram totals
          // for consistent normalization in triage-table qualitative signals.
          lineCount: result.leftTotal,
          studentId: submission1?.submission.studentId?.toString(),
          studentName: submission1?.studentName || "Unknown",
        },
        rightFile: {
          id: result.submission2Id,
          path: submission2?.submission.filePath || "",
          filename: submission2?.submission.fileName || "Unknown",
          lineCount: result.rightTotal,
          studentId: submission2?.submission.studentId?.toString(),
          studentName: submission2?.studentName || "Unknown",
        },
        structuralScore,
        semanticScore: parseFloat(result.semanticScore || "0"),
        hybridScore,
        overlap: result.overlap,
        longest: result.longestFragment,
      }
    })

    return {
      reportId: reportId.toString(),
      isReusedReport: true,
      assignmentId: report.assignmentId,
      summary: {
        totalFiles: report.totalSubmissions,
        totalPairs: report.totalComparisons,
        suspiciousPairs: report.flaggedPairs,
        averageSimilarity: parseFloat(report.averageSimilarity || "0"),
        maxSimilarity: parseFloat(report.highestSimilarity || "0"),
      },
      pairs,
      warnings: [],
    }
  }

  /** Delete a report */
  async deleteReport(reportId: number): Promise<boolean> {
    return this.similarityRepo.deleteReport(reportId)
  }

  /** Get all submissions for a report's assignment */
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

  private isReportCurrent(
    report: SimilarityReport,
    latestSubmissions: Submission[],
  ): boolean {
    if (report.totalSubmissions !== latestSubmissions.length) {
      return false
    }

    const newestLatestSubmissionMs = latestSubmissions.reduce((currentMax, submission) => {
      const submittedAtMs = new Date(submission.submittedAt).getTime()
      return Math.max(currentMax, submittedAtMs)
    }, 0)

    const reportGeneratedAtMs = new Date(report.generatedAt).getTime()

    return newestLatestSubmissionMs <= reportGeneratedAtMs
  }

  /** Prepare results for database insertion */
  private prepareResultsForInsert(
    reportId: number,
    pairs: Pair[],
  ): {
    resultsToInsert: NewSimilarityResult[]
    pairMap: Map<string, Pair>
    swappedMap: Map<string, boolean>
  } {
    const resultsToInsert: NewSimilarityResult[] = []
    const pairMap = new Map<string, Pair>()
    const swappedMap = new Map<string, boolean>()

    for (const pair of pairs) {
      const leftSubId = parseInt(pair.leftFile.info?.submissionId || "0")
      const rightSubId = parseInt(pair.rightFile.info?.submissionId || "0")

      if (!leftSubId || !rightSubId) continue

      const needsSwap = leftSubId > rightSubId
      const [sub1, sub2] = needsSwap
        ? [rightSubId, leftSubId]
        : [leftSubId, rightSubId]

      const key = `${sub1}-${sub2}`
      pairMap.set(key, pair)
      swappedMap.set(key, needsSwap)

      resultsToInsert.push({
        reportId,
        submission1Id: sub1,
        submission2Id: sub2,
        structuralScore: pair.similarity.toFixed(4),
        semanticScore: "0",
        hybridScore: pair.similarity.toFixed(4),
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

  /** Prepare fragments for database insertion */
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

    for (const result of insertedResults) {
      const key = `${result.submission1Id}-${result.submission2Id}`
      const pair = pairMap.get(key)
      const swapped = swappedMap.get(key) || false

      if (pair) {
        const fragments = pair.buildFragments()

        for (const frag of fragments) {
          if (swapped) {
            fragmentsToInsert.push({
              similarityResultId: result.id,
              leftStartRow: frag.rightSelection.startRow,
              leftStartCol: frag.rightSelection.startCol,
              leftEndRow: frag.rightSelection.endRow,
              leftEndCol: frag.rightSelection.endCol,
              rightStartRow: frag.leftSelection.startRow,
              rightStartCol: frag.leftSelection.startCol,
              rightEndRow: frag.leftSelection.endRow,
              rightEndCol: frag.leftSelection.endCol,
              length: frag.length,
            })
          } else {
            fragmentsToInsert.push({
              similarityResultId: result.id,
              leftStartRow: frag.leftSelection.startRow,
              leftStartCol: frag.leftSelection.startCol,
              leftEndRow: frag.leftSelection.endRow,
              leftEndCol: frag.leftSelection.endCol,
              rightStartRow: frag.rightSelection.startRow,
              rightStartCol: frag.rightSelection.startCol,
              rightEndRow: frag.rightSelection.endRow,
              rightEndCol: frag.rightSelection.endCol,
              length: frag.length,
            })
          }
        }
      }
    }

    return fragmentsToInsert
  }
}
