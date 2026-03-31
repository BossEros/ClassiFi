import { inject, injectable } from "tsyringe"
import { File, LanguageName, Pair, Fragment } from "@/lib/plagiarism/index.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { SimilarityRepository, type CrossClassResultWithContext } from "@/modules/plagiarism/similarity.repository.js"
import { PlagiarismDetectorFactory } from "@/modules/plagiarism/plagiarism-detector.factory.js"
import { PlagiarismSubmissionFileService } from "@/modules/plagiarism/plagiarism-submission-file.service.js"
import { SemanticSimilarityClient } from "@/modules/plagiarism/semantic-similarity.client.js"
import { findMatchingAssignments, type MatchedAssignment } from "@/modules/plagiarism/cross-class-assignment-matcher.js"
import { PLAGIARISM_LANGUAGE_MAP, type PlagiarismFragmentDTO } from "@/modules/plagiarism/plagiarism.mapper.js"
import type { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import {
  buildPairSimilarityScoreBreakdown,
  formatPairSimilarityScoreForStorage,
  formatReportSimilarityScore,
  normalizeSubmissionPair,
  summarizePairSimilarityScores,
  type PairSimilarityScoreBreakdown,
} from "@/modules/plagiarism/plagiarism-scoring.js"
import { db } from "@/shared/database.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import {
  AssignmentNotFoundError,
  ForbiddenError,
  PlagiarismReportNotFoundError,
  PlagiarismResultNotFoundError,
  UnsupportedLanguageError,
} from "@/shared/errors.js"
import type { TransactionContext } from "@/shared/transaction.js"
import type {
  MatchFragment,
  NewMatchFragment,
  NewSimilarityResult,
  SimilarityReport,
} from "@/models/index.js"
import type { Assignment } from "@/modules/assignments/assignment.model.js"

const logger = createLogger("CrossClassSimilarityService")

/** Minimum structural score to proceed with expensive semantic scoring */
const SEMANTIC_PRE_FILTER_THRESHOLD = 0.15

/** Cross-class analysis response returned to the API layer */
export interface CrossClassAnalysisResponse {
  reportId: number
  generatedAt: string
  sourceAssignment: { id: number; name: string; className: string }
  matchedAssignments: Array<{ id: number; name: string; className: string; nameSimilarity: number }>
  summary: {
    totalSubmissions: number
    totalComparisons: number
    flaggedPairs: number
    averageSimilarity: number
    maxSimilarity: number
  }
  results: CrossClassResultDTO[]
}

/** Cross-class pair result for API responses */
export interface CrossClassResultDTO {
  id: number
  submission1Id: number
  submission2Id: number
  student1Name: string
  student2Name: string
  class1Name: string
  class2Name: string
  assignment1Name: string
  assignment2Name: string
  structuralScore: number
  semanticScore: number
  hybridScore: number
  overlap: number
  longestFragment: number
  isFlagged: boolean
}

/** Result details including file contents and fragment positions */
export interface CrossClassResultDetailsResponse {
  result: CrossClassResultDTO
  fragments: PlagiarismFragmentDTO[]
  leftFile: { filename: string; content: string; lineCount: number; studentName: string }
  rightFile: { filename: string; content: string; lineCount: number; studentName: string }
}

/** Internal type pairing file content with metadata */
interface CrossClassFileEntry {
  file: File
  assignmentId: number
  classId: number
  studentId: number
}

/**
 * Orchestrates cross-class similarity detection.
 *
 * Compares submissions across a teacher's classes for assignments with matching
 * programming language and similar names (Dice coefficient >= 0.8).
 */
@injectable()
export class CrossClassSimilarityService {
  constructor(
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.class)
    private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.similarity)
    private similarityRepo: SimilarityRepository,
    @inject(DI_TOKENS.services.plagiarismDetectorFactory)
    private detectorFactory: PlagiarismDetectorFactory,
    @inject(DI_TOKENS.services.plagiarismSubmissionFile)
    private fileService: PlagiarismSubmissionFileService,
    @inject(DI_TOKENS.services.semanticSimilarityClient)
    private semanticClient: SemanticSimilarityClient,
  ) {}

  /**
   * Run cross-class similarity analysis for a source assignment.
   *
   * @param sourceAssignmentId - The assignment to analyze cross-class similarity for.
   * @param teacherId - The authenticated teacher's user ID.
   * @returns The analysis report with results.
   */
  async analyzeCrossClassSimilarity(
    sourceAssignmentId: number,
    teacherId: number,
  ): Promise<CrossClassAnalysisResponse> {
    const sourceAssignment = await this.assignmentRepo.getAssignmentById(sourceAssignmentId)
    if (!sourceAssignment) {
      throw new AssignmentNotFoundError(sourceAssignmentId)
    }

    const language = this.resolveLanguage(sourceAssignment.programmingLanguage)

    const teacherClasses = await this.classRepo.getClassesByTeacher(teacherId, true)
    const sourceClass = teacherClasses.find((cls) => cls.id === sourceAssignment.classId)

    if (!sourceClass) {
      throw new ForbiddenError("You do not own the class containing this assignment")
    }

    const classIds = teacherClasses.map((cls) => cls.id)
    const allAssignments = await this.assignmentRepo.getAssignmentsByClassIds(classIds)
    const matchedAssignments = findMatchingAssignments(sourceAssignment, allAssignments)

    if (matchedAssignments.length === 0) {
      return this.buildEmptyResponse(sourceAssignment, sourceClass.className)
    }

    logger.info("Cross-class assignment matches found", {
      sourceAssignmentId,
      matchCount: matchedAssignments.length,
      matches: matchedAssignments.map((m) => ({
        id: m.assignment.id,
        name: m.assignment.assignmentName,
        similarity: m.nameSimilarity,
      })),
    })

    const allAssignmentIds = [sourceAssignmentId, ...matchedAssignments.map((m) => m.assignment.id)]
    const classMap = new Map(teacherClasses.map((cls) => [cls.id, cls]))

    const fileEntries = await this.fetchAllSubmissionFiles(allAssignmentIds, allAssignments, sourceAssignment)

    if (fileEntries.length < 2) {
      return this.buildEmptyResponse(sourceAssignment, sourceClass.className)
    }

    const crossClassPairEntries = this.generateCrossClassPairs(fileEntries)

    if (crossClassPairEntries.length === 0) {
      return this.buildEmptyResponse(sourceAssignment, sourceClass.className)
    }

    logger.info("Running structural analysis", { pairCount: crossClassPairEntries.length })

    const allFiles = fileEntries.map((entry) => entry.file)
    const detector = this.detectorFactory.create({ language })
    const report = await detector.analyze(allFiles)
    const allPairs = report.getPairs()

    const pairLookup = this.buildPairLookup(allPairs)
    const structuralScores = new Map<string, { pair: Pair; score: number }>()

    for (const [leftEntry, rightEntry] of crossClassPairEntries) {
      const leftSubId = parseInt(leftEntry.file.info?.submissionId || "0", 10)
      const rightSubId = parseInt(rightEntry.file.info?.submissionId || "0", 10)
      const normalized = normalizeSubmissionPair(leftSubId, rightSubId)
      const pairKey = `${leftEntry.file.path}|${rightEntry.file.path}`
      const pairKeyReverse = `${rightEntry.file.path}|${leftEntry.file.path}`
      const pair = pairLookup.get(pairKey) ?? pairLookup.get(pairKeyReverse)

      if (pair) {
        structuralScores.set(normalized.pairKey, { pair, score: pair.similarity })
      }
    }

    const semanticScores = await this.computeSemanticScoresWithPreFilter(
      crossClassPairEntries,
      structuralScores,
    )

    const persistResult = await this.persistCrossClassReport(
      sourceAssignmentId,
      teacherId,
      allAssignmentIds,
      crossClassPairEntries,
      structuralScores,
      semanticScores,
      report,
    )

    return this.buildAnalysisResponse(
      persistResult.dbReport,
      sourceAssignment,
      sourceClass.className,
      matchedAssignments,
      classMap,
      persistResult.resultsWithContext,
    )
  }

  /**
   * Get a cross-class report by ID with results.
   *
   * @param reportId - The numeric report ID.
   * @param teacherId - The requesting teacher's user ID.
   * @returns The report with cross-class results.
   */
  async getReport(reportId: number, teacherId: number): Promise<CrossClassAnalysisResponse> {
    const report = await this.similarityRepo.getReportById(reportId)

    if (!report || report.reportType !== "cross-class") {
      throw new PlagiarismReportNotFoundError(reportId.toString())
    }

    if (report.teacherId !== teacherId) {
      throw new ForbiddenError("You do not have access to this report")
    }

    const sourceAssignment = await this.assignmentRepo.getAssignmentById(report.assignmentId)
    if (!sourceAssignment) {
      throw new AssignmentNotFoundError(report.assignmentId)
    }

    const teacherClasses = await this.classRepo.getClassesByTeacher(teacherId, true)
    const classMap = new Map(teacherClasses.map((cls) => [cls.id, cls]))
    const sourceClass = classMap.get(sourceAssignment.classId)

    const matchedAssignmentIds = (report.matchedAssignmentIds ?? []) as number[]
    const matchedAssignmentObjects = await Promise.all(
      matchedAssignmentIds
        .filter((id) => id !== report.assignmentId)
        .map((id) => this.assignmentRepo.getAssignmentById(id)),
    )

    const matchedAssignments: MatchedAssignment[] = matchedAssignmentObjects
      .filter((a): a is Assignment => a !== undefined)
      .map((a) => ({ assignment: a, nameSimilarity: 1 }))

    const resultsWithContext = await this.similarityRepo.getCrossClassResultsWithContext(reportId)

    return this.buildAnalysisResponse(
      report,
      sourceAssignment,
      sourceClass?.className ?? "Unknown",
      matchedAssignments,
      classMap,
      resultsWithContext,
    )
  }

  /**
   * Get the latest cross-class report for a source assignment.
   *
   * @param assignmentId - The source assignment ID.
   * @param teacherId - The requesting teacher's user ID.
   * @returns The latest cross-class report, or null if none exists.
   */
  async getLatestReport(assignmentId: number, teacherId: number): Promise<CrossClassAnalysisResponse | null> {
    const report = await this.similarityRepo.getLatestCrossClassReport(assignmentId)
    if (!report) return null

    return this.getReport(report.id, teacherId)
  }

  /**
   * Get detailed result with code contents and fragments.
   *
   * @param resultId - The similarity result ID.
   * @param teacherId - The requesting teacher's user ID.
   * @returns The result details including file contents and matching fragments.
   */
  async getResultDetails(resultId: number, teacherId: number): Promise<CrossClassResultDetailsResponse> {
    const resultData = await this.similarityRepo.getResultWithFragments(resultId)
    if (!resultData) {
      throw new PlagiarismResultNotFoundError(resultId)
    }

    const { result, fragments } = resultData

    const report = await this.similarityRepo.getReportById(result.reportId)
    if (!report || report.reportType !== "cross-class" || report.teacherId !== teacherId) {
      throw new ForbiddenError("You do not have access to this result")
    }

    const crossClassResults = await this.similarityRepo.getCrossClassResultsWithContext(result.reportId)
    const contextRow = crossClassResults.find((r) => r.result.id === resultId)

    const [leftContent, rightContent] = await this.fileService.downloadSubmissionFiles(
      await this.resolveSubmissionFilePath(result.submission1Id),
      await this.resolveSubmissionFilePath(result.submission2Id),
    )

    const resultDto: CrossClassResultDTO = {
      id: result.id,
      submission1Id: result.submission1Id,
      submission2Id: result.submission2Id,
      student1Name: contextRow?.submission1StudentName ?? "Unknown",
      student2Name: contextRow?.submission2StudentName ?? "Unknown",
      class1Name: contextRow?.submission1ClassName ?? "Unknown",
      class2Name: contextRow?.submission2ClassName ?? "Unknown",
      assignment1Name: contextRow?.submission1AssignmentName ?? "Unknown",
      assignment2Name: contextRow?.submission2AssignmentName ?? "Unknown",
      structuralScore: parseFloat(result.structuralScore),
      semanticScore: parseFloat(result.semanticScore),
      hybridScore: parseFloat(result.hybridScore),
      overlap: result.overlap,
      longestFragment: result.longestFragment,
      isFlagged: result.isFlagged,
    }

    return {
      result: resultDto,
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
        filename: `submission_${result.submission1Id}`,
        content: leftContent,
        lineCount: leftContent.split("\n").length,
        studentName: contextRow?.submission1StudentName ?? "Unknown",
      },
      rightFile: {
        filename: `submission_${result.submission2Id}`,
        content: rightContent,
        lineCount: rightContent.split("\n").length,
        studentName: contextRow?.submission2StudentName ?? "Unknown",
      },
    }
  }

  /**
   * Delete a cross-class report.
   *
   * @param reportId - The report ID to delete.
   * @param teacherId - The requesting teacher's user ID.
   * @returns Whether the report was deleted.
   */
  async deleteReport(reportId: number, teacherId: number): Promise<boolean> {
    const report = await this.similarityRepo.getReportById(reportId)

    if (!report || report.reportType !== "cross-class") {
      throw new PlagiarismReportNotFoundError(reportId.toString())
    }

    if (report.teacherId !== teacherId) {
      throw new ForbiddenError("You do not have access to this report")
    }

    return this.similarityRepo.deleteReport(reportId)
  }

  // ===========================================================================
  // Private helpers
  // ===========================================================================

  private resolveLanguage(programmingLanguage: string): LanguageName {
    const language = PLAGIARISM_LANGUAGE_MAP[programmingLanguage.toLowerCase()]
    if (!language) {
      throw new UnsupportedLanguageError(programmingLanguage)
    }

    return language
  }

  /**
   * Fetch submission files for all matched assignments.
   * Silently skips assignments with insufficient submissions.
   */
  private async fetchAllSubmissionFiles(
    allAssignmentIds: number[],
    allAssignments: Assignment[],
    sourceAssignment: Assignment,
  ): Promise<CrossClassFileEntry[]> {
    const assignmentMap = new Map<number, Assignment>()
    assignmentMap.set(sourceAssignment.id, sourceAssignment)
    for (const a of allAssignments) {
      assignmentMap.set(a.id, a)
    }

    const fileEntries: CrossClassFileEntry[] = []

    for (const assignmentId of allAssignmentIds) {
      const assignment = assignmentMap.get(assignmentId)
      if (!assignment) continue

      try {
        const files = await this.fileService.fetchSubmissionFiles(assignmentId)

        for (const file of files) {
          fileEntries.push({
            file,
            assignmentId: assignment.id,
            classId: assignment.classId,
            studentId: parseInt(file.info?.studentId || "0", 10),
          })
        }
      } catch (error) {
        logger.warn(`Skipping assignment ${assignmentId} - insufficient submissions or download error`, { error })
        continue
      }
    }

    return fileEntries
  }

  /**
   * Generate cross-class pairs: only pairs where submissions come from different classes
   * and different students. Normalizes ordering to avoid duplicates.
   */
  private generateCrossClassPairs(
    fileEntries: CrossClassFileEntry[],
  ): Array<[CrossClassFileEntry, CrossClassFileEntry]> {
    const pairs: Array<[CrossClassFileEntry, CrossClassFileEntry]> = []
    const seenPairKeys = new Set<string>()

    for (let i = 0; i < fileEntries.length; i += 1) {
      for (let j = i + 1; j < fileEntries.length; j += 1) {
        const left = fileEntries[i]
        const right = fileEntries[j]

        if (left.classId === right.classId) continue
        if (left.studentId === right.studentId) continue

        const leftSubId = parseInt(left.file.info?.submissionId || "0", 10)
        const rightSubId = parseInt(right.file.info?.submissionId || "0", 10)
        const normalized = normalizeSubmissionPair(leftSubId, rightSubId)

        if (seenPairKeys.has(normalized.pairKey)) continue
        seenPairKeys.add(normalized.pairKey)

        pairs.push([left, right])
      }
    }

    return pairs
  }

  /** Build a lookup from file path pairs to their structural analysis Pair results */
  private buildPairLookup(pairs: Pair[]): Map<string, Pair> {
    const lookup = new Map<string, Pair>()

    for (const pair of pairs) {
      const key = `${pair.leftFile.path}|${pair.rightFile.path}`
      lookup.set(key, pair)
    }

    return lookup
  }

  /**
   * Compute semantic scores only for pairs whose structural score exceeds the pre-filter threshold.
   * Uses bounded concurrency matching the pattern in PlagiarismService.
   */
  private async computeSemanticScoresWithPreFilter(
    crossClassPairEntries: Array<[CrossClassFileEntry, CrossClassFileEntry]>,
    structuralScores: Map<string, { pair: Pair; score: number }>,
  ): Promise<Map<string, number>> {
    const semanticScores = new Map<string, number>()
    const queuedRequests: Array<{ key: string; leftContent: string; rightContent: string }> = []

    for (const [leftEntry, rightEntry] of crossClassPairEntries) {
      const leftSubId = parseInt(leftEntry.file.info?.submissionId || "0", 10)
      const rightSubId = parseInt(rightEntry.file.info?.submissionId || "0", 10)
      const normalized = normalizeSubmissionPair(leftSubId, rightSubId)
      const structural = structuralScores.get(normalized.pairKey)

      if (!structural || structural.score <= SEMANTIC_PRE_FILTER_THRESHOLD) {
        semanticScores.set(normalized.pairKey, 0)
        continue
      }

      queuedRequests.push({
        key: normalized.pairKey,
        leftContent: leftEntry.file.content,
        rightContent: rightEntry.file.content,
      })
    }

    if (queuedRequests.length === 0) return semanticScores

    logger.info("Running semantic scoring with pre-filter", {
      totalPairs: crossClassPairEntries.length,
      qualifiedPairs: queuedRequests.length,
    })

    const maxConcurrency = Math.max(1, settings.semanticSimilarityMaxConcurrentRequests ?? 4)
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

  /** Persist cross-class report, results, and fragments in a single transaction */
  private async persistCrossClassReport(
    sourceAssignmentId: number,
    teacherId: number,
    matchedAssignmentIds: number[],
    crossClassPairEntries: Array<[CrossClassFileEntry, CrossClassFileEntry]>,
    structuralScores: Map<string, { pair: Pair; score: number }>,
    semanticScores: Map<string, number>,
    report: { getPairs: () => Pair[]; getFragments: (pair: Pair) => Fragment[] },
  ): Promise<{
    dbReport: SimilarityReport
    resultsWithContext: CrossClassResultWithContext[]
  }> {
    const pairScoreBreakdowns = this.buildCrossClassScoreBreakdowns(
      crossClassPairEntries,
      structuralScores,
      semanticScores,
    )
    const pairSimilaritySummary = summarizePairSimilarityScores(pairScoreBreakdowns)

    const dbReport = await db.transaction(async (transaction) => {
      const repoWithContext = this.similarityRepo.withContext(
        transaction as unknown as TransactionContext,
      )

      await repoWithContext.acquireAssignmentReportLock(sourceAssignmentId)

      const createdReport = await repoWithContext.createReport({
        assignmentId: sourceAssignmentId,
        teacherId,
        reportType: "cross-class",
        matchedAssignmentIds,
        totalSubmissions: this.countUniqueSubmissions(crossClassPairEntries),
        totalComparisons: crossClassPairEntries.length,
        flaggedPairs: pairSimilaritySummary.suspiciousPairs,
        averageSimilarity: formatReportSimilarityScore(pairSimilaritySummary.averageSimilarity),
        highestSimilarity: formatReportSimilarityScore(pairSimilaritySummary.maxSimilarity),
      })

      const resultsToInsert = this.prepareResultsForInsert(
        createdReport.id,
        crossClassPairEntries,
        structuralScores,
        semanticScores,
      )

      if (resultsToInsert.length > 0) {
        const insertedResults = await repoWithContext.createResults(resultsToInsert)

        const fragmentsToInsert = this.prepareFragmentsForInsert(
          insertedResults,
          structuralScores,
          report,
        )

        if (fragmentsToInsert.length > 0) {
          await repoWithContext.createFragments(fragmentsToInsert)
        }
      }

      await repoWithContext.deleteCrossClassReportsExcept(
        sourceAssignmentId,
        createdReport.id,
      )

      return createdReport
    })

    const resultsWithContext = await this.similarityRepo.getCrossClassResultsWithContext(dbReport.id)

    return { dbReport, resultsWithContext }
  }

  private buildCrossClassScoreBreakdowns(
    crossClassPairEntries: Array<[CrossClassFileEntry, CrossClassFileEntry]>,
    structuralScores: Map<string, { pair: Pair; score: number }>,
    semanticScores: Map<string, number>,
  ): PairSimilarityScoreBreakdown[] {
    return crossClassPairEntries.map(([leftEntry, rightEntry]) => {
      const leftSubId = parseInt(leftEntry.file.info?.submissionId || "0", 10)
      const rightSubId = parseInt(rightEntry.file.info?.submissionId || "0", 10)
      const normalized = normalizeSubmissionPair(leftSubId, rightSubId)
      const structuralScore = structuralScores.get(normalized.pairKey)?.score ?? 0
      const semanticScore = semanticScores.get(normalized.pairKey) ?? 0

      return buildPairSimilarityScoreBreakdown(structuralScore, semanticScore)
    })
  }

  private prepareResultsForInsert(
    reportId: number,
    crossClassPairEntries: Array<[CrossClassFileEntry, CrossClassFileEntry]>,
    structuralScores: Map<string, { pair: Pair; score: number }>,
    semanticScores: Map<string, number>,
  ): NewSimilarityResult[] {
    return crossClassPairEntries.map(([leftEntry, rightEntry]) => {
      const leftSubId = parseInt(leftEntry.file.info?.submissionId || "0", 10)
      const rightSubId = parseInt(rightEntry.file.info?.submissionId || "0", 10)
      const normalized = normalizeSubmissionPair(leftSubId, rightSubId)
      const structural = structuralScores.get(normalized.pairKey)
      const structuralScore = structural?.score ?? 0
      const semanticScore = semanticScores.get(normalized.pairKey) ?? 0
      const breakdown = buildPairSimilarityScoreBreakdown(structuralScore, semanticScore)
      const pair = structural?.pair

      return {
        reportId,
        submission1Id: normalized.submission1Id,
        submission2Id: normalized.submission2Id,
        structuralScore: formatPairSimilarityScoreForStorage(structuralScore),
        semanticScore: formatPairSimilarityScoreForStorage(semanticScore),
        hybridScore: formatPairSimilarityScoreForStorage(breakdown.hybridScore),
        overlap: pair?.overlap ?? 0,
        longestFragment: pair?.longest ?? 0,
        leftCovered: pair?.leftCovered ?? 0,
        rightCovered: pair?.rightCovered ?? 0,
        leftTotal: pair?.leftTotal ?? 0,
        rightTotal: pair?.rightTotal ?? 0,
        isFlagged: breakdown.isSuspicious,
      }
    })
  }

  private prepareFragmentsForInsert(
    insertedResults: Array<{ id: number; submission1Id: number; submission2Id: number }>,
    structuralScores: Map<string, { pair: Pair; score: number }>,
    report: { getFragments: (pair: Pair) => Fragment[] },
  ): NewMatchFragment[] {
    const fragments: NewMatchFragment[] = []

    for (const insertedResult of insertedResults) {
      const pairKey = `${insertedResult.submission1Id}-${insertedResult.submission2Id}`
      const structural = structuralScores.get(pairKey)
      if (!structural?.pair) continue

      const pairFragments = report.getFragments(structural.pair)

      for (const fragment of pairFragments) {
        fragments.push({
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

    return fragments
  }

  private countUniqueSubmissions(
    crossClassPairEntries: Array<[CrossClassFileEntry, CrossClassFileEntry]>,
  ): number {
    const submissionIds = new Set<number>()

    for (const [left, right] of crossClassPairEntries) {
      submissionIds.add(parseInt(left.file.info?.submissionId || "0", 10))
      submissionIds.add(parseInt(right.file.info?.submissionId || "0", 10))
    }

    submissionIds.delete(0)

    return submissionIds.size
  }

  private buildEmptyResponse(
    sourceAssignment: Assignment,
    sourceClassName: string,
  ): CrossClassAnalysisResponse {
    return {
      reportId: 0,
      generatedAt: new Date().toISOString(),
      sourceAssignment: {
        id: sourceAssignment.id,
        name: sourceAssignment.assignmentName,
        className: sourceClassName,
      },
      matchedAssignments: [],
      summary: {
        totalSubmissions: 0,
        totalComparisons: 0,
        flaggedPairs: 0,
        averageSimilarity: 0,
        maxSimilarity: 0,
      },
      results: [],
    }
  }

  private buildAnalysisResponse(
    dbReport: SimilarityReport | { id: number; generatedAt: Date },
    sourceAssignment: Assignment,
    sourceClassName: string,
    matchedAssignments: MatchedAssignment[],
    classMap: Map<number, { id: number; className: string }>,
    resultsWithContext: CrossClassResultWithContext[],
  ): CrossClassAnalysisResponse {
    return {
      reportId: dbReport.id,
      generatedAt: dbReport.generatedAt.toISOString(),
      sourceAssignment: {
        id: sourceAssignment.id,
        name: sourceAssignment.assignmentName,
        className: sourceClassName,
      },
      matchedAssignments: matchedAssignments.map((m) => ({
        id: m.assignment.id,
        name: m.assignment.assignmentName,
        className: classMap.get(m.assignment.classId)?.className ?? "Unknown",
        nameSimilarity: m.nameSimilarity,
      })),
      summary: {
        totalSubmissions: (dbReport as SimilarityReport).totalSubmissions ?? 0,
        totalComparisons: (dbReport as SimilarityReport).totalComparisons ?? 0,
        flaggedPairs: (dbReport as SimilarityReport).flaggedPairs ?? 0,
        averageSimilarity: parseFloat((dbReport as SimilarityReport).averageSimilarity ?? "0"),
        maxSimilarity: parseFloat((dbReport as SimilarityReport).highestSimilarity ?? "0"),
      },
      results: resultsWithContext.map((row) => ({
        id: row.result.id,
        submission1Id: row.result.submission1Id,
        submission2Id: row.result.submission2Id,
        student1Name: row.submission1StudentName,
        student2Name: row.submission2StudentName,
        class1Name: row.submission1ClassName,
        class2Name: row.submission2ClassName,
        assignment1Name: row.submission1AssignmentName,
        assignment2Name: row.submission2AssignmentName,
        structuralScore: parseFloat(row.result.structuralScore),
        semanticScore: parseFloat(row.result.semanticScore),
        hybridScore: parseFloat(row.result.hybridScore),
        overlap: row.result.overlap,
        longestFragment: row.result.longestFragment,
        isFlagged: row.result.isFlagged,
      })),
    }
  }

  /**
   * Resolve a submission's file path by ID.
   * Uses the submission repository via the file service's download pattern.
   */
  private async resolveSubmissionFilePath(submissionId: number): Promise<string> {
    const { container } = await import("@/shared/container.js")
    const submissionRepo = container.resolve<SubmissionRepository>(DI_TOKENS.repositories.submission)
    const submission = await submissionRepo.getSubmissionWithStudent(submissionId)

    if (!submission) {
      throw new PlagiarismResultNotFoundError(submissionId)
    }

    return submission.submission.filePath
  }
}
