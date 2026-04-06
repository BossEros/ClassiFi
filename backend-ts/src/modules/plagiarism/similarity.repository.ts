// db is accessed via BaseRepository.db
import { and, desc, eq, ne, sql } from "drizzle-orm"
import {
  similarityReports,
  type SimilarityReport,
  type NewSimilarityReport,
} from "@/modules/plagiarism/similarity-report.model.js"
import { assignments } from "@/modules/assignments/assignment.model.js"
import { classes } from "@/modules/classes/class.model.js"
import { submissions } from "@/modules/submissions/submission.model.js"
import { users } from "@/modules/users/user.model.js"
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
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("SimilarityRepository")

/** Shape returned by cross-class result queries with contextual join data */
export interface CrossClassResultWithContext {
  result: SimilarityResult
  submission1StudentName: string
  submission1SubmittedAt: Date | null
  submission2StudentName: string
  submission2SubmittedAt: Date | null
  submission1ClassName: string
  submission2ClassName: string
  submission1ClassCode: string
  submission2ClassCode: string
  submission1AssignmentName: string
  submission2AssignmentName: string
}

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

  /** Get all intra-assignment reports for an assignment */
  async getReportsByAssignment(
    assignmentId: number,
  ): Promise<SimilarityReport[]> {
    return await this.db
      .select()
      .from(similarityReports)
      .where(
        and(
          eq(similarityReports.assignmentId, assignmentId),
          eq(similarityReports.reportType, "assignment"),
        ),
      )
      .orderBy(desc(similarityReports.generatedAt))
  }

  /** Get the most recent intra-assignment report for an assignment */
  async getLatestReportByAssignment(
    assignmentId: number,
  ): Promise<SimilarityReport | undefined> {
    const results = await this.db
      .select()
      .from(similarityReports)
      .where(
        and(
          eq(similarityReports.assignmentId, assignmentId),
          eq(similarityReports.reportType, "assignment"),
        ),
      )
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

  /** Delete all intra-assignment reports for an assignment except the specified report. */
  async deleteReportsByAssignmentExcept(
    assignmentId: number,
    keepReportId: number,
  ): Promise<number> {
    const deletedReports = await this.db
      .delete(similarityReports)
      .where(
        and(
          eq(similarityReports.assignmentId, assignmentId),
          eq(similarityReports.reportType, "assignment"),
          ne(similarityReports.id, keepReportId),
        ),
      )
      .returning({ id: similarityReports.id })

    if (deletedReports.length > 0) {
      logger.info("Deleted old intra-class reports", {
        assignmentId,
        keepReportId,
        deletedIds: deletedReports.map((r) => r.id),
      })
    }

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

  // ====================================================================
  // Cross-Class Report Methods
  // ====================================================================

  /** Get the most recent cross-class report for a source assignment */
  async getLatestCrossClassReport(
    assignmentId: number,
  ): Promise<SimilarityReport | undefined> {
    const results = await this.db
      .select()
      .from(similarityReports)
      .where(
        and(
          eq(similarityReports.assignmentId, assignmentId),
          eq(similarityReports.reportType, "cross-class"),
        ),
      )
      .orderBy(desc(similarityReports.generatedAt))
      .limit(1)

    return results[0]
  }

  /** Delete all cross-class reports for an assignment except the specified report. */
  async deleteCrossClassReportsExcept(
    assignmentId: number,
    keepReportId: number,
  ): Promise<number> {
    const deletedReports = await this.db
      .delete(similarityReports)
      .where(
        and(
          eq(similarityReports.assignmentId, assignmentId),
          eq(similarityReports.reportType, "cross-class"),
          ne(similarityReports.id, keepReportId),
        ),
      )
      .returning({ id: similarityReports.id })

    if (deletedReports.length > 0) {
      logger.info("Deleted old cross-class reports", {
        assignmentId,
        keepReportId,
        deletedIds: deletedReports.map((r) => r.id),
      })
    }

    return deletedReports.length
  }

  /**
   * Get cross-class results for a report with student, class, and assignment context.
   * Joins through submissions to derive cross-class context without denormalized columns.
   */
  async getCrossClassResultsWithContext(
    reportId: number,
  ): Promise<CrossClassResultWithContext[]> {
    const sub1 = this.db.$with("sub1").as(
      this.db
        .select({
          submissionId: submissions.id,
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`.as("student1_name"),
          submittedAt: submissions.submittedAt,
          className: classes.className,
          classCode: classes.classCode,
          assignmentName: assignments.assignmentName,
        })
        .from(submissions)
        .innerJoin(users, eq(submissions.studentId, users.id))
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .innerJoin(classes, eq(assignments.classId, classes.id)),
    )

    const sub2 = this.db.$with("sub2").as(
      this.db
        .select({
          submissionId: submissions.id,
          studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`.as("student2_name"),
          submittedAt: submissions.submittedAt,
          className: classes.className,
          classCode: classes.classCode,
          assignmentName: assignments.assignmentName,
        })
        .from(submissions)
        .innerJoin(users, eq(submissions.studentId, users.id))
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .innerJoin(classes, eq(assignments.classId, classes.id)),
    )

    const rows = await this.db
      .with(sub1, sub2)
      .select({
        result: similarityResults,
        submission1StudentName: sub1.studentName,
        submission1SubmittedAt: sub1.submittedAt,
        submission1ClassName: sub1.className,
        submission1ClassCode: sub1.classCode,
        submission1AssignmentName: sub1.assignmentName,
        submission2StudentName: sub2.studentName,
        submission2SubmittedAt: sub2.submittedAt,
        submission2ClassName: sub2.className,
        submission2ClassCode: sub2.classCode,
        submission2AssignmentName: sub2.assignmentName,
      })
      .from(similarityResults)
      .innerJoin(sub1, eq(similarityResults.submission1Id, sub1.submissionId))
      .innerJoin(sub2, eq(similarityResults.submission2Id, sub2.submissionId))
      .where(eq(similarityResults.reportId, reportId))
      .orderBy(desc(similarityResults.hybridScore))

    return rows
  }
}
