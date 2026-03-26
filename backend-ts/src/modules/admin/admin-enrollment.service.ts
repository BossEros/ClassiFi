import { inject, injectable } from "tsyringe"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { UserRepository } from "@/modules/users/user.repository.js"
import { EnrollmentRepository } from "@/modules/enrollments/enrollment.repository.js"
import { toUserDTO, type UserDTO } from "@/modules/users/user.mapper.js"
import {
  UserNotFoundError,
  ClassNotFoundError,
  InvalidRoleError,
  AlreadyEnrolledError,
  BadRequestError,
  ClassInactiveError,
  StudentNotInClassError,
} from "@/shared/errors.js"
import type {
  EnrollmentFilterOptions,
  PaginatedResult,
  AdminEnrollmentListItem,
  TransferStudentData,
} from "@/modules/admin/admin.types.js"
import { withTransaction } from "@/shared/transaction.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Admin service for class enrollment management.
 * Follows SRP - handles only admin enrollment-related concerns.
 */
@injectable()
export class AdminEnrollmentService {
  constructor(
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.repositories.enrollment)
    private enrollmentRepo: EnrollmentRepository,
  ) {}

  /**
   * Get all students enrolled in a class.
   * Delegates to EnrollmentRepository.
   */
  async getClassStudents(
    classId: number,
  ): Promise<Array<UserDTO & { enrolledAt: string }>> {
    await this.getValidatedClass(classId)

    const enrolledStudents =
      await this.enrollmentRepo.getEnrolledStudentsWithInfo(classId)

    return enrolledStudents.map((row) => ({
      ...toUserDTO(row.user),
      enrolledAt: row.enrolledAt?.toISOString() ?? new Date().toISOString(),
    }))
  }

  /**
   * List enrollments across classes with admin filters.
   */
  async getAllEnrollments(
    options: EnrollmentFilterOptions,
  ): Promise<PaginatedResult<AdminEnrollmentListItem>> {
    const result = await this.enrollmentRepo.getAllEnrollmentsFiltered(options)

    return {
      ...result,
      data: result.data.map((row) => ({
        ...row,
        teacherName: row.teacherName.trim(),
        enrolledAt: row.enrolledAt.toISOString(),
      })),
    }
  }

  /**
   * Add a student to a class (admin-initiated enrollment).
   */
  async addStudentToClass(classId: number, studentId: number): Promise<void> {
    await this.getValidatedClass(classId, { requireActive: true })
    await this.getValidatedStudent(studentId, { requireActive: true })
    await this.assertStudentNotEnrolled(studentId, classId)

    await this.enrollmentRepo.enrollStudent(studentId, classId)
  }

  /**
   * Remove a student from a class (admin-initiated unenrollment).
   */
  async removeStudentFromClass(
    classId: number,
    studentId: number,
  ): Promise<void> {
    await this.getValidatedClass(classId)
    await this.assertStudentIsEnrolled(studentId, classId)

    await this.enrollmentRepo.unenrollStudent(studentId, classId)
  }

  /**
   * Transfer a student from one class to another.
   */
  async transferStudent(data: TransferStudentData): Promise<void> {
    const { studentId, fromClassId, toClassId } = data

    if (fromClassId === toClassId) {
      throw new BadRequestError(
        "Source and destination classes must be different",
      )
    }

    await Promise.all([
      this.getValidatedClass(fromClassId),
      this.getValidatedClass(toClassId, { requireActive: true }),
      this.getValidatedStudent(studentId, { requireActive: true }),
      this.assertStudentIsEnrolled(studentId, fromClassId),
      this.assertStudentNotEnrolled(studentId, toClassId),
    ])

    await withTransaction(async (transactionContext) => {
      const enrollmentRepositoryWithContext = this.enrollmentRepo.withContext(
        transactionContext,
      )

      const wasRemoved =
        await enrollmentRepositoryWithContext.unenrollStudent(
          studentId,
          fromClassId,
        )

      if (!wasRemoved) {
        throw new StudentNotInClassError()
      }

      await enrollmentRepositoryWithContext.enrollStudent(studentId, toClassId)
    })
  }

  /**
   * Validate that a class exists and optionally remains active for new enrollments.
   */
  private async getValidatedClass(
    classId: number,
    options: { requireActive?: boolean } = {},
  ) {
    const existingClass = await this.classRepo.getClassById(classId)

    if (!existingClass) {
      throw new ClassNotFoundError(classId)
    }

    if (options.requireActive && !existingClass.isActive) {
      throw new ClassInactiveError()
    }

    return existingClass
  }

  /**
   * Validate that a student exists, has the student role, and can be enrolled when required.
   */
  private async getValidatedStudent(
    studentId: number,
    options: { requireActive?: boolean } = {},
  ) {
    const student = await this.userRepo.getUserById(studentId)

    if (!student) {
      throw new UserNotFoundError(studentId)
    }

    if (student.role !== "student") {
      throw new InvalidRoleError("student")
    }

    if (options.requireActive && !student.isActive) {
      throw new BadRequestError("Inactive students cannot be enrolled in classes")
    }

    return student
  }

  /**
   * Ensure a student is already enrolled in the target class.
   */
  private async assertStudentIsEnrolled(
    studentId: number,
    classId: number,
  ): Promise<void> {
    const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId)

    if (!isEnrolled) {
      throw new StudentNotInClassError()
    }
  }

  /**
   * Ensure a student is not already enrolled in the target class.
   */
  private async assertStudentNotEnrolled(
    studentId: number,
    classId: number,
  ): Promise<void> {
    const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId)

    if (isEnrolled) {
      throw new AlreadyEnrolledError()
    }
  }
}
