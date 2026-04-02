import { inject, injectable } from "tsyringe"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { EnrollmentRepository } from "@/modules/enrollments/enrollment.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { UserRepository } from "@/modules/users/user.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import type { DashboardQueryReadRepository } from "@/modules/dashboard/dashboard-query.repository.js"
import {
  toDashboardClassDTO,
  type DashboardClassDTO,
  type PendingAssignmentDTO,
} from "@/modules/dashboard/dashboard.mapper.js"
import {
  ClassNotFoundError,
  ClassInactiveError,
  AlreadyEnrolledError,
  NotEnrolledError,
} from "@/shared/errors.js"
import { settings } from "@/shared/config.js"
import { createLogger } from "@/shared/logger.js"
import { fireAndForget, settlePromisesAndLogRejections } from "@/shared/utils.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("StudentDashboardService")

/**
 * Business logic for student dashboard operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class StudentDashboardService {
  constructor(
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.enrollment)
    private enrollmentRepo: EnrollmentRepository,
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
    @inject(DI_TOKENS.repositories.dashboardQuery)
    private dashboardQueryRepo?: DashboardQueryReadRepository,
  ) {}

  /** Get complete dashboard data for a student */
  async getDashboardData(
    studentId: number,
    enrolledClassesLimit: number = 12,
    pendingAssignmentsLimit: number = 10,
  ): Promise<{
    enrolledClasses: DashboardClassDTO[]
    pendingAssignments: PendingAssignmentDTO[]
  }> {
    const enrolledClasses = await this.getEnrolledClasses(
      studentId,
      enrolledClassesLimit,
    )
    const pendingAssignments = await this.getPendingAssignments(
      studentId,
      pendingAssignmentsLimit,
    )

    return {
      enrolledClasses,
      pendingAssignments,
    }
  }

  /** Get enrolled classes for a student */
  async getEnrolledClasses(
    studentId: number,
    limit?: number,
  ): Promise<DashboardClassDTO[]> {
    let classesWithDetails =
      await this.classRepo.getClassesByStudentWithDetails(studentId, true)

    if (limit) {
      classesWithDetails = classesWithDetails.slice(0, limit)
    }

    return classesWithDetails.map((c) =>
      toDashboardClassDTO(c, {
        studentCount: c.studentCount,
        teacherName: c.teacherName,
      }),
    )
  }

  /** Get pending assignments for a student */
  async getPendingAssignments(
    studentId: number,
    limit: number = 10,
  ): Promise<PendingAssignmentDTO[]> {
    if (this.dashboardQueryRepo?.getPendingAssignmentsForStudent) {
      const pendingAssignments =
        await this.dashboardQueryRepo.getPendingAssignmentsForStudent(
          studentId,
          limit,
        )

      return pendingAssignments.map((assignment) => ({
        id: assignment.id,
        assignmentName: assignment.assignmentName,
        className: assignment.className,
        classId: assignment.classId,
        deadline: assignment.deadline?.toISOString() ?? null,
        hasSubmitted: false,
        programmingLanguage: assignment.programmingLanguage,
      }))
    }

    const enrolledClasses = await this.classRepo.getClassesByStudent(
      studentId,
      true,
    )

    const now = new Date()
    const pendingAssignments: PendingAssignmentDTO[] = []

    for (const classData of enrolledClasses) {
      const assignments = await this.assignmentRepo.getAssignmentsByClassId(
        classData.id,
        true,
      )

      for (const assignment of assignments) {
        // Include assignments with no deadline or whose deadline hasn't passed
        const isUpcoming = !assignment.deadline || assignment.deadline > now

        if (isUpcoming) {
          // Check if student has submitted
          const submission = await this.submissionRepo.getLatestSubmission(
            assignment.id,
            studentId,
          )

          if (!submission) {
            pendingAssignments.push({
              id: assignment.id,
              assignmentName: assignment.assignmentName,
              className: classData.className,
              classId: classData.id,
              deadline: assignment.deadline?.toISOString() ?? null,
              hasSubmitted: false,
              programmingLanguage: assignment.programmingLanguage,
            })
          }
        }
      }
    }

    // Sort by deadline (null deadlines last) and limit
    pendingAssignments.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1

      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })

    return pendingAssignments.slice(0, limit)
  }

  /** Join a class using class code */
  async joinClass(
    studentId: number,
    classCode: string,
  ): Promise<DashboardClassDTO> {
    // STEP 1: Find the class by join code and verify it is active
    const classData = await this.classRepo.getClassByCode(classCode)

    if (!classData) {
      throw new ClassNotFoundError(classCode)
    }

    if (!classData.isActive) {
      throw new ClassInactiveError()
    }

    // STEP 2: Ensure the student is not already enrolled
    const isEnrolled = await this.enrollmentRepo.isEnrolled(
      studentId,
      classData.id,
    )
    if (isEnrolled) {
      throw new AlreadyEnrolledError()
    }

    // STEP 3: Create the enrollment record
    const createdEnrollment = await this.enrollmentRepo.enrollStudent(
      studentId,
      classData.id,
    )

    const studentCount = await this.classRepo.getStudentCount(classData.id)
    const teacher = await this.userRepo.getUserById(classData.teacherId)
    const student = await this.userRepo.getUserById(studentId)
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"
    const studentName = student ? `${student.firstName} ${student.lastName}` : "Unknown"
    const studentEmail = student?.email ?? ""

    // STEP 4: Notify the student (enrollment confirmed) and teacher (student enrolled) — fire-and-forget
    const enrollmentData = {
      classId: classData.id,
      className: classData.className,
      enrollmentId: createdEnrollment.id,
      instructorName: teacherName,
      classUrl: `${settings.frontendUrl}/dashboard/classes/${classData.id}`,
    }

    fireAndForget(
      settlePromisesAndLogRejections([
        this.notificationService.createNotification(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
        this.notificationService.sendEmailNotificationIfEnabled(studentId, "ENROLLMENT_CONFIRMED", enrollmentData),
      ], logger, "Failed to send enrollment notification to student", {
        studentId,
        classId: classData.id,
      }),
      logger,
      "Failed to send enrollment notification to student",
      { studentId, classId: classData.id },
    )

    const studentEnrolledData = {
      classId: classData.id,
      className: classData.className,
      studentName,
      studentEmail,
    }

    fireAndForget(
      settlePromisesAndLogRejections([
        this.notificationService.createNotification(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
        this.notificationService.sendEmailNotificationIfEnabled(classData.teacherId, "STUDENT_ENROLLED", studentEnrolledData),
      ], logger, "Failed to send enrollment notification to teacher", {
        teacherId: classData.teacherId,
        classId: classData.id,
      }),
      logger,
      "Failed to send enrollment notification to teacher",
      { teacherId: classData.teacherId, classId: classData.id },
    )

    return toDashboardClassDTO(classData, {
      studentCount,
      teacherName: teacher
        ? `${teacher.firstName} ${teacher.lastName}`
        : undefined,
    })
  }

  /** Leave a class */
  async leaveClass(studentId: number, classId: number): Promise<void> {
    const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId)

    if (!isEnrolled) {
      throw new NotEnrolledError()
    }

    await this.enrollmentRepo.unenrollStudent(studentId, classId)

    // Notify teacher that student left (fire-and-forget)
    const [classData, student] = await Promise.all([
      this.classRepo.getClassById(classId),
      this.userRepo.getUserById(studentId),
    ])

    if (classData && student) {
      const unenrolledData = {
        classId,
        className: classData.className,
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.email,
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
  }
}
