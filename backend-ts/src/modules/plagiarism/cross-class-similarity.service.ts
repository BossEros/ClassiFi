import { inject, injectable } from "tsyringe"
import { File, LanguageName, Pair, Fragment } from "@/lib/plagiarism/index.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { SimilarityRepository, type CrossClassResultWithContext } from "@/modules/plagiarism/similarity.repository.js"
import { PlagiarismSubmissionFileService } from "@/modules/plagiarism/plagiarism-submission-file.service.js"
import { SemanticSimilarityClient, cosineSimilarity } from "@/modules/plagiarism/semantic-similarity.client.js"
import { findMatchingAssignments, type MatchedAssignment } from "@/modules/plagiarism/cross-class-assignment-matcher.js"
import { PLAGIARISM_LANGUAGE_MAP, createPlagiarismDetector, type PlagiarismFragmentDTO } from "@/modules/plagiarism/plagiarism.mapper.js"
import {
  buildPairSimilarityScoreBreakdown,
  formatSimilarityScore,
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
import type { SimilarityReport } from "@/modules/plagiarism/similarity-report.model.js"
import type { MatchFragment, NewMatchFragment } from "@/modules/plagiarism/match-fragment.model.js"
import type { NewSimilarityResult } from "@/modules/plagiarism/similarity-result.model.js"
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
  matchedAssignments: Array<{ id: number; name: string; className: string; classCode: string; nameSimilarity: number }>
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
  class1Code: string
  class2Name: string
  class2Code: string
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
    // STEP 1: Guard checks and discovery
    // Verify the source assignment exists before proceeding with any analysis.
    const sourceAssignment = await this.assignmentRepo.getAssignmentById(sourceAssignmentId)

    if (!sourceAssignment) {
      throw new AssignmentNotFoundError(sourceAssignmentId)
    }

    // Map the assignment's programming language to the detector's expected LanguageName enum.
    // Throws UnsupportedLanguageError if the language is not supported by the plagiarism detector.
    const language = this.resolveLanguage(sourceAssignment.programmingLanguage)

    // Fetch all classes owned by the teacher (active only) so we can scope the analysis
    // to assignments that belong to this teacher's classes.
    const teacherClasses = await this.classRepo.getClassesByTeacher(teacherId, true)

    // Confirm the source assignment's class is actually owned by this teacher.
    // This prevents a teacher from triggering analysis on another teacher's assignment.
    const sourceClass = teacherClasses.find((cls) => cls.id === sourceAssignment.classId)

    if (!sourceClass) {
      throw new ForbiddenError("You do not own the class containing this assignment")
    }

    // Collect all assignments across every class the teacher owns,
    // then find the ones that "match" the source (same language + similar name via Dice coefficient >= 0.8).
    // These matched assignments are the candidates for cross-class comparison.
    const classIds = teacherClasses.map((cls) => cls.id)
    const allAssignments = await this.assignmentRepo.getAssignmentsByClassIds(classIds)
    const matchedAssignments = findMatchingAssignments(sourceAssignment, allAssignments)

    // If no matching assignments are found across other classes, there is nothing to compare.
    // Return an empty report immediately to avoid unnecessary processing.
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

    // Build the full set of assignment IDs involved in this analysis (source + all matches)
    // and a lookup map from classId → class object used later for response building.
    const allAssignmentIds = [sourceAssignmentId, ...matchedAssignments.map((m) => m.assignment.id)]
    const classMap = new Map(teacherClasses.map((cls) => [cls.id, cls]))

    // STEP 2: Check cache — if a current report exists and matches the submission state, return it immediately
    // and skip the expensive file download + detection + semantic pipeline.
    const cachedReport = await this.tryGetCachedCrossClassReport(
      sourceAssignmentId,
      teacherId,
      allAssignmentIds,
    )

    if (cachedReport) return cachedReport

    // STEP 3: File collection
    // Download submission files for every involved assignment.
    // Each file is tagged with its classId in metadata so we can tell which class it belongs to later.
    const taggedFiles = await this.collectTaggedSubmissionFiles(allAssignmentIds, allAssignments, sourceAssignment)

    // Need at least 2 files to form a comparison pair — bail out if not enough submissions exist.
    if (taggedFiles.length < 2) {
      return this.buildEmptyResponse(sourceAssignment, sourceClass.className)
    }

    // STEP 4: Structural detection (Winnowing fingerprinting)
    // Run all files through the plagiarism detector at once.
    // The detector compares every file against every other file using fingerprinting (Winnowing algorithm).
    logger.info("Running structural analysis", { fileCount: taggedFiles.length })

    const detector = createPlagiarismDetector(language)
    const detectorReport = await detector.analyze(taggedFiles)

    // STEP 5: Cross-class pair filtering
    // The detector returns ALL matching pairs, including same-class pairs.
    // Filter down to only pairs where the two files come from different classes.
    const crossClassPairs = this.extractCrossClassPairs(detectorReport.getPairs())

    // If no cross-class matches were found, return an empty report.
    if (crossClassPairs.length === 0) {
      return this.buildEmptyResponse(sourceAssignment, sourceClass.className)
    }

    logger.info("Cross-class pairs extracted", { pairCount: crossClassPairs.length })

    // STEP 6: Semantic scoring (GraphCodeBERT)
    // For pairs that passed the structural threshold, compute a semantic similarity score
    // using the GraphCodeBERT microservice. This gives a deeper, meaning-based comparison
    // beyond just code structure.
    const semanticScores = await this.computeSemanticScores(crossClassPairs)

    // STEP 7: Persistence
    // Save the report, per-pair results, and matching code fragment positions to the database
    // inside a single transaction so all data is written atomically.
    const persistResult = await this.persistReport(
      sourceAssignmentId,
      teacherId,
      allAssignmentIds,
      crossClassPairs,
      semanticScores,
      detectorReport,
    )

    // Prune any older cross-class reports for this assignment now that the new one is saved.
    // This keeps the database tidy and ensures only the latest report is retained.
    const prunedCount = await this.similarityRepo.deleteCrossClassReportsExcept(sourceAssignmentId, persistResult.dbReport.id)

    logger.info("Cross-class old reports pruned", {
      assignmentId: sourceAssignmentId,
      keptReportId: persistResult.dbReport.id,
      prunedCount,
    })

    // STEP 8: Build and return the analysis response
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
    // Look up the report and make sure it exists and is a cross-class report (not an intra-assignment one).
    const report = await this.similarityRepo.getReportById(reportId)

    if (!report || report.reportType !== "cross-class") {
      throw new PlagiarismReportNotFoundError(reportId.toString())
    }

    // Make sure the requesting teacher actually owns this report.
    if (report.teacherId !== teacherId) {
      throw new ForbiddenError("You do not have access to this report")
    }

    // Re-fetch the source assignment so we can include its name and class in the response.
    const sourceAssignment = await this.assignmentRepo.getAssignmentById(report.assignmentId)

    if (!sourceAssignment) {
      throw new AssignmentNotFoundError(report.assignmentId)
    }

    // Build a classId → class lookup map so we can resolve class names for the response.
    const teacherClasses = await this.classRepo.getClassesByTeacher(teacherId, true)
    const classMap = new Map(teacherClasses.map((cls) => [cls.id, cls]))
    const sourceClass = classMap.get(sourceAssignment.classId)

    // The report stores the IDs of all matched assignments; re-fetch their details
    // so we can include their names and class names in the response.
    const matchedAssignmentIds = (report.matchedAssignmentIds ?? []) as number[]
    const matchedAssignmentObjects = await Promise.all(
      matchedAssignmentIds
        .filter((id) => id !== report.assignmentId)
        .map((id) => this.assignmentRepo.getAssignmentById(id)),
    )

    // Filter out any assignments that no longer exist and wrap them in the MatchedAssignment shape.
    // nameSimilarity is set to 1 here since the original score is not stored on the report.
    const matchedAssignments: MatchedAssignment[] = matchedAssignmentObjects
      .filter((a): a is Assignment => a !== undefined)
      .map((a) => ({ assignment: a, nameSimilarity: 1 }))

    // Fetch all pair results with their student, class, and assignment context via a JOIN query.
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
    // Fetch the most recent cross-class report for this assignment (ordered by generatedAt DESC).
    const report = await this.similarityRepo.getLatestCrossClassReport(assignmentId)

    // Return null if no report exists yet; the caller decides how to handle this.
    if (!report) return null

    // Delegate to getReport for the full data fetch and authorization check.
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
    // Fetch the result row along with its matching code fragment positions.
    const resultData = await this.similarityRepo.getResultWithFragments(resultId)

    if (!resultData) {
      // Extra diagnostic: check if the parent report still exists for any result in this ID range
      logger.warn("Cross-class result not found", { resultId })
      throw new PlagiarismResultNotFoundError(resultId)
    }

    const { result, fragments } = resultData

    // Verify the parent report is a cross-class report owned by this teacher.
    const report = await this.similarityRepo.getReportById(result.reportId)

    if (!report || report.reportType !== "cross-class" || report.teacherId !== teacherId) {
      throw new ForbiddenError("You do not have access to this result")
    }

    // Fetch enriched context (student names, class names, assignment names) for this specific result.
    const crossClassResults = await this.similarityRepo.getCrossClassResultsWithContext(result.reportId)
    const contextRow = crossClassResults.find((r) => r.result.id === resultId)

    // Resolve the storage file paths for both submissions in parallel.
    const [leftFilePath, rightFilePath] = await Promise.all([
      this.resolveSubmissionFilePath(result.submission1Id),
      this.resolveSubmissionFilePath(result.submission2Id),
    ])

    // Download the actual source code content for both submissions from storage.
    const [leftContent, rightContent] = await this.fileService.downloadSubmissionFiles(
      leftFilePath,
      rightFilePath,
    )

    // Return the result DTO, fragment positions, and file content for the side-by-side diff view.
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
    // Confirm the report exists and is a cross-class report before deleting.
    const report = await this.similarityRepo.getReportById(reportId)

    if (!report || report.reportType !== "cross-class") {
      throw new PlagiarismReportNotFoundError(reportId.toString())
    }

    // Only the teacher who created the report can delete it.
    if (report.teacherId !== teacherId) {
      throw new ForbiddenError("You do not have access to this report")
    }

    // Delete cascades to similarity_results and match_fragments via the DB foreign key.
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
    // Build a quick ID → assignment lookup so we can find each assignment's classId without extra queries.
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
        // Download all submission files for this assignment from storage.
        const files = await this.fileService.fetchSubmissionFiles(assignmentId)

        for (const file of files) {
          // Inject the classId into each file's metadata so the detector output can later be
          // classified as cross-class or intra-class without a secondary database lookup.
          const taggedFile = new File(file.path, file.content, {
            ...file.info,
            classId: String(assignment.classId),
          } as CrossClassFileMetadata)

          taggedFiles.push(taggedFile)
        }
      } catch (error) {
        // If fetching files for one assignment fails, skip it and continue with the others.
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
    // Track seen pair keys to avoid counting the same pair twice (e.g. A-B and B-A).
    const seenPairKeys = new Set<string>()

    for (const pair of detectorPairs) {
      const leftClassId = pair.leftFile.info?.classId
      const rightClassId = pair.rightFile.info?.classId

      // Skip pairs where both files are from the same class — those are intra-class comparisons.
      if (!leftClassId || !rightClassId || leftClassId === rightClassId) continue

      const leftStudentId = pair.leftFile.info?.studentId
      const rightStudentId = pair.rightFile.info?.studentId

      // Skip pairs where both files belong to the same student across classes (e.g. a student enrolled in two classes).
      if (leftStudentId && rightStudentId && leftStudentId === rightStudentId) continue

      const leftSubmissionId = this.parseSubmissionId(pair.leftFile.info?.submissionId)
      const rightSubmissionId = this.parseSubmissionId(pair.rightFile.info?.submissionId)

      // Skip invalid pairs where the submission ID could not be parsed from the file metadata.
      if (leftSubmissionId === 0 || rightSubmissionId === 0) {
        logger.warn("Skipping pair with missing submission ID", {
          leftPath: pair.leftFile.path,
          rightPath: pair.rightFile.path,
        })
        continue
      }

      // Normalize the pair so the lower ID is always submission1 — this gives a stable, deduplication-safe key.
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
   * exceeds the pre-filter threshold.
   *
   * Uses embedding caching: each unique submission is embedded once (O(n)),
   * then pairwise cosine similarity is computed locally.
   *
   * @param crossClassPairs - The cross-class pairs to score.
   * @returns A map from pair key to semantic score.
   */
  private async computeSemanticScores(
    crossClassPairs: CrossClassDetectorPair[],
  ): Promise<Map<string, number>> {
    const semanticScores = new Map<string, number>()

    // ── Collect unique submissions from qualified pairs ─────────────────
    const submissionContentMap = new Map<string, string>()
    const qualifiedPairEntries: Array<{
      pairKey: string
      leftSubmissionId: string
      rightSubmissionId: string
    }> = []

    for (const crossClassPair of crossClassPairs) {
      if (crossClassPair.pair.similarity <= SEMANTIC_PRE_FILTER_THRESHOLD) {
        semanticScores.set(crossClassPair.pairKey, 0)
        continue
      }

      const leftSubmissionId = crossClassPair.pair.leftFile.info?.submissionId || "0"
      const rightSubmissionId = crossClassPair.pair.rightFile.info?.submissionId || "0"

      if (leftSubmissionId === "0" || rightSubmissionId === "0") continue

      submissionContentMap.set(leftSubmissionId, crossClassPair.pair.leftFile.content)
      submissionContentMap.set(rightSubmissionId, crossClassPair.pair.rightFile.content)
      qualifiedPairEntries.push({
        pairKey: crossClassPair.pairKey,
        leftSubmissionId,
        rightSubmissionId,
      })
    }

    if (qualifiedPairEntries.length === 0) return semanticScores

    logger.info("Running semantic scoring with pre-filter (embedding cache)", {
      totalPairs: crossClassPairs.length,
      qualifiedPairs: qualifiedPairEntries.length,
      uniqueSubmissions: submissionContentMap.size,
    })

    // ── Embed each unique submission once (O(n) model calls) ───────────
    const embeddingCache = new Map<string, number[]>()
    const submissionIds = [...submissionContentMap.keys()]

    const maxConcurrency = Math.max(1, settings.semanticSimilarityMaxConcurrentRequests ?? 4)
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

    // ── Compute pairwise cosine similarity locally (instant) ───────────
    for (const { pairKey, leftSubmissionId, rightSubmissionId } of qualifiedPairEntries) {
      const leftEmbedding = embeddingCache.get(leftSubmissionId)
      const rightEmbedding = embeddingCache.get(rightSubmissionId)

      if (!leftEmbedding || !rightEmbedding) {
        semanticScores.set(pairKey, 0)
        continue
      }

      const similarity = cosineSimilarity(leftEmbedding, rightEmbedding)
      const clampedScore = Math.min(1, Math.max(0, similarity))

      semanticScores.set(pairKey, Math.round(clampedScore * 10000) / 10000)
    }

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
    // Compute the hybrid score breakdown (structural + semantic → hybrid + flagged flag) for every pair.
    const scoreBreakdowns = crossClassPairs.map((crossClassPair) => {
      const semanticScore = semanticScores.get(crossClassPair.pairKey) ?? 0

      return buildPairSimilarityScoreBreakdown(crossClassPair.pair.similarity, semanticScore)
    })

    // Summarize across all pairs: count flagged pairs, compute average and max hybrid score.
    // These summary values go into the report-level row in the DB.
    const summary = summarizePairSimilarityScores(scoreBreakdowns)

    // Wrap all DB writes in a single transaction so the report, results, and fragments
    // are either all saved or all rolled back — no partial writes.
    const dbReport = await db.transaction(async (transaction) => {
      // Swap the repository's DB connection to the transaction client so all writes share the same TX.
      const repoWithContext = this.similarityRepo.withContext(
        transaction as unknown as TransactionContext,
      )

      // Acquire a PostgreSQL advisory lock scoped to this assignment ID.
      // This prevents two concurrent analyses from inserting duplicate reports for the same assignment.
      await repoWithContext.acquireAssignmentReportLock(sourceAssignmentId)

      // Insert the top-level report row with the summary statistics.
      const createdReport = await repoWithContext.createReport({
        assignmentId: sourceAssignmentId,
        teacherId,
        reportType: "cross-class",
        matchedAssignmentIds,
        totalSubmissions: this.countUniqueSubmissions(crossClassPairs),
        totalComparisons: crossClassPairs.length,
        flaggedPairs: summary.suspiciousPairs,
        averageSimilarity: formatSimilarityScore(summary.averageSimilarity, 4),
        highestSimilarity: formatSimilarityScore(summary.maxSimilarity, 4),
      })

      // Build and batch-insert one result row per cross-class pair.
      const resultsToInsert = this.buildResultInserts(createdReport.id, crossClassPairs, semanticScores)

      if (resultsToInsert.length > 0) {
        const insertedResults = await repoWithContext.createResults(resultsToInsert)

        // Build and batch-insert the matching code fragment positions for each result.
        const fragmentsToInsert = this.buildFragmentInserts(insertedResults, crossClassPairs, detectorReport)

        if (fragmentsToInsert.length > 0) {
          await repoWithContext.createFragments(fragmentsToInsert)
        }
      }

      return createdReport
    })

    logger.info("Cross-class report persisted", {
      reportId: dbReport.id,
      assignmentId: sourceAssignmentId,
    })

    // After the transaction commits, fetch results with their JOIN context (student/class/assignment names)
    // for building the API response.
    const resultsWithContext = await this.similarityRepo.getCrossClassResultsWithContext(dbReport.id)

    logger.info("Cross-class results fetched after persist", {
      reportId: dbReport.id,
      resultIds: resultsWithContext.map((r) => r.result.id),
      resultCount: resultsWithContext.length,
    })

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
    // Map each cross-class pair to a DB row. Scores are formatted to 6 decimal places
    // to match the numeric(7,6) column precision in the database.
    return crossClassPairs.map((crossClassPair) => {
      const structuralScore = crossClassPair.pair.similarity
      const semanticScore = semanticScores.get(crossClassPair.pairKey) ?? 0
      // Compute the weighted hybrid score and determine if the pair should be flagged as suspicious.
      const breakdown = buildPairSimilarityScoreBreakdown(structuralScore, semanticScore)

      return {
        reportId,
        submission1Id: crossClassPair.leftSubmissionId,
        submission2Id: crossClassPair.rightSubmissionId,
        structuralScore: formatSimilarityScore(structuralScore, 6),
        semanticScore: formatSimilarityScore(semanticScore, 6),
        hybridScore: formatSimilarityScore(breakdown.hybridScore, 6),
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
    // Build a pairKey → detector pair map so we can look up the original pair for each inserted result.
    const pairByKey = new Map<string, CrossClassDetectorPair>()

    for (const crossClassPair of crossClassPairs) {
      pairByKey.set(crossClassPair.pairKey, crossClassPair)
    }

    const allFragments: NewMatchFragment[] = []

    for (const insertedResult of insertedResults) {
      // Reconstruct the pair key from the stored submission IDs to find the matching detector pair.
      const pairKey = `${insertedResult.submission1Id}-${insertedResult.submission2Id}`
      const crossClassPair = pairByKey.get(pairKey)

      if (!crossClassPair) continue

      // Get the individual matching code fragments (line/column ranges) for this pair from the detector.
      const detectorFragments = detectorReport.getFragments(crossClassPair.pair)

      // Each fragment stores the exact row/col positions of a matched block in both files.
      // These positions are used by the frontend to highlight matching code in the diff view.
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

  // Returns a zero-result response when there are no matching assignments or no cross-class pairs.
  // reportId: 0 signals to the caller that no report was saved to the database.
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

  // Shapes the saved report and enriched DB rows into the CrossClassAnalysisResponse contract
  // returned to the API controller and ultimately to the frontend.
  private buildAnalysisResponse(
    dbReport: SimilarityReport | { id: number; generatedAt: Date },
    sourceAssignment: Assignment,
    sourceClassName: string,
    matchedAssignments: MatchedAssignment[],
    classMap: Map<number, { id: number; className: string; classCode: string }>,
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
        classCode: classMap.get(m.assignment.classId)?.classCode ?? "",
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
      class1Code: context?.submission1ClassCode ?? "",
      class2Name: context?.submission2ClassName ?? "Unknown",
      class2Code: context?.submission2ClassCode ?? "",
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
  // Staleness Check
  // ===========================================================================

  /**
   * Returns the cached cross-class report if it is still current, otherwise null.
   *
   * A report is considered current when both of the following are true:
   * 1. The set of matched assignments (source + cross-class candidates) has not changed
   *    since the report was generated — i.e., no new assignment with a matching name was
   *    added and no previously matched assignment was removed.
   * 2. No latest submission across any of the involved assignments was added or re-submitted
   *    after the report was generated.
   *
   * If the report is still current, older cross-class reports for the same assignment are
   * pruned and the cached response is returned, skipping the expensive analysis pipeline.
   *
   * @param sourceAssignmentId - The source assignment being analyzed.
   * @param teacherId - The requesting teacher's user ID.
   * @param currentAllAssignmentIds - The full set of assignment IDs (source + current matches).
   * @returns The cached response if current, or null to proceed with fresh analysis.
   */
  private async tryGetCachedCrossClassReport(
    sourceAssignmentId: number,
    teacherId: number,
    currentAllAssignmentIds: number[],
  ): Promise<CrossClassAnalysisResponse | null> {
    // Fetch the most recently generated cross-class report for this source assignment.
    const latestReport = await this.similarityRepo.getLatestCrossClassReport(sourceAssignmentId)

    if (!latestReport) return null

    // Check 1: Matched assignment set equality.
    // Sort both ID arrays before comparing so differences in insertion order don't
    // produce false mismatches.
    const storedAssignmentIds = ((latestReport.matchedAssignmentIds ?? []) as number[])
      .slice()
      .sort((a, b) => a - b)
    const currentAssignmentIds = currentAllAssignmentIds.slice().sort((a, b) => a - b)

    const isAssignmentSetUnchanged =
      storedAssignmentIds.length === currentAssignmentIds.length &&
      storedAssignmentIds.every((id, index) => id === currentAssignmentIds[index])

    if (!isAssignmentSetUnchanged) return null

    // Check 2: Submission freshness across all involved assignments.
    // A single query returns the most recent submission timestamp per assignment.
    const submissionSnapshots =
      await this.submissionRepo.getLatestSubmissionSnapshotsByAssignmentIds(currentAllAssignmentIds)

    const reportGeneratedAtMs = new Date(latestReport.generatedAt).getTime()

    // If any involved assignment has a submission made after the report was generated,
    // the cached report no longer reflects the full picture and must be regenerated.
    const hasNewerSubmissions = submissionSnapshots.some(
      (snapshot) => snapshot.latestSubmittedAt.getTime() > reportGeneratedAtMs,
    )

    if (hasNewerSubmissions) return null

    // The report is still current — prune any older cross-class reports for this assignment,
    // then return the existing report data without running the analysis pipeline.
    await this.similarityRepo.deleteCrossClassReportsExcept(sourceAssignmentId, latestReport.id)

    logger.info("Reusing existing cross-class report (still current)", {
      sourceAssignmentId,
      reportId: latestReport.id,
    })

    return this.getReport(latestReport.id, teacherId)
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  // Converts the assignment's stored programming language string (e.g. "python") to the
  // detector's LanguageName enum. Throws if the language is not supported.
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
