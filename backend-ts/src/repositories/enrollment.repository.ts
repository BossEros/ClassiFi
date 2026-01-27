// db is accessed via BaseRepository.db
import { eq, and } from "drizzle-orm"
import {
  enrollments,
  classes,
  type Enrollment,
  type NewEnrollment,
  type Class,
} from "../models/index.js"
import { BaseRepository } from "./base.repository.js"
import { injectable } from "tsyringe"

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
  async getEnrolledStudentsWithInfo(classId: number): Promise<
    Array<{
      user: {
        id: number
        email: string
        firstName: string
        lastName: string
        avatarUrl: string | null
        role: string
        isActive: boolean
        createdAt: Date | null
      }
      enrolledAt: Date | null
    }>
  > {
    const { users } = await import("../models/index.js")

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
}
