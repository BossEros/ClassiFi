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
  BulkEnrollmentResult,
} from "@/modules/admin/admin.types.js"
import { withTransaction } from "@/shared/transaction.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { fireAndForget, settlePromisesAndLogRejections } from "@/shared/utils.js"
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
    const createdEnrollment = await this.enrollmentRepo.enrollStudent(
      studentId,
      classId,
    )

    const teacher = await this.userRepo.getUserById(classData.teacherId)
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"
    const studentName = `${student.firstName} ${student.lastName}`

    // STEP 4: Notify the student (enrollment confirmed) and teacher (student enrolled) — fire-and-forget
    const enrollmentData = {
      classId,
      className: classData.className,
      enrollmentId: createdEnrollment.id,
      instructorName: teacherName,
      classUrl: `${settings.frontendUrl}/dashboard/classes/${classId}`,
    }

    fireAndForget(
      settlePromisesAndLogRejections([
        this.notificationService.createNotification(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
        this.notificationService.sendEmailNotificationIfEnabled(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
      ], logger, "Failed to send enrollment notification to student", {
        studentId,
        classId,
      }),
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
      settlePromisesAndLogRejections([
        this.notificationService.createNotification(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
        this.notificationService.sendEmailNotificationIfEnabled(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
      ], logger, "Failed to send enrollment notification to teacher", {
        teacherId: classData.teacherId,
        classId,
      }),
      logger,
      "Failed to send enrollment notification to teacher",
      { teacherId: classData.teacherId, classId },
    )
  }

  /**
   * Remove a student from a class (admin-initiated unenrollment).
   */
  async removeStudentFromClass(classId: number, studentId: number): Promise<void> {    // STEP 1: Validate the class exists and confirm the student is currently enrolled
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
      settlePromisesAndLogRejections([
        this.notificationService.createNotification(studentId, "REMOVED_FROM_CLASS", removedData),
        this.notificationService.sendEmailNotificationIfEnabled(studentId, "REMOVED_FROM_CLASS", removedData),
      ], logger, "Failed to send removal notification to student", {
        studentId,
        classId,
      }),
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
      settlePromisesAndLogRejections([
        this.notificationService.createNotification(classData.teacherId, "STUDENT_UNENROLLED", unenrolledData),
        this.notificationService.sendEmailNotificationIfEnabled(classData.teacherId, "STUDENT_UNENROLLED", unenrolledData),
      ], logger, "Failed to send unenrollment notification to teacher", {
        teacherId: classData.teacherId,
        classId,
      }),
      logger,
      "Failed to send unenrollment notification to teacher",
      { teacherId: classData.teacherId, classId },
    )
  }

  /**
   * Bulk-enroll multiple students into a class (admin-initiated).
   *
   * Processes each student independently so a single failure does not block the
   * rest. Returns a per-student result set alongside an aggregated summary.
   *
   * @param classId - The class to enroll students into.
   * @param studentIds - Array of student IDs to process.
   * @returns Aggregated results including counts and per-student outcome details.
   */
  async bulkEnrollStudents(classId: number, studentIds: number[]): Promise<BulkEnrollmentResult> {
    // STEP 1: Validate the target class once (must exist and be active)
    const classData = await this.getValidatedClass(classId, { requireActive: true })

    const teacher = await this.userRepo.getUserById(classData.teacherId)
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"

    const results: BulkEnrollmentResult["results"] = []

    // STEP 2: Process each student independently to avoid a single failure blocking others
    for (const studentId of studentIds) {
      try {
        const student = await this.getValidatedStudent(studentId, { requireActive: true })
        await this.assertStudentNotEnrolled(studentId, classId)

        const createdEnrollment = await this.enrollmentRepo.enrollStudent(studentId, classId)
        const studentName = `${student.firstName} ${student.lastName}`

        results.push({ studentId, status: "enrolled" })

        // STEP 3: Notify each successfully enrolled student and the teacher — fire-and-forget
        const enrollmentData = {
          classId,
          className: classData.className,
          enrollmentId: createdEnrollment.id,
          instructorName: teacherName,
          classUrl: `${settings.frontendUrl}/dashboard/classes/${classId}`,
        }

        fireAndForget(
          settlePromisesAndLogRejections([
            this.notificationService.createNotification(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
            this.notificationService.sendEmailNotificationIfEnabled(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
          ], logger, "Failed to send bulk enrollment notification to student", { studentId, classId }),
          logger,
          "Failed to send bulk enrollment notification to student",
          { studentId, classId },
        )

        const studentEnrolledData = {
          classId,
          className: classData.className,
          studentName,
          studentEmail: student.email,
        }

        fireAndForget(
          settlePromisesAndLogRejections([
            this.notificationService.createNotification(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
            this.notificationService.sendEmailNotificationIfEnabled(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
          ], logger, "Failed to send bulk enrollment notification to teacher", { teacherId: classData.teacherId, classId }),
          logger,
          "Failed to send bulk enrollment notification to teacher",
          { teacherId: classData.teacherId, classId },
        )
      } catch (error) {
        const isAlreadyEnrolled = error instanceof AlreadyEnrolledError
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        results.push({
          studentId,
          status: isAlreadyEnrolled ? "skipped" : "failed",
          reason: isAlreadyEnrolled ? "Student is already enrolled in this class" : errorMessage,
        })
      }
    }

    const enrolledCount = results.filter((r) => r.status === "enrolled").length
    const skippedCount = results.filter((r) => r.status === "skipped").length
    const failedCount = results.filter((r) => r.status === "failed").length

    return {
      summary: {
        total: studentIds.length,
        enrolled: enrolledCount,
        skipped: skippedCount,
        failed: failedCount,
      },
      results,
    }
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
