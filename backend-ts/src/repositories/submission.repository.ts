import { eq, and, desc, sql, inArray } from "drizzle-orm"
import {
  submissions,
  users,
  type Submission,
  type NewSubmission,
} from "@/models/index.js"
import { BaseRepository } from "@/repositories/base.repository.js"
import { injectable } from "tsyringe"

/** Submission with student information */
export interface SubmissionWithStudent {
  submission: Submission
  studentName: string
}

/**
 * Repository for submission-related database operations.
 */
@injectable()
export class SubmissionRepository extends BaseRepository<
  typeof submissions,
  Submission,
  NewSubmission
> {
  constructor() {
    super(submissions)
  }

  /** Get a submission by ID */
  async getSubmissionById(
    submissionId: number,
  ): Promise<Submission | undefined> {
    return await this.findById(submissionId)
  }

  /** Get all submissions for an assignment */
  async getSubmissionsByAssignment(
    assignmentId: number,
    latestOnly: boolean = true,
  ): Promise<Submission[]> {
    if (latestOnly) {
      return await this.db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignmentId, assignmentId),
            eq(submissions.isLatest, true),
          ),
        )
        .orderBy(desc(submissions.submittedAt))
    }

    return await this.db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt))
  }

  /** Get all submissions by a student */
  async getSubmissionsByStudent(
    studentId: number,
    latestOnly: boolean = true,
  ): Promise<Submission[]> {
    if (latestOnly) {
      return await this.db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.studentId, studentId),
            eq(submissions.isLatest, true),
          ),
        )
        .orderBy(desc(submissions.submittedAt))
    }

    return await this.db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt))
  }

  /**
   * Get all submissions for a class (via assignments).
   * Used for cleanup during class deletion.
   */
  async getSubmissionsByClass(classId: number): Promise<Submission[]> {
    // We need to import assignments model to join
    const { assignments } = await import("@/models/index.js")

    return await this.db
      .select({
        id: submissions.id,
        assignmentId: submissions.assignmentId,
        studentId: submissions.studentId,
        fileName: submissions.fileName,
        filePath: submissions.filePath,
        fileSize: submissions.fileSize,
        submissionNumber: submissions.submissionNumber,
        submittedAt: submissions.submittedAt,
        isLatest: submissions.isLatest,
        grade: submissions.grade,
        isLate: submissions.isLate,
        penaltyApplied: submissions.penaltyApplied,
        isGradeOverridden: submissions.isGradeOverridden,
        overrideFeedback: submissions.overrideFeedback,
        overriddenAt: submissions.overriddenAt,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(assignments.classId, classId))
  }

  /** Get submission history for a student-assignment pair */
  async getSubmissionHistory(
    assignmentId: number,
    studentId: number,
  ): Promise<Submission[]> {
    return await this.db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, studentId),
        ),
      )
      .orderBy(submissions.submissionNumber)
  }

  /** Get the latest submission for a student-assignment pair */
  async getLatestSubmission(
    assignmentId: number,
    studentId: number,
  ): Promise<Submission | undefined> {
    const results = await this.db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, studentId),
          eq(submissions.isLatest, true),
        ),
      )
      .limit(1)

    return results[0]
  }

  /** Get submission count for a student-assignment pair */
  async getSubmissionCount(
    assignmentId: number,
    studentId: number,
  ): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, studentId),
        ),
      )

    return Number(result[0]?.count ?? 0)
  }

  /** Create a new submission */
  async createSubmission(data: {
    assignmentId: number
    studentId: number
    fileName: string
    filePath: string
    fileSize: number
    submissionNumber: number
    isLate: boolean
    penaltyApplied: number
  }): Promise<Submission> {
    return await this.db.transaction(async (tx) => {
      // Lock relevant rows to serialize concurrent submissions
      await tx
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignmentId, data.assignmentId),
            eq(submissions.studentId, data.studentId),
          ),
        )
        .for("update")

      // Mark previous submission as not latest
      await tx
        .update(submissions)
        .set({ isLatest: false })
        .where(
          and(
            eq(submissions.assignmentId, data.assignmentId),
            eq(submissions.studentId, data.studentId),
          ),
        )

      // Create new submission
      const results = await tx
        .insert(submissions)
        .values({
          assignmentId: data.assignmentId,
          studentId: data.studentId,
          fileName: data.fileName,
          filePath: data.filePath,
          fileSize: data.fileSize,
          submissionNumber: data.submissionNumber,
          isLatest: true,
          isLate: data.isLate,
          penaltyApplied: data.penaltyApplied,
        })
        .returning()

      // Defensive check to ensure insert succeeded
      if (!results || results.length === 0) {
        throw new Error(
          "Failed to create submission: insert returned no results",
        )
      }

      return results[0]
    })
  }

  /** Get submissions with student info for an assignment */
  async getSubmissionsWithStudentInfo(
    assignmentId: number,
    latestOnly: boolean = true,
  ): Promise<SubmissionWithStudent[]> {
    const query = this.db
      .select({
        submission: submissions,
        studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .where(
        latestOnly
          ? and(
            eq(submissions.assignmentId, assignmentId),
            eq(submissions.isLatest, true),
          )
          : eq(submissions.assignmentId, assignmentId),
      )
      .orderBy(desc(submissions.submittedAt))

    return await query
  }

  /** Get a single submission with student name */
  async getSubmissionWithStudent(
    submissionId: number,
  ): Promise<SubmissionWithStudent | null> {
    const results = await this.db
      .select({
        submission: submissions,
        studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .where(eq(submissions.id, submissionId))
      .limit(1)

    return results[0] ?? null
  }

  /** Get multiple submissions with student names by IDs */
  async getBatchSubmissionsWithStudents(
    submissionIds: number[],
  ): Promise<SubmissionWithStudent[]> {
    if (submissionIds.length === 0) return []

    return await this.db
      .select({
        submission: submissions,
        studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .where(inArray(submissions.id, submissionIds))
  }

  /**
   * Get total submission count.
   * Used for admin analytics dashboard.
   */
  async getTotalCount(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
    return Number(result[0]?.count ?? 0)
  }

  /**
   * Update the grade for a submission.
   * Called after test execution to store the calculated grade.
   */
  async updateGrade(submissionId: number, grade: number): Promise<void> {
    await this.db
      .update(submissions)
      .set({ grade })
      .where(eq(submissions.id, submissionId))
  }

  /**
   * Set a grade override for a submission.
   * Updates the grade, marks it as overridden, and optionally adds feedback.
   */
  async setGradeOverride(
    submissionId: number,
    grade: number,
    feedback: string | null,
  ): Promise<void> {
    await this.db
      .update(submissions)
      .set({
        grade,
        isGradeOverridden: true,
        overrideFeedback: feedback,
        overriddenAt: new Date(),
      })
      .where(eq(submissions.id, submissionId))
  }

  /**
   * Remove a grade override from a submission.
   * Clears the override flag and feedback. The grade should be recalculated separately.
   */
  async removeGradeOverride(submissionId: number): Promise<void> {
    await this.db
      .update(submissions)
      .set({
        isGradeOverridden: false,
        overrideFeedback: null,
        overriddenAt: null,
      })
      .where(eq(submissions.id, submissionId))
  }
}
