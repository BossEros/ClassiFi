// db is accessed via BaseRepository.db
import {
  eq,
  and,
  desc,
  count,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm"
import {
  enrollments,
  classes,
  users,
  type Enrollment,
  type NewEnrollment,
  type Class,
  type User,
} from "@/models/index.js"
import { BaseRepository } from "@/repositories/base.repository.js"
import { injectable } from "tsyringe"
import { alias } from "drizzle-orm/pg-core"
import type {
  EnrollmentFilterOptions,
  PaginatedResult,
} from "@/modules/admin/admin.types.js"

/** Enrolled student with user information */
export interface EnrolledStudentInfo {
  user: User
  enrolledAt: Date | null
}

export interface AdminEnrollmentListItemRow {
  id: number
  studentId: number
  studentFirstName: string
  studentLastName: string
  studentEmail: string
  studentAvatarUrl: string | null
  studentIsActive: boolean
  classId: number
  className: string
  classCode: string
  classIsActive: boolean
  teacherId: number
  teacherName: string
  teacherAvatarUrl: string | null
  semester: number
  academicYear: string
  enrolledAt: Date
}

/**
 * Repository for enrollment-related database operations.
 */
@injectable()
export class EnrollmentRepository extends BaseRepository<
  typeof enrollments,
  Enrollment,
  NewEnrollment
> {
  constructor() {
    super(enrollments)
  }

  /** Enroll a student in a class */
  async enrollStudent(studentId: number, classId: number): Promise<Enrollment> {
    const results = await this.db
      .insert(enrollments)
      .values({
        studentId,
        classId,
      })
      .returning()

    if (!results[0]) {
      throw new Error(
        `Failed to enroll student ${studentId} in class ${classId}`,
      )
    }

    return results[0]
  }

  /** Unenroll a student from a class */
  async unenrollStudent(studentId: number, classId: number): Promise<boolean> {
    const results = await this.db
      .delete(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.classId, classId),
        ),
      )
      .returning()

    return results.length > 0
  }

  /** Check if a student is enrolled in a class */
  async isEnrolled(studentId: number, classId: number): Promise<boolean> {
    const results = await this.db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.classId, classId),
        ),
      )
      .limit(1)

    return results.length > 0
  }

  /** Get all enrollments for a student */
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
  }

  /** Get all enrollments for a class */
  async getEnrollmentsByClass(classId: number): Promise<Enrollment[]> {
    return await this.db
      .select()
      .from(enrollments)
      .where(eq(enrollments.classId, classId))
  }

  /** Get enrollment with class details */
  async getEnrollmentWithClass(enrollmentId: number): Promise<
    | {
        enrollment: Enrollment
        class: Class
      }
    | undefined
  > {
    const results = await this.db
      .select({
        enrollment: enrollments,
        class: classes,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .where(eq(enrollments.id, enrollmentId))
      .limit(1)

    return results[0]
  }

  /**
   * Get enrolled students with user info for a class.
   * Used for admin enrollment management.
   */
  async getEnrolledStudentsWithInfo(
    classId: number,
  ): Promise<EnrolledStudentInfo[]> {
    return await this.db
      .select({
        user: users,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(eq(enrollments.classId, classId))
      .orderBy(users.firstName)
  }

  /**
   * Get all enrollments with pagination and admin-facing filters.
   */
  async getAllEnrollmentsFiltered(
    options: EnrollmentFilterOptions,
  ): Promise<PaginatedResult<AdminEnrollmentListItemRow>> {
    const {
      page,
      limit,
      search,
      classId,
      teacherId,
      studentId,
      status,
      semester,
      academicYear,
    } = options
    const offset = (page - 1) * limit
    const teacherUsers = alias(users, "teacher_users")
    const conditions: SQL[] = []

    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(classes.className, `%${search}%`),
          ilike(classes.classCode, `%${search}%`),
          ilike(teacherUsers.firstName, `%${search}%`),
          ilike(teacherUsers.lastName, `%${search}%`),
        )!,
      )
    }

    if (classId !== undefined) {
      conditions.push(eq(classes.id, classId))
    }

    if (teacherId !== undefined) {
      conditions.push(eq(classes.teacherId, teacherId))
    }

    if (studentId !== undefined) {
      conditions.push(eq(users.id, studentId))
    }

    if (status === "active") {
      conditions.push(eq(classes.isActive, true))
    } else if (status === "archived") {
      conditions.push(eq(classes.isActive, false))
    }
    if (semester !== undefined) {
      conditions.push(eq(classes.semester, semester))
    }

    if (academicYear) {
      conditions.push(eq(classes.academicYear, academicYear))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const countResult = await this.db
      .select({ count: count() })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .innerJoin(teacherUsers, eq(classes.teacherId, teacherUsers.id))
      .where(whereClause)

    const total = Number(countResult[0]?.count ?? 0)

    const data = await this.db
      .select({
        id: enrollments.id,
        studentId: users.id,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentEmail: users.email,
        studentAvatarUrl: users.avatarUrl,
        studentIsActive: users.isActive,
        classId: classes.id,
        className: classes.className,
        classCode: classes.classCode,
        classIsActive: classes.isActive,
        teacherId: teacherUsers.id,
        teacherName: sql<string>`CONCAT(${teacherUsers.firstName}, ' ', ${teacherUsers.lastName})`,
        teacherAvatarUrl: teacherUsers.avatarUrl,
        semester: classes.semester,
        academicYear: classes.academicYear,
        enrolledAt: enrollments.enrolledAt,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .innerJoin(teacherUsers, eq(classes.teacherId, teacherUsers.id))
      .where(whereClause)
      .orderBy(desc(enrollments.enrolledAt), desc(enrollments.id))
      .limit(limit)
      .offset(offset)

    return {
      data: data.map((row) => ({
        ...row,
        studentAvatarUrl: row.studentAvatarUrl ?? null,
        teacherAvatarUrl: row.teacherAvatarUrl ?? null,
        teacherName: row.teacherName.trim(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}



