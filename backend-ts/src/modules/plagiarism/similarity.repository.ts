// db is accessed via BaseRepository.db
import { and, desc, eq, ne, sql } from "drizzle-orm"
import {
  similarityReports,
  type SimilarityReport,
  type NewSimilarityReport,
} from "@/modules/plagiarism/similarity-report.model.js"
import { assignments } from "@/modules/assignments/assignment.model.js"
import { classes } from "@/modules/classes/class.model.js"
import {
  similarityResults,
  type SimilarityResult,
  type NewSimilarityResult,
} from "@/modules/plagiarism/similarity-result.model.js"
import {
  matchFragments,
  type MatchFragment,
  type NewMatchFragment,
} from "@/modules/plagiarism/match-fragment.model.js"
import { BaseRepository } from "@/repositories/base.repository.js"
import { injectable } from "tsyringe"

/**
 * Repository for similarity report and result operations.
 */
@injectable()
export class SimilarityRepository extends BaseRepository<
  typeof similarityReports,
  SimilarityReport,
  NewSimilarityReport
> {
  private static readonly REPORT_LOCK_NAMESPACE = 44121

  constructor() {
    super(similarityReports)
  }

  /**
   * Acquire a transaction-scoped advisory lock for assignment report writes.
   *
   * This prevents concurrent analysis transactions (for the same assignment)
   * from inserting multiple reports before old-report pruning runs.
   */
  async acquireAssignmentReportLock(assignmentId: number): Promise<void> {
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(${SimilarityRepository.REPORT_LOCK_NAMESPACE}, ${assignmentId})`,
    )
  }

  /** Create a new similarity report */
  async createReport(data: NewSimilarityReport): Promise<SimilarityReport> {
    return this.create(data)
  }

  /** Get report by ID with results */
  async getReportById(reportId: number): Promise<SimilarityReport | undefined> {
    return this.findById(reportId)
  }

  /** Get all reports for an assignment */
  async getReportsByAssignment(
    assignmentId: number,
  ): Promise<SimilarityReport[]> {
    return await this.db
      .select()
      .from(similarityReports)
      .where(eq(similarityReports.assignmentId, assignmentId))
      .orderBy(desc(similarityReports.generatedAt))
  }

  /** Get the most recent report for an assignment */
  async getLatestReportByAssignment(
    assignmentId: number,
  ): Promise<SimilarityReport | undefined> {
    const results = await this.db
      .select()
      .from(similarityReports)
      .where(eq(similarityReports.assignmentId, assignmentId))
      .orderBy(desc(similarityReports.generatedAt))
      .limit(1)

    return results[0]
  }

  /**
   * Resolve the teacher assigned to an assignment's class.
   * Returns undefined when assignment or class cannot be found.
   */
  async getTeacherIdByAssignment(assignmentId: number): Promise<number | undefined> {
    const results = await this.db
      .select({ teacherId: classes.teacherId })
      .from(assignments)
      .innerJoin(classes, eq(assignments.classId, classes.id))
      .where(eq(assignments.id, assignmentId))
      .limit(1)

    return results[0]?.teacherId
  }

  /** Delete all reports for an assignment except the specified report. */
  async deleteReportsByAssignmentExcept(
    assignmentId: number,
    keepReportId: number,
  ): Promise<number> {
    const deletedReports = await this.db
      .delete(similarityReports)
      .where(
        and(
          eq(similarityReports.assignmentId, assignmentId),
          ne(similarityReports.id, keepReportId),
        ),
      )
      .returning({ id: similarityReports.id })

    return deletedReports.length
  }

  /** Create similarity results (batch insert) */
  async createResults(
    results: NewSimilarityResult[],
  ): Promise<SimilarityResult[]> {
    if (results.length === 0) return []

    return await this.db.insert(similarityResults).values(results).returning()
  }

  /** Get results for a report */
  async getResultsByReport(reportId: number): Promise<SimilarityResult[]> {
    return await this.db
      .select()
      .from(similarityResults)
      .where(eq(similarityResults.reportId, reportId))
      .orderBy(desc(similarityResults.hybridScore))
  }
  /** Create match fragments (batch insert) */
  async createFragments(
    fragments: NewMatchFragment[],
  ): Promise<MatchFragment[]> {
    if (fragments.length === 0) return []

    return await this.db.insert(matchFragments).values(fragments).returning()
  }

  /** Get a specific result by ID */
  async getResultById(resultId: number): Promise<SimilarityResult | undefined> {
    const results = await this.db
      .select()
      .from(similarityResults)
      .where(eq(similarityResults.id, resultId))
      .limit(1)

    return results[0]
  }

  /** Delete a report (cascades to results) */
  async deleteReport(reportId: number): Promise<boolean> {
    return this.delete(reportId)
  }

  /** Get fragments for a specific result */
  async getFragmentsByResult(resultId: number): Promise<MatchFragment[]> {
    return await this.db
      .select()
      .from(matchFragments)
      .where(eq(matchFragments.similarityResultId, resultId))
  }

  /** Get result with its fragments */
  async getResultWithFragments(resultId: number): Promise<{
    result: SimilarityResult
    fragments: MatchFragment[]
  } | null> {
    const result = await this.getResultById(resultId)
    if (!result) return null

    const fragments = await this.getFragmentsByResult(resultId)
    return { result, fragments }
  }

  /**
   * Get total report count.
   * Used for admin analytics dashboard.
   */
  async getReportCount(): Promise<number> {
    const { count } = await import("drizzle-orm")
    const result = await this.db
      .select({ count: count() })
      .from(similarityReports)
    return Number(result[0]?.count ?? 0)
  }
}
