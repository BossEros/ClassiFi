import { db } from "@/shared/database.js"
import { eq, and, sql, isNotNull, inArray } from "drizzle-orm"
import {
  submissions,
  assignments,
  enrollments,
  users,
  classes,
} from "@/models/index.js"
import { injectable } from "tsyringe"

/** Assignment summary for gradebook */
export interface GradebookAssignment {
  id: number
  name: string
  totalScore: number
  deadline: Date | null
}

/** Enrolled student basic info */
export interface EnrolledStudent {
  id: number
  firstName: string
  lastName: string
  email: string
}

/** Submission data for gradebook lookup */
export interface GradebookSubmission {
  id: number
  assignmentId: number
  studentId: number
  grade: number | null
  isGradeOverridden: boolean
  submittedAt: Date | null
}

/** Student grade for a specific assignment */
export interface StudentGrade {
  assignmentId: number
  submissionId: number | null
  grade: number | null
  isOverridden: boolean
  submittedAt: Date | null
}

/** Student with their grades for all assignments */
export interface GradebookStudent {
  id: number
  name: string
  email: string
  grades: StudentGrade[]
}

/** Complete class gradebook data */
export interface ClassGradebook {
  assignments: GradebookAssignment[]
  students: GradebookStudent[]
}

/** Student's enrolled class info */
export interface StudentClassInfo {
  classId: number
  className: string
  teacherFirstName: string
  teacherLastName: string
}

/** Assignment with class reference */
export interface ClassAssignmentInfo {
  id: number
  classId: number
  name: string
  totalScore: number
  deadline: Date | null
}

/** Student submission for grade lookup */
export interface StudentSubmissionInfo {
  assignmentId: number
  grade: number | null
  isGradeOverridden: boolean
  overrideFeedback: string | null
  submittedAt: Date | null
}

/** Assignment grade details for student */
export interface StudentAssignmentGrade {
  assignmentId: number
  assignmentName: string
  totalScore: number
  deadline: Date | null
  grade: number | null
  isOverridden: boolean
  feedback: string | null
  submittedAt: Date | null
}

/** Student grades grouped by class */
export interface StudentClassGrades {
  classId: number
  className: string
  teacherName: string
  assignments: StudentAssignmentGrade[]
}

/** Student rank in class */
export interface StudentRank {
  rank: number
  totalStudents: number
  percentile: number
}

/**
 * Gradebook Repository
 * Provides aggregated grade data for teachers and students.
 */
@injectable()
export class GradebookRepository {
  protected db = db

  /**
   * Get class gradebook: all students with their grades for all assignments.
   * Returns a matrix of students × assignments.
   */
  async getClassGradebook(classId: number): Promise<ClassGradebook> {
    const classAssignments = await this.getClassAssignments(classId)
    const enrolledStudents = await this.getEnrolledStudents(classId)
    const submissionMap = await this.buildSubmissionMap(classAssignments)

    const students = this.buildStudentGrades(
      enrolledStudents,
      classAssignments,
      submissionMap,
    )

    return {
      assignments: classAssignments,
      students,
    }
  }

  /**
   * Get all active assignments for a class.
   */
  private async getClassAssignments(
    classId: number,
  ): Promise<GradebookAssignment[]> {
    return await this.db
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
      .orderBy(assignments.deadline)
  }

  /**
   * Get all enrolled students for a class.
   */
  private async getEnrolledStudents(
    classId: number,
  ): Promise<EnrolledStudent[]> {
    return await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.classId, classId))
      .orderBy(users.lastName, users.firstName)
  }

  /**
   * Build a lookup map of submissions by student and assignment.
   * Key format: `${studentId}-${assignmentId}`
   */
  private async buildSubmissionMap(
    classAssignments: GradebookAssignment[],
  ): Promise<Map<string, GradebookSubmission>> {
    const assignmentIds = classAssignments.map((a) => a.id)

    if (assignmentIds.length === 0) {
      return new Map()
    }

    const latestSubmissions = await this.db
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

    const submissionMap = new Map<string, GradebookSubmission>()
    for (const sub of latestSubmissions) {
      submissionMap.set(`${sub.studentId}-${sub.assignmentId}`, sub)
    }

    return submissionMap
  }

  /**
   * Build student grade records from enrolled students and submissions.
   */
  private buildStudentGrades(
    enrolledStudents: EnrolledStudent[],
    classAssignments: GradebookAssignment[],
    submissionMap: Map<string, GradebookSubmission>,
  ): GradebookStudent[] {
    return enrolledStudents.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email,
      grades: classAssignments.map((assignment) => {
        const sub = submissionMap.get(`${student.id}-${assignment.id}`)
        return {
          assignmentId: assignment.id,
          submissionId: sub?.id ?? null,
          grade: sub?.grade ?? null,
          isOverridden: sub?.isGradeOverridden ?? false,
          submittedAt: sub?.submittedAt ?? null,
        }
      }),
    }))
  }

  /**
   * Get grades for a specific student, optionally filtered by class.
   */
  async getStudentGrades(
    studentId: number,
    classId?: number,
  ): Promise<StudentClassGrades[]> {
    const studentClasses = await this.getStudentClasses(studentId, classId)

    if (studentClasses.length === 0) {
      return []
    }

    const classIds = studentClasses.map((c) => c.classId)
    const allAssignments = await this.getAssignmentsForClasses(classIds)
    const submissionMap = await this.getStudentSubmissionsMap(
      studentId,
      allAssignments,
    )
    const assignmentsByClass = this.groupAssignmentsByClass(allAssignments)

    return this.buildStudentClassGrades(
      studentClasses,
      assignmentsByClass,
      submissionMap,
    )
  }

  /**
   * Get student's enrolled classes with teacher info.
   */
  private async getStudentClasses(
    studentId: number,
    classId?: number,
  ): Promise<StudentClassInfo[]> {
    return await this.db
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
      )
  }

  /**
   * Get all active assignments for multiple classes.
   */
  private async getAssignmentsForClasses(
    classIds: number[],
  ): Promise<ClassAssignmentInfo[]> {
    return await this.db
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
      .orderBy(assignments.deadline)
  }

  /**
   * Get student's submissions as a lookup map.
   */
  private async getStudentSubmissionsMap(
    studentId: number,
    allAssignments: ClassAssignmentInfo[],
  ): Promise<Map<number, StudentSubmissionInfo>> {
    const assignmentIds = allAssignments.map((a) => a.id)

    if (assignmentIds.length === 0) {
      return new Map()
    }

    const studentSubmissions = await this.db
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

    return new Map(studentSubmissions.map((s) => [s.assignmentId, s]))
  }

  /**
   * Group assignments by class ID for efficient lookup.
   */
  private groupAssignmentsByClass(
    allAssignments: ClassAssignmentInfo[],
  ): Map<number, ClassAssignmentInfo[]> {
    const assignmentsByClass = new Map<number, ClassAssignmentInfo[]>()

    for (const assignment of allAssignments) {
      if (!assignmentsByClass.has(assignment.classId)) {
        assignmentsByClass.set(assignment.classId, [])
      }
      assignmentsByClass.get(assignment.classId)!.push(assignment)
    }

    return assignmentsByClass
  }

  /**
   * Build student grade records grouped by class.
   */
  private buildStudentClassGrades(
    studentClasses: StudentClassInfo[],
    assignmentsByClass: Map<number, ClassAssignmentInfo[]>,
    submissionMap: Map<number, StudentSubmissionInfo>,
  ): StudentClassGrades[] {
    return studentClasses.map((cls) => {
      const classAssignments = assignmentsByClass.get(cls.classId) || []
      return {
        classId: cls.classId,
        className: cls.className,
        teacherName: `${cls.teacherFirstName} ${cls.teacherLastName}`,
        assignments: classAssignments.map((a) => {
          const sub = submissionMap.get(a.id)
          return {
            assignmentId: a.id,
            assignmentName: a.name,
            totalScore: a.totalScore,
            deadline: a.deadline,
            grade: sub?.grade ?? null,
            isOverridden: sub?.isGradeOverridden ?? false,
            feedback: sub?.overrideFeedback ?? null,
            submittedAt: sub?.submittedAt ?? null,
          }
        }),
      }
    })
  }

  /**
   * Get student's rank in class based on average grade.
   * Returns percentile (e.g., "Top 15%").
   */
  async getStudentRank(
    studentId: number,
    classId: number,
  ): Promise<StudentRank | null> {
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
      .as("student_avgs")

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
      .as("ranked_students")

    // Now filter for the specific student from the pre-computed rankings
    const rankResult = await this.db
      .select({
        rank: rankedStudents.rank,
        totalStudents: rankedStudents.totalStudents,
      })
      .from(rankedStudents)
      .where(eq(rankedStudents.studentId, studentId))
      .limit(1)

    if (rankResult.length === 0) return null

    const rank = Number(rankResult[0].rank)
    const totalStudents = Number(rankResult[0].totalStudents)

    // Calculate percentile (Top X%)
    const percentile = Math.round((rank / totalStudents) * 100)

    return { rank, totalStudents, percentile }
  }
}
