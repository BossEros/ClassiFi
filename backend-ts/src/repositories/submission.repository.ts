import { db } from "@/shared/database.js";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import {
  submissions,
  users,
  type Submission,
  type NewSubmission,
} from "@/models/index.js";
import { BaseRepository } from "@/repositories/base.repository.js";
import { injectable } from "tsyringe";
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
    super(submissions);
  }

  /** Get a submission by ID */
  async getSubmissionById(
    submissionId: number
  ): Promise<Submission | undefined> {
    return await this.findById(submissionId);
  }

  /** Get all submissions for an assignment */
  async getSubmissionsByAssignment(
    assignmentId: number,
    latestOnly: boolean = true
  ): Promise<Submission[]> {
    if (latestOnly) {
      return await this.db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.assignmentId, assignmentId),
            eq(submissions.isLatest, true)
          )
        )
        .orderBy(desc(submissions.submittedAt));
    }

    return await this.db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt));
  }

  /** Get all submissions by a student */
  async getSubmissionsByStudent(
    studentId: number,
    latestOnly: boolean = true
  ): Promise<Submission[]> {
    if (latestOnly) {
      return await this.db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.studentId, studentId),
            eq(submissions.isLatest, true)
          )
        )
        .orderBy(desc(submissions.submittedAt));
    }

    return await this.db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  /**
   * Get all submissions for a class (via assignments).
   * Used for cleanup during class deletion.
   */
  async getSubmissionsByClass(classId: number): Promise<Submission[]> {
    // We need to import assignments model to join
    const { assignments } = await import("@/models/index.js");

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
        isGradeOverridden: submissions.isGradeOverridden,
        overrideFeedback: submissions.overrideFeedback,
        overriddenAt: submissions.overriddenAt,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(assignments.classId, classId));
  }

  /** Get submission history for a student-assignment pair */
  async getSubmissionHistory(
    assignmentId: number,
    studentId: number
  ): Promise<Submission[]> {
    return await this.db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, studentId)
        )
      )
      .orderBy(submissions.submissionNumber);
  }

  /** Get the latest submission for a student-assignment pair */
  async getLatestSubmission(
    assignmentId: number,
    studentId: number
  ): Promise<Submission | undefined> {
    const results = await this.db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, studentId),
          eq(submissions.isLatest, true)
        )
      )
      .limit(1);

    return results[0];
  }

  /** Get submission count for a student-assignment pair */
  async getSubmissionCount(
    assignmentId: number,
    studentId: number
  ): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(
        and(
          eq(submissions.assignmentId, assignmentId),
          eq(submissions.studentId, studentId)
        )
      );

    return Number(result[0]?.count ?? 0);
  }

  /** Create a new submission */
  async createSubmission(data: {
    assignmentId: number;
    studentId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    submissionNumber: number;
  }): Promise<Submission> {
    // Mark previous submission as not latest
    await this.db
      .update(submissions)
      .set({ isLatest: false })
      .where(
        and(
          eq(submissions.assignmentId, data.assignmentId),
          eq(submissions.studentId, data.studentId)
        )
      );

    // Create new submission
    const results = await this.db
      .insert(submissions)
      .values({
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        submissionNumber: data.submissionNumber,
        isLatest: true,
      })
      .returning();

    return results[0];
  }

  /** Get submissions with student info for an assignment */
  async getSubmissionsWithStudentInfo(
    assignmentId: number,
    latestOnly: boolean = true
  ): Promise<
    Array<{
      submission: Submission;
      studentName: string;
    }>
  > {
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
              eq(submissions.isLatest, true)
            )
          : eq(submissions.assignmentId, assignmentId)
      )
      .orderBy(desc(submissions.submittedAt));

    return await query;
  }

  /** Get a single submission with student name */
  async getSubmissionWithStudent(submissionId: number): Promise<{
    submission: Submission;
    studentName: string;
  } | null> {
    const results = await this.db
      .select({
        submission: submissions,
        studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .where(eq(submissions.id, submissionId))
      .limit(1);

    return results[0] ?? null;
  }

  /** Get multiple submissions with student names by IDs */
  async getBatchSubmissionsWithStudents(submissionIds: number[]): Promise<
    Array<{
      submission: Submission;
      studentName: string;
    }>
  > {
    if (submissionIds.length === 0) return [];

    return await this.db
      .select({
        submission: submissions,
        studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.studentId, users.id))
      .where(inArray(submissions.id, submissionIds));
  }

  /**
   * Get total submission count.
   * Used for admin analytics dashboard.
   */
  async getTotalCount(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(submissions);
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Update the grade for a submission.
   * Called after test execution to store the calculated grade.
   */
  async updateGrade(submissionId: number, grade: number): Promise<void> {
    await this.db
      .update(submissions)
      .set({ grade })
      .where(eq(submissions.id, submissionId));
  }
}
