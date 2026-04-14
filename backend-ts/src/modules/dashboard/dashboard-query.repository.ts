import { injectable } from "tsyringe"
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm"
import { assignments, type Assignment } from "@/modules/assignments/assignment.model.js"
import { classes, type Class } from "@/modules/classes/class.model.js"
import { enrollments } from "@/modules/enrollments/enrollment.model.js"
import { submissions } from "@/modules/submissions/submission.model.js"
import { db } from "@/shared/database.js"
/**
 * All assignments read model for teacher assignments page.
 */
export interface TeacherAllAssignmentReadModel {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: Date | null
  programmingLanguage: Assignment["programmingLanguage"]
  submissionCount: number
  studentCount: number
}

/**
 * Pending assignment read model for student dashboard.
 */
export interface StudentPendingAssignmentReadModel {
  id: number
  assignmentName: string
  className: string
  classId: number
  deadline: Date | null
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
 * Read-model repository for dashboard-focused aggregate queries.
 */
@injectable()
export class DashboardQueryRepository {
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
          or(
            gt(assignments.deadline, now),
            isNull(assignments.deadline),
            eq(assignments.allowLateSubmissions, true),
          ),
          isNull(submissions.id),
        ),
      )
      .orderBy(sql`${assignments.deadline} ASC NULLS LAST`)
      .limit(limit)

    return results.map((row) => ({
      ...row,
      deadline: row.deadline,
    }))
  }

  /**
   * Returns all assignments for a teacher with submission and student counts.
   */
  async getAllAssignmentsForTeacher(
    teacherId: number,
    limit: number = 200,
  ): Promise<TeacherAllAssignmentReadModel[]> {
    const studentCountSubquery = db
      .select({
        classId: enrollments.classId,
        count: sql<number>`count(*)`.as("student_count"),
      })
      .from(enrollments)
      .groupBy(enrollments.classId)
      .as("student_counts")

    const submissionCountSubquery = db
      .select({
        assignmentId: submissions.assignmentId,
        count: sql<number>`count(*)`.as("submission_count"),
      })
      .from(submissions)
      .where(eq(submissions.isLatest, true))
      .groupBy(submissions.assignmentId)
      .as("submission_counts")

    const results = await db
      .select({
        id: assignments.id,
        assignmentName: assignments.assignmentName,
        className: classes.className,
        classId: classes.id,
        deadline: assignments.deadline,
        programmingLanguage: assignments.programmingLanguage,
        submissionCount: sql<number>`COALESCE(${submissionCountSubquery.count}, 0)`,
        studentCount: sql<number>`COALESCE(${studentCountSubquery.count}, 0)`,
      })
      .from(assignments)
      .innerJoin(classes, eq(assignments.classId, classes.id))
      .leftJoin(studentCountSubquery, eq(classes.id, studentCountSubquery.classId))
      .leftJoin(submissionCountSubquery, eq(assignments.id, submissionCountSubquery.assignmentId))
      .where(
        and(
          eq(classes.teacherId, teacherId),
          eq(classes.isActive, true),
          eq(assignments.isActive, true),
        ),
      )
      .orderBy(sql`${assignments.deadline} ASC NULLS LAST`)
      .limit(limit)

    return results.map((row) => ({
      ...row,
      submissionCount: Number(row.submissionCount),
      studentCount: Number(row.studentCount),
    }))
  }

  /**
   * Returns recent classes with student and assignment counts in one query.
   */
  async getRecentClassesForTeacher(    teacherId: number,
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

