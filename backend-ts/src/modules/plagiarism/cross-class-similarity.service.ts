import { inject, injectable } from "tsyringe"
import { File, LanguageName, Pair, Fragment } from "@/lib/plagiarism/index.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { SimilarityRepository, type CrossClassResultWithContext } from "@/modules/plagiarism/similarity.repository.js"
import { PlagiarismDetectorFactory } from "@/modules/plagiarism/plagiarism-detector.factory.js"
import { PlagiarismSubmissionFileService } from "@/modules/plagiarism/plagiarism-submission-file.service.js"
import { SemanticSimilarityClient } from "@/modules/plagiarism/semantic-similarity.client.js"
import { findMatchingAssignments, type MatchedAssignment } from "@/modules/plagiarism/cross-class-assignment-matcher.js"
import { PLAGIARISM_LANGUAGE_MAP, type PlagiarismFragmentDTO } from "@/modules/plagiarism/plagiarism.mapper.js"
import {
  buildPairSimilarityScoreBreakdown,
  formatPairSimilarityScoreForStorage,
  formatReportSimilarityScore,
  normalizeSubmissionPair,
  summarizePairSimilarityScores,
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

// ============================================================================
// Public API Types
// ============================================================================

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

// ============================================================================
// Internal Types
// ============================================================================

/** Metadata tag embedded in each File.info for cross-class pairing */
interface CrossClassFileMetadata {
  submissionId: string
  studentId: string
  studentName?: string
  classId: string
}

/** A cross-class pair extracted from the detector's output */
interface CrossClassDetectorPair {
  pair: Pair
  leftSubmissionId: number
  rightSubmissionId: number
  pairKey: string
}

/**
 * Orchestrates cross-class similarity detection.
 *
 * Compares submissions across a teacher's classes for assignments with matching
 * programming language and similar names (Dice coefficient >= 0.8).
 *
 * Uses a single-pass approach: the plagiarism detector analyzes all files together,
 * then each detector pair is classified as cross-class or intra-class based on the
 * classId tag embedded in each file's metadata. This avoids the fragile two-step
 * pattern of generating pairs separately and reconciling them via file-path lookups.
 */
@injectable()
export class CrossClassSimilarityService {
  constructor(
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.class)
    private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
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

    // Step 1: Collect files, tagging each with classId in its metadata
    const taggedFiles = await this.collectTaggedSubmissionFiles(allAssignmentIds, allAssignments, sourceAssignment)

    if (taggedFiles.length < 2) {
      return this.buildEmptyResponse(sourceAssignment, sourceClass.className)
    }

    // Step 2: Run structural analysis on all files at once
    logger.info("Running structural analysis", { fileCount: taggedFiles.length })

    const detector = this.detectorFactory.create({ language })
    const detectorReport = await detector.analyze(taggedFiles)

    // Step 3: Extract only cross-class pairs from the detector's results
    const crossClassPairs = this.extractCrossClassPairs(detectorReport.getPairs())

    if (crossClassPairs.length === 0) {
      return this.buildEmptyResponse(sourceAssignment, sourceClass.className)
    }

    logger.info("Cross-class pairs extracted", { pairCount: crossClassPairs.length })

    // Step 4: Compute semantic scores (only for pairs above the structural threshold)
    const semanticScores = await this.computeSemanticScores(crossClassPairs)

    // Step 5: Persist report, results, and fragments in a transaction
    const persistResult = await this.persistReport(
      sourceAssignmentId,
      teacherId,
      allAssignmentIds,
      crossClassPairs,
      semanticScores,
      detectorReport,
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
  async getLatestReport(
    assignmentId: number,
    teacherId: number,
  ): Promise<CrossClassAnalysisResponse | null> {
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
  async getResultDetails(
    resultId: number,
    teacherId: number,
  ): Promise<CrossClassResultDetailsResponse> {
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

    const [leftFilePath, rightFilePath] = await Promise.all([
      this.resolveSubmissionFilePath(result.submission1Id),
      this.resolveSubmissionFilePath(result.submission2Id),
    ])

    const [leftContent, rightContent] = await this.fileService.downloadSubmissionFiles(
      leftFilePath,
      rightFilePath,
    )

    return {
      result: this.mapResultWithContextToDTO(result, contextRow),
      fragments: this.mapFragmentsToDTOs(fragments),
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
  // File Collection
  // ===========================================================================

  /**
   * Collect submission files from all matched assignments, tagging each with
   * a classId label so cross-class pairs can be identified from the
   * detector's output without a secondary lookup.
   *
   * @param allAssignmentIds - IDs of the source + matched assignments.
   * @param allAssignments - All assignments from the teacher's classes.
   * @param sourceAssignment - The source assignment being analyzed.
   * @returns Tagged File objects ready for the plagiarism detector.
   */
  private async collectTaggedSubmissionFiles(
    allAssignmentIds: number[],
    allAssignments: Assignment[],
    sourceAssignment: Assignment,
  ): Promise<File[]> {
    const assignmentMap = new Map<number, Assignment>()
    assignmentMap.set(sourceAssignment.id, sourceAssignment)

    for (const assignment of allAssignments) {
      assignmentMap.set(assignment.id, assignment)
    }

    const taggedFiles: File[] = []

    for (const assignmentId of allAssignmentIds) {
      const assignment = assignmentMap.get(assignmentId)

      if (!assignment) continue

      try {
        const files = await this.fileService.fetchSubmissionFiles(assignmentId)

        for (const file of files) {
          const taggedFile = new File(file.path, file.content, {
            ...file.info,
            classId: String(assignment.classId),
          } as CrossClassFileMetadata)

          taggedFiles.push(taggedFile)
        }
      } catch (error) {
        logger.warn("Skipping assignment due to file fetch error", {
          assignmentId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return taggedFiles
  }

  // ===========================================================================
  // Pair Extraction
  // ===========================================================================

  /**
   * Filter the detector's pairs to only those where the two files belong
   * to different classes and different students.
   *
   * This is the core improvement over the old approach: instead of generating
   * expected pairs up front and trying to match them back to detector output
   * via file paths, we read the metadata directly from each detector pair.
   *
   * @param detectorPairs - All pairs produced by the plagiarism detector.
   * @returns Only the pairs spanning different classes.
   */
  private extractCrossClassPairs(detectorPairs: Pair[]): CrossClassDetectorPair[] {
    const crossClassPairs: CrossClassDetectorPair[] = []
    const seenPairKeys = new Set<string>()

    for (const pair of detectorPairs) {
      const leftClassId = pair.leftFile.info?.classId
      const rightClassId = pair.rightFile.info?.classId

      if (!leftClassId || !rightClassId || leftClassId === rightClassId) continue

      const leftStudentId = pair.leftFile.info?.studentId
      const rightStudentId = pair.rightFile.info?.studentId

      if (leftStudentId && rightStudentId && leftStudentId === rightStudentId) continue

      const leftSubmissionId = this.parseSubmissionId(pair.leftFile.info?.submissionId)
      const rightSubmissionId = this.parseSubmissionId(pair.rightFile.info?.submissionId)

      if (leftSubmissionId === 0 || rightSubmissionId === 0) {
        logger.warn("Skipping pair with missing submission ID", {
          leftPath: pair.leftFile.path,
          rightPath: pair.rightFile.path,
        })
        continue
      }

      const normalized = normalizeSubmissionPair(leftSubmissionId, rightSubmissionId)

      if (seenPairKeys.has(normalized.pairKey)) continue

      seenPairKeys.add(normalized.pairKey)
      crossClassPairs.push({
        pair,
        leftSubmissionId: normalized.submission1Id,
        rightSubmissionId: normalized.submission2Id,
        pairKey: normalized.pairKey,
      })
    }

    return crossClassPairs
  }

  // ===========================================================================
  // Semantic Scoring
  // ===========================================================================

  /**
   * Compute semantic scores for cross-class pairs whose structural score
   * exceeds the pre-filter threshold. Uses bounded concurrency.
   *
   * @param crossClassPairs - The cross-class pairs to score.
   * @returns A map from pair key to semantic score.
   */
  private async computeSemanticScores(
    crossClassPairs: CrossClassDetectorPair[],
  ): Promise<Map<string, number>> {
    const semanticScores = new Map<string, number>()

    const qualifiedRequests: Array<{
      pairKey: string
      leftContent: string
      rightContent: string
    }> = []

    for (const crossClassPair of crossClassPairs) {
      if (crossClassPair.pair.similarity <= SEMANTIC_PRE_FILTER_THRESHOLD) {
        semanticScores.set(crossClassPair.pairKey, 0)
        continue
      }

      qualifiedRequests.push({
        pairKey: crossClassPair.pairKey,
        leftContent: crossClassPair.pair.leftFile.content,
        rightContent: crossClassPair.pair.rightFile.content,
      })
    }

    if (qualifiedRequests.length === 0) return semanticScores

    logger.info("Running semantic scoring with pre-filter", {
      totalPairs: crossClassPairs.length,
      qualifiedPairs: qualifiedRequests.length,
    })

    const maxConcurrency = Math.max(1, settings.semanticSimilarityMaxConcurrentRequests ?? 4)
    const workerCount = Math.min(maxConcurrency, qualifiedRequests.length)
    let nextIndex = 0

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (nextIndex < qualifiedRequests.length) {
          const currentIndex = nextIndex
          nextIndex += 1
          const request = qualifiedRequests[currentIndex]

          const semanticScore = await this.semanticClient.getSemanticScore(
            request.leftContent,
            request.rightContent,
          )

          semanticScores.set(request.pairKey, semanticScore)
        }
      }),
    )

    return semanticScores
  }

  // ===========================================================================
  // Persistence
  // ===========================================================================

  /**
   * Persist the cross-class report, similarity results, and match fragments
   * inside a single database transaction with an advisory lock to prevent
   * concurrent duplicate reports for the same assignment.
   *
   * @param sourceAssignmentId - The source assignment ID.
   * @param teacherId - The teacher who triggered the analysis.
   * @param matchedAssignmentIds - All assignment IDs involved (source + matched).
   * @param crossClassPairs - The cross-class detector pairs to persist.
   * @param semanticScores - Semantic scores keyed by pair key.
   * @param detectorReport - The full detector report (for fragment extraction).
   * @returns The created DB report and enriched results with context.
   */
  private async persistReport(
    sourceAssignmentId: number,
    teacherId: number,
    matchedAssignmentIds: number[],
    crossClassPairs: CrossClassDetectorPair[],
    semanticScores: Map<string, number>,
    detectorReport: { getFragments: (pair: Pair) => Fragment[] },
  ): Promise<{
    dbReport: SimilarityReport
    resultsWithContext: CrossClassResultWithContext[]
  }> {
    const scoreBreakdowns = crossClassPairs.map((crossClassPair) => {
      const semanticScore = semanticScores.get(crossClassPair.pairKey) ?? 0

      return buildPairSimilarityScoreBreakdown(crossClassPair.pair.similarity, semanticScore)
    })

    const summary = summarizePairSimilarityScores(scoreBreakdowns)

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
        totalSubmissions: this.countUniqueSubmissions(crossClassPairs),
        totalComparisons: crossClassPairs.length,
        flaggedPairs: summary.suspiciousPairs,
        averageSimilarity: formatReportSimilarityScore(summary.averageSimilarity),
        highestSimilarity: formatReportSimilarityScore(summary.maxSimilarity),
      })

      const resultsToInsert = this.buildResultInserts(createdReport.id, crossClassPairs, semanticScores)

      if (resultsToInsert.length > 0) {
        const insertedResults = await repoWithContext.createResults(resultsToInsert)
        const fragmentsToInsert = this.buildFragmentInserts(insertedResults, crossClassPairs, detectorReport)

        if (fragmentsToInsert.length > 0) {
          await repoWithContext.createFragments(fragmentsToInsert)
        }
      }

      return createdReport
    })

    const resultsWithContext = await this.similarityRepo.getCrossClassResultsWithContext(dbReport.id)

    return { dbReport, resultsWithContext }
  }

  /**
   * Build NewSimilarityResult rows from cross-class pairs and their scores.
   *
   * @param reportId - The parent report ID.
   * @param crossClassPairs - Detector pairs classified as cross-class.
   * @param semanticScores - Semantic scores keyed by pair key.
   * @returns Array of result rows ready for batch insert.
   */
  private buildResultInserts(
    reportId: number,
    crossClassPairs: CrossClassDetectorPair[],
    semanticScores: Map<string, number>,
  ): NewSimilarityResult[] {
    return crossClassPairs.map((crossClassPair) => {
      const structuralScore = crossClassPair.pair.similarity
      const semanticScore = semanticScores.get(crossClassPair.pairKey) ?? 0
      const breakdown = buildPairSimilarityScoreBreakdown(structuralScore, semanticScore)

      return {
        reportId,
        submission1Id: crossClassPair.leftSubmissionId,
        submission2Id: crossClassPair.rightSubmissionId,
        structuralScore: formatPairSimilarityScoreForStorage(structuralScore),
        semanticScore: formatPairSimilarityScoreForStorage(semanticScore),
        hybridScore: formatPairSimilarityScoreForStorage(breakdown.hybridScore),
        overlap: crossClassPair.pair.overlap,
        longestFragment: crossClassPair.pair.longest,
        leftCovered: crossClassPair.pair.leftCovered,
        rightCovered: crossClassPair.pair.rightCovered,
        leftTotal: crossClassPair.pair.leftTotal,
        rightTotal: crossClassPair.pair.rightTotal,
        isFlagged: breakdown.isSuspicious,
      }
    })
  }

  /**
   * Build NewMatchFragment rows by extracting fragments from each detector pair
   * and associating them with the corresponding inserted result row.
   *
   * @param insertedResults - The DB-inserted result rows (with IDs assigned).
   * @param crossClassPairs - The cross-class detector pairs (same order as results).
   * @param detectorReport - The detector report for fragment extraction.
   * @returns Flat array of fragment rows ready for batch insert.
   */
  private buildFragmentInserts(
    insertedResults: Array<{ id: number; submission1Id: number; submission2Id: number }>,
    crossClassPairs: CrossClassDetectorPair[],
    detectorReport: { getFragments: (pair: Pair) => Fragment[] },
  ): NewMatchFragment[] {
    const pairByKey = new Map<string, CrossClassDetectorPair>()

    for (const crossClassPair of crossClassPairs) {
      pairByKey.set(crossClassPair.pairKey, crossClassPair)
    }

    const allFragments: NewMatchFragment[] = []

    for (const insertedResult of insertedResults) {
      const pairKey = `${insertedResult.submission1Id}-${insertedResult.submission2Id}`
      const crossClassPair = pairByKey.get(pairKey)

      if (!crossClassPair) continue

      const detectorFragments = detectorReport.getFragments(crossClassPair.pair)

      for (const fragment of detectorFragments) {
        allFragments.push({
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

    return allFragments
  }

  // ===========================================================================
  // Response Building
  // ===========================================================================

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
      results: resultsWithContext.map((row) => this.mapResultWithContextToDTO(row.result, row)),
    }
  }

  private mapResultWithContextToDTO(
    result: { id: number; submission1Id: number; submission2Id: number; structuralScore: string; semanticScore: string; hybridScore: string; overlap: number; longestFragment: number; isFlagged: boolean },
    context?: CrossClassResultWithContext,
  ): CrossClassResultDTO {
    return {
      id: result.id,
      submission1Id: result.submission1Id,
      submission2Id: result.submission2Id,
      student1Name: context?.submission1StudentName ?? "Unknown",
      student2Name: context?.submission2StudentName ?? "Unknown",
      class1Name: context?.submission1ClassName ?? "Unknown",
      class2Name: context?.submission2ClassName ?? "Unknown",
      assignment1Name: context?.submission1AssignmentName ?? "Unknown",
      assignment2Name: context?.submission2AssignmentName ?? "Unknown",
      structuralScore: parseFloat(result.structuralScore),
      semanticScore: parseFloat(result.semanticScore),
      hybridScore: parseFloat(result.hybridScore),
      overlap: result.overlap,
      longestFragment: result.longestFragment,
      isFlagged: result.isFlagged,
    }
  }

  private mapFragmentsToDTOs(fragments: MatchFragment[]): PlagiarismFragmentDTO[] {
    return fragments.map((fragment) => ({
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
    }))
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  private resolveLanguage(programmingLanguage: string): LanguageName {
    const language = PLAGIARISM_LANGUAGE_MAP[programmingLanguage.toLowerCase()]

    if (!language) {
      throw new UnsupportedLanguageError(programmingLanguage)
    }

    return language
  }

  /**
   * Safely parse a submission ID string. Returns 0 if the value is missing or invalid.
   *
   * @param rawSubmissionId - The raw string submission ID from file metadata.
   * @returns The parsed numeric submission ID, or 0 if invalid.
   */
  private parseSubmissionId(rawSubmissionId: string | undefined): number {
    if (!rawSubmissionId) return 0

    const parsed = parseInt(rawSubmissionId, 10)

    return Number.isNaN(parsed) ? 0 : parsed
  }

  /**
   * Count unique submission IDs across all cross-class pairs.
   *
   * @param crossClassPairs - The cross-class detector pairs.
   * @returns The number of unique submissions involved.
   */
  private countUniqueSubmissions(crossClassPairs: CrossClassDetectorPair[]): number {
    const submissionIds = new Set<number>()

    for (const { leftSubmissionId, rightSubmissionId } of crossClassPairs) {
      submissionIds.add(leftSubmissionId)
      submissionIds.add(rightSubmissionId)
    }

    return submissionIds.size
  }

  /**
   * Resolve a submission's file path by ID using the injected submission repository.
   *
   * @param submissionId - The submission whose storage path to resolve.
   * @returns The file path in the storage bucket.
   */
  private async resolveSubmissionFilePath(submissionId: number): Promise<string> {
    const submission = await this.submissionRepo.getSubmissionWithStudent(submissionId)

    if (!submission) {
      throw new PlagiarismResultNotFoundError(submissionId)
    }

    return submission.submission.filePath
  }
}
