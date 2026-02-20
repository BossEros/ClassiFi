import { injectable } from "tsyringe"
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm"
import {
  assignments,
  classes,
  enrollments,
  submissions,
  type Assignment,
  type Class,
} from "@/models/index.js"
import { db } from "@/shared/database.js"

/**
 * Pending assignment read model for student dashboard.
 */
export interface StudentPendingAssignmentReadModel {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: Date
  programmingLanguage: Assignment["programmingLanguage"]
}

/**
 * Recent class read model for teacher dashboard.
 */
export interface TeacherRecentClassReadModel extends Class {
  studentCount: number
  assignmentCount: number
}

/**
 * Contract used by dashboard services for query-heavy read models.
 */
export interface DashboardQueryReadRepository {
  getPendingAssignmentsForStudent(
    studentId: number,
    limit: number,
  ): Promise<StudentPendingAssignmentReadModel[]>
  getRecentClassesForTeacher(
    teacherId: number,
    limit: number,
  ): Promise<TeacherRecentClassReadModel[]>
}

/**
 * Read-model repository for dashboard-focused aggregate queries.
 */
@injectable()
export class DashboardQueryRepository implements DashboardQueryReadRepository {
  /**
   * Returns pending assignments for a student in a single query.
   */
  async getPendingAssignmentsForStudent(
    studentId: number,
    limit: number,
  ): Promise<StudentPendingAssignmentReadModel[]> {
    const now = new Date()

    const results = await db
      .select({
        id: assignments.id,
        assignmentName: assignments.assignmentName,
        className: classes.className,
        classId: classes.id,
        deadline: assignments.deadline,
        programmingLanguage: assignments.programmingLanguage,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .innerJoin(assignments, eq(assignments.classId, classes.id))
      .leftJoin(
        submissions,
        and(
          eq(submissions.assignmentId, assignments.id),
          eq(submissions.studentId, studentId),
          eq(submissions.isLatest, true),
        ),
      )
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(classes.isActive, true),
          eq(assignments.isActive, true),
          gt(assignments.deadline, now),
          isNull(submissions.id),
        ),
      )
      .orderBy(assignments.deadline)
      .limit(limit)

    return results
      .filter(
        (
          row,
        ): row is typeof row & {
          deadline: Date
        } => row.deadline !== null,
      )
      .map((row) => ({
        ...row,
        deadline: row.deadline,
      }))
  }

  /**
   * Returns recent classes with student and assignment counts in one query.
   */
  async getRecentClassesForTeacher(
    teacherId: number,
    limit: number,
  ): Promise<TeacherRecentClassReadModel[]> {
    const studentCountSubquery = db
      .select({
        classId: enrollments.classId,
        studentCount: sql<number>`count(*)`.as("student_count"),
      })
      .from(enrollments)
      .groupBy(enrollments.classId)
      .as("student_counts")

    const assignmentCountSubquery = db
      .select({
        classId: assignments.classId,
        assignmentCount: sql<number>`count(*)`.as("assignment_count"),
      })
      .from(assignments)
      .where(eq(assignments.isActive, true))
      .groupBy(assignments.classId)
      .as("assignment_counts")

    const results = await db
      .select({
        id: classes.id,
        teacherId: classes.teacherId,
        className: classes.className,
        classCode: classes.classCode,
        description: classes.description,
        yearLevel: classes.yearLevel,
        semester: classes.semester,
        academicYear: classes.academicYear,
        schedule: classes.schedule,
        createdAt: classes.createdAt,
        isActive: classes.isActive,
        studentCount: sql<number>`COALESCE(${studentCountSubquery.studentCount}, 0)`,
        assignmentCount: sql<number>`COALESCE(${assignmentCountSubquery.assignmentCount}, 0)`,
      })
      .from(classes)
      .leftJoin(
        studentCountSubquery,
        eq(classes.id, studentCountSubquery.classId),
      )
      .leftJoin(
        assignmentCountSubquery,
        eq(classes.id, assignmentCountSubquery.classId),
      )
      .where(and(eq(classes.teacherId, teacherId), eq(classes.isActive, true)))
      .orderBy(desc(classes.createdAt))
      .limit(limit)

    return results.map((row) => ({
      ...row,
      studentCount: Number(row.studentCount),
      assignmentCount: Number(row.assignmentCount),
    }))
  }
}
