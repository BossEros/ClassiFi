import { inject, injectable } from "tsyringe"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { UserRepository } from "@/modules/users/user.repository.js"
import { EnrollmentRepository } from "@/modules/enrollments/enrollment.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
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
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { fireAndForget } from "@/shared/utils.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("AdminEnrollmentService")

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
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
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
    // STEP 1: Validate the class (must exist and be active) and student (must exist, be active, with student role)
    const classData = await this.getValidatedClass(classId, { requireActive: true })
    const student = await this.getValidatedStudent(studentId, { requireActive: true })

    // STEP 2: Confirm the student is not already enrolled in this class
    await this.assertStudentNotEnrolled(studentId, classId)

    // STEP 3: Create the enrollment record
    await this.enrollmentRepo.enrollStudent(studentId, classId)

    const teacher = await this.userRepo.getUserById(classData.teacherId)
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"
    const studentName = `${student.firstName} ${student.lastName}`

    // STEP 4: Notify the student (enrollment confirmed) and teacher (student enrolled) — fire-and-forget
    const enrollmentData = {
      classId,
      className: classData.className,
      enrollmentId: classId,
      instructorName: teacherName,
      classUrl: `${settings.frontendUrl}/dashboard/classes/${classId}`,
    }

    fireAndForget(
      Promise.allSettled([
        this.notificationService.createNotification(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
        this.notificationService.sendEmailNotificationIfEnabled(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
      ]),
      logger,
      "Failed to send enrollment notification to student",
      { studentId, classId },
    )

    const studentEnrolledData = {
      classId,
      className: classData.className,
      studentName,
      studentEmail: student.email,
    }

    fireAndForget(
      Promise.allSettled([
        this.notificationService.createNotification(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
        this.notificationService.sendEmailNotificationIfEnabled(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
      ]),
      logger,
      "Failed to send enrollment notification to teacher",
      { teacherId: classData.teacherId, classId },
    )
  }

  /**
   * Remove a student from a class (admin-initiated unenrollment).
   */
  async removeStudentFromClass(classId: number, studentId: number): Promise<void> {
    // STEP 1: Validate the class exists and confirm the student is currently enrolled
    const classData = await this.getValidatedClass(classId)
    await this.assertStudentIsEnrolled(studentId, classId)

    // STEP 2: Remove the enrollment record
    await this.enrollmentRepo.unenrollStudent(studentId, classId)

    const [teacher, student] = await Promise.all([
      this.userRepo.getUserById(classData.teacherId),
      this.userRepo.getUserById(studentId),
    ])
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"
    const studentName = student ? `${student.firstName} ${student.lastName}` : "Unknown"
    const studentEmail = student?.email ?? ""

    // STEP 3: Notify the student (removed from class) and teacher (student unenrolled) — fire-and-forget
    const removedData = {
      classId,
      className: classData.className,
      instructorName: teacherName,
    }

    fireAndForget(
      Promise.allSettled([
        this.notificationService.createNotification(studentId, "REMOVED_FROM_CLASS", removedData),
        this.notificationService.sendEmailNotificationIfEnabled(studentId, "REMOVED_FROM_CLASS", removedData),
      ]),
      logger,
      "Failed to send removal notification to student",
      { studentId, classId },
    )

    const unenrolledData = {
      classId,
      className: classData.className,
      studentName,
      studentEmail,
    }

    fireAndForget(
      Promise.allSettled([
        this.notificationService.createNotification(classData.teacherId, "STUDENT_UNENROLLED", unenrolledData),
        this.notificationService.sendEmailNotificationIfEnabled(classData.teacherId, "STUDENT_UNENROLLED", unenrolledData),
      ]),
      logger,
      "Failed to send unenrollment notification to teacher",
      { teacherId: classData.teacherId, classId },
    )
  }

  /**
   * Transfer a student from one class to another.
   */
  async transferStudent(data: TransferStudentData): Promise<void> {
    const { studentId, fromClassId, toClassId } = data

    // STEP 1: Validate that the source and destination classes are different
    if (fromClassId === toClassId) {
      throw new BadRequestError(
        "Source and destination classes must be different",
      )
    }

    // STEP 2: Validate the student, both classes, and enrollment state in parallel
    await Promise.all([
      this.getValidatedClass(fromClassId),
      this.getValidatedClass(toClassId, { requireActive: true }),
      this.getValidatedStudent(studentId, { requireActive: true }),
      this.assertStudentIsEnrolled(studentId, fromClassId),
      this.assertStudentNotEnrolled(studentId, toClassId),
    ])

    // STEP 3: Unenroll from the source class and enroll in the destination class in a single transaction
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
