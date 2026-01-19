import { db } from "@/shared/database.js";
import { eq, and, sql, isNotNull, inArray } from "drizzle-orm";
import {
  submissions,
  assignments,
  enrollments,
  users,
  classes,
} from "@/models/index.js";
import { injectable } from "tsyringe";

/**
 * Gradebook Repository
 * Provides aggregated grade data for teachers and students.
 */
@injectable()
export class GradebookRepository {
  protected db = db;

  /**
   * Get class gradebook: all students with their grades for all assignments.
   * Returns a matrix of students × assignments.
   */
  async getClassGradebook(classId: number): Promise<{
    assignments: Array<{
      id: number;
      name: string;
      totalScore: number;
      deadline: Date;
    }>;
    students: Array<{
      id: number;
      name: string;
      email: string;
      grades: Array<{
        assignmentId: number;
        submissionId: number | null;
        grade: number | null;
        isOverridden: boolean;
        submittedAt: Date | null;
      }>;
    }>;
  }> {
    // Get all assignments for the class
    const classAssignments = await this.db
      .select({
        id: assignments.id,
        name: assignments.assignmentName,
        totalScore: assignments.totalScore,
        deadline: assignments.deadline,
      })
      .from(assignments)
      .where(
        and(eq(assignments.classId, classId), eq(assignments.isActive, true)),
      )
      .orderBy(assignments.deadline);

    // Get all enrolled students
    const enrolledStudents = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.classId, classId))
      .orderBy(users.lastName, users.firstName);

    // Get all latest submissions for this class
    const assignmentIds = classAssignments.map((a) => a.id);
    const latestSubmissions =
      assignmentIds.length > 0
        ? await this.db
            .select({
              id: submissions.id,
              assignmentId: submissions.assignmentId,
              studentId: submissions.studentId,
              grade: submissions.grade,
              isGradeOverridden: submissions.isGradeOverridden,
              submittedAt: submissions.submittedAt,
            })
            .from(submissions)
            .where(
              and(
                eq(submissions.isLatest, true),
                inArray(submissions.assignmentId, assignmentIds),
              ),
            )
        : [];

    // Build submission lookup map: `${studentId}-${assignmentId}` -> submission
    const submissionMap = new Map<string, (typeof latestSubmissions)[number]>();
    for (const sub of latestSubmissions) {
      submissionMap.set(`${sub.studentId}-${sub.assignmentId}`, sub);
    }

    // Build student grades
    const students = enrolledStudents.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email,
      grades: classAssignments.map((assignment) => {
        const sub = submissionMap.get(`${student.id}-${assignment.id}`);
        return {
          assignmentId: assignment.id,
          submissionId: sub?.id ?? null,
          grade: sub?.grade ?? null,
          isOverridden: sub?.isGradeOverridden ?? false,
          submittedAt: sub?.submittedAt ?? null,
        };
      }),
    }));

    return {
      assignments: classAssignments,
      students,
    };
  }

  /**
   * Get grades for a specific student, optionally filtered by class.
   */
  async getStudentGrades(
    studentId: number,
    classId?: number,
  ): Promise<
    Array<{
      classId: number;
      className: string;
      teacherName: string;
      assignments: Array<{
        assignmentId: number;
        assignmentName: string;
        totalScore: number;
        deadline: Date;
        grade: number | null;
        isOverridden: boolean;
        feedback: string | null;
        submittedAt: Date | null;
      }>;
    }>
  > {
    // Get student's enrolled classes
    const studentClasses = await this.db
      .select({
        classId: classes.id,
        className: classes.className,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .innerJoin(users, eq(classes.teacherId, users.id))
      .where(
        classId
          ? and(eq(enrollments.studentId, studentId), eq(classes.id, classId))
          : eq(enrollments.studentId, studentId),
      );

    if (studentClasses.length === 0) {
      return [];
    }

    const classIds = studentClasses.map((c) => c.classId);

    // Get all assignments for these classes
    const allAssignments = await this.db
      .select({
        id: assignments.id,
        classId: assignments.classId,
        name: assignments.assignmentName,
        totalScore: assignments.totalScore,
        deadline: assignments.deadline,
      })
      .from(assignments)
      .where(
        and(
          inArray(assignments.classId, classIds),
          eq(assignments.isActive, true),
        ),
      )
      .orderBy(assignments.deadline);

    const assignmentIds = allAssignments.map((a) => a.id);

    // Get student's submissions for these assignments
    const studentSubmissions =
      assignmentIds.length > 0
        ? await this.db
            .select({
              assignmentId: submissions.assignmentId,
              grade: submissions.grade,
              isGradeOverridden: submissions.isGradeOverridden,
              overrideFeedback: submissions.overrideFeedback,
              submittedAt: submissions.submittedAt,
            })
            .from(submissions)
            .where(
              and(
                eq(submissions.studentId, studentId),
                eq(submissions.isLatest, true),
                inArray(submissions.assignmentId, assignmentIds),
              ),
            )
        : [];

    const submissionMap = new Map(
      studentSubmissions.map((s) => [s.assignmentId, s]),
    );

    // Group assignments by classId for efficient lookup
    const assignmentsByClass = new Map<number, typeof allAssignments>();
    for (const assignment of allAssignments) {
      if (!assignmentsByClass.has(assignment.classId)) {
        assignmentsByClass.set(assignment.classId, []);
      }
      assignmentsByClass.get(assignment.classId)!.push(assignment);
    }

    return studentClasses.map((cls) => {
      const classAssignments = assignmentsByClass.get(cls.classId) || [];
      return {
        classId: cls.classId,
        className: cls.className,
        teacherName: `${cls.teacherFirstName} ${cls.teacherLastName}`,
        assignments: classAssignments.map((a) => {
          const sub = submissionMap.get(a.id);
          return {
            assignmentId: a.id,
            assignmentName: a.name,
            totalScore: a.totalScore,
            deadline: a.deadline,
            grade: sub?.grade ?? null,
            isOverridden: sub?.isGradeOverridden ?? false,
            feedback: sub?.overrideFeedback ?? null,
            submittedAt: sub?.submittedAt ?? null,
          };
        }),
      };
    });
  }

  /**
   * Get class statistics for gradebook.
   */
  async getClassStatistics(classId: number): Promise<{
    classAverage: number | null;
    submissionRate: number;
    totalStudents: number;
    totalAssignments: number;
  }> {
    // Count enrolled students
    const studentCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.classId, classId));
    const totalStudents = Number(studentCountResult[0]?.count ?? 0);

    // Count active assignments
    const assignmentCountResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(assignments)
      .where(
        and(eq(assignments.classId, classId), eq(assignments.isActive, true)),
      );
    const totalAssignments = Number(assignmentCountResult[0]?.count ?? 0);

    if (totalStudents === 0 || totalAssignments === 0) {
      return {
        classAverage: null,
        submissionRate: 0,
        totalStudents,
        totalAssignments,
      };
    }

    // Get assignment IDs for this class
    const classAssignments = await this.db
      .select({ id: assignments.id, totalScore: assignments.totalScore })
      .from(assignments)
      .where(
        and(eq(assignments.classId, classId), eq(assignments.isActive, true)),
      );

    const assignmentIds = classAssignments.map((a) => a.id);

    // Count submissions and get average
    const statsResult = await this.db
      .select({
        submissionCount: sql<number>`count(DISTINCT ${submissions.studentId} || '-' || ${submissions.assignmentId})`,
        avgGrade: sql<number>`avg(${submissions.grade})`,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.isLatest, true),
          isNotNull(submissions.grade),
          inArray(submissions.assignmentId, assignmentIds),
        ),
      );

    const submissionCount = Number(statsResult[0]?.submissionCount ?? 0);
    const avgGrade = statsResult[0]?.avgGrade;

    const expectedSubmissions = totalStudents * totalAssignments;
    const submissionRate =
      expectedSubmissions > 0 ? submissionCount / expectedSubmissions : 0;

    return {
      classAverage: avgGrade !== null ? Math.round(avgGrade * 100) / 100 : null,
      submissionRate: Math.round(submissionRate * 100),
      totalStudents,
      totalAssignments,
    };
  }

  /**
   * Get student's rank in class based on average grade.
   * Returns percentile (e.g., "Top 15%").
   */
  async getStudentRank(
    studentId: number,
    classId: number,
  ): Promise<{
    rank: number;
    totalStudents: number;
    percentile: number;
  } | null> {
    // Subquery to calculate average grade per student in this class
    const studentAverages = this.db
      .select({
        studentId: submissions.studentId,
        avgGrade: sql<number>`avg(${submissions.grade})`.as("avg_grade"),
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(
        and(
          eq(assignments.classId, classId),
          eq(submissions.isLatest, true),
          isNotNull(submissions.grade),
        ),
      )
      .groupBy(submissions.studentId)
      .as("student_avgs");

    // First compute ranks for ALL students, then filter for the target student
    const rankedStudents = this.db
      .select({
        studentId: studentAverages.studentId,
        avgGrade: studentAverages.avgGrade,
        rank: sql<number>`RANK() OVER (ORDER BY ${studentAverages.avgGrade} DESC)`.as(
          "rank",
        ),
        totalStudents: sql<number>`COUNT(*) OVER ()`.as("total_students"),
      })
      .from(studentAverages)
      .as("ranked_students");

    // Now filter for the specific student from the pre-computed rankings
    const rankResult = await this.db
      .select({
        rank: rankedStudents.rank,
        totalStudents: rankedStudents.totalStudents,
      })
      .from(rankedStudents)
      .where(eq(rankedStudents.studentId, studentId))
      .limit(1);

    if (rankResult.length === 0) return null;

    const rank = Number(rankResult[0].rank);
    const totalStudents = Number(rankResult[0].totalStudents);

    // Calculate percentile (Top X%)
    const percentile = Math.round((rank / totalStudents) * 100);

    return { rank, totalStudents, percentile };
  }
}
