import { inject, injectable } from "tsyringe"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { EnrollmentRepository } from "@/modules/enrollments/enrollment.repository.js"
import { UserRepository } from "@/modules/users/user.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import { toClassDTO, type ClassDTO } from "@/modules/classes/class.mapper.js"
import {
  toAssignmentDTO,
  type AssignmentDTO,
} from "@/modules/assignments/assignment.mapper.js"
import { generateUniqueClassCode } from "@/modules/classes/class-code.util.js"
import { StorageService } from "@/services/storage.service.js"
import type { ClassSchedule } from "@/models/index.js"
import {
  ClassNotFoundError,
  NotClassOwnerError,
  InvalidRoleError,
  StudentNotInClassError,
  BadRequestError,
} from "@/shared/errors.js"
import { createLogger } from "@/shared/logger.js"
import type {
  CreateClassServiceDTO,
  RemoveStudentServiceDTO,
  UpdateClassServiceDTO,
  EnrolledStudentDTO,
} from "@/modules/classes/class.dtos.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("ClassService")

@injectable()
export class ClassService {
  constructor(
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.enrollment)
    private enrollmentRepo: EnrollmentRepository,
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.services.storage) private storageService: StorageService,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
  ) {}

  /** Generate a unique class code using shared utility */
  async generateClassCode(): Promise<string> {
    return await generateUniqueClassCode(this.classRepo)
  }

  /** Create a new class */
  async createClass(data: CreateClassServiceDTO): Promise<ClassDTO> {
    const teacher = await this.userRepo.getUserById(data.teacherId)

    if (!teacher || teacher.role !== "teacher") {
      throw new InvalidRoleError("teacher")
    }

    const newClass = await this.classRepo.createClass(data)
    const studentCount = await this.classRepo.getStudentCount(newClass.id)

    return toClassDTO(newClass, { studentCount })
  }

  /** Get a class by ID */
  async getClassById(classId: number, teacherId?: number): Promise<ClassDTO> {
    const classData = await this.classRepo.getClassById(classId)

    if (!classData) {
      throw new ClassNotFoundError(classId)
    }

    if (teacherId && classData.teacherId !== teacherId) {
      throw new NotClassOwnerError()
    }

    const studentCount = await this.classRepo.getStudentCount(classId)
    const instructor = await this.userRepo.getUserById(classData.teacherId)
    const instructorName = instructor
      ? `${instructor.firstName} ${instructor.lastName}`
      : undefined

    return toClassDTO(classData, { studentCount, teacherName: instructorName })
  }

  /**
   * Get all classes for a teacher.
   * Uses optimized single query to avoid N+1 problem.
   */
  async getClassesByTeacher(
    teacherId: number,
    activeOnly: boolean = true,
  ): Promise<ClassDTO[]> {
    const classesWithCounts = await this.classRepo.getClassesWithStudentCounts(
      teacherId,
      activeOnly,
    )

    return classesWithCounts.map((classRecord) =>
      toClassDTO(classRecord, { studentCount: classRecord.studentCount }),
    )
  }

  /** Update a class */
  async updateClass(data: UpdateClassServiceDTO): Promise<ClassDTO> {
    const {
      classId,
      teacherId,
      className,
      description,
      isActive,
      semester,
      academicYear,
      schedule,
    } = data

    const existingClass = await this.classRepo.getClassById(classId)

    if (!existingClass) {
      throw new ClassNotFoundError(classId)
    }

    if (existingClass.teacherId !== teacherId) {
      throw new NotClassOwnerError()
    }

    const updates: Partial<{
      className: string
      description: string | null
      isActive: boolean
      semester: number
      academicYear: string
      schedule: ClassSchedule
    }> = {}

    if (className !== undefined) updates.className = className
    if (description !== undefined) updates.description = description
    if (isActive !== undefined) updates.isActive = isActive
    if (semester !== undefined) updates.semester = semester
    if (academicYear !== undefined) updates.academicYear = academicYear
    if (schedule !== undefined) updates.schedule = schedule

    const updatedClass = await this.classRepo.updateClass(classId, updates)

    if (!updatedClass) {
      throw new ClassNotFoundError(classId)
    }

    const studentCount = await this.classRepo.getStudentCount(classId)

    return toClassDTO(updatedClass, { studentCount })
  }

  /** Delete a class */
  async deleteClass(classId: number, teacherId: number): Promise<void> {
    const existingClass = await this.classRepo.getClassById(classId)

    if (!existingClass) {
      throw new ClassNotFoundError(classId)
    }

    if (existingClass.teacherId !== teacherId) {
      throw new NotClassOwnerError()
    }

    await this.performClassDeletion(classId)
  }

  /**
   * Delete a class without ownership check (Admin only).
   * Performs safe cleanup of all associated files.
   */
  async forceDeleteClass(classId: number): Promise<void> {
    const existingClass = await this.classRepo.getClassById(classId)

    if (!existingClass) {
      throw new ClassNotFoundError(classId)
    }

    await this.performClassDeletion(classId)
  }

  /**
   * Delete all classes owned by a teacher.
   * Used for admin user deletion to ensure proper file cleanup.
   */
  async deleteClassesByTeacher(teacherId: number): Promise<void> {
    const teacherClasses = await this.classRepo.getClassesWithStudentCounts(
      teacherId,
      false,
    )

    for (const classRecord of teacherClasses) {
      try {
        await this.performClassDeletion(classRecord.id)
      } catch (error) {
        logger.error(
          `Failed to delete class ${classRecord.id} for teacher ${teacherId}:`,
          error,
        )
      }
    }
  }

  /**
   * Shared helper to safely delete a class and its associated files.
   */
  private async performClassDeletion(classId: number): Promise<void> {
    try {
      const submissions = await this.submissionRepo.getSubmissionsByClass(classId)

      if (submissions.length > 0) {
        const filePaths = submissions.map((submission) => submission.filePath)
        await this.storageService.deleteSubmissionFiles(filePaths)
      }
    } catch (error) {
      logger.error("Error cleaning up class submission files:", error)
    }

    try {
      const classAssignments =
        await this.assignmentRepo.getAssignmentsByClassId(classId, false)

      const instructionsImageUrls = classAssignments
        .map((assignment) => assignment.instructionsImageUrl)
        .filter((imageUrl): imageUrl is string => !!imageUrl)

      await Promise.all(
        instructionsImageUrls.map((imageUrl) =>
          this.storageService.deleteAssignmentInstructionsImage(imageUrl),
        ),
      )
    } catch (error) {
      logger.error("Error cleaning up assignment instructions images:", error)
    }

    await this.classRepo.deleteClass(classId)
  }

  /** Get all assignments for a class with class-level submission aggregates. */
  async getClassAssignments(classId: number): Promise<AssignmentDTO[]> {
    const assignments = await this.assignmentRepo.getAssignmentsByClassId(classId)
    const studentCount = await this.classRepo.getStudentCount(classId)
    const assignmentIds = assignments.map((assignment) => assignment.id)
    const submissionCounts = assignmentIds.length
      ? await this.submissionRepo.getLatestSubmissionCountsByAssignmentIds(assignmentIds)
      : new Map<number, number>()

    return assignments.map((assignment) =>
      toAssignmentDTO(assignment, {
        submissionCount: submissionCounts.get(assignment.id) ?? 0,
        studentCount,
      }),
    )
  }

  /** Get all assignments for a class when requested in a student context. */
  async getClassAssignmentsForStudent(
    classId: number,
    studentId: number,
  ): Promise<AssignmentDTO[]> {
    if (!Number.isInteger(classId) || classId <= 0) {
      throw new BadRequestError("Invalid class ID")
    }

    if (!Number.isInteger(studentId) || studentId <= 0) {
      throw new BadRequestError("Invalid student ID")
    }

    const isStudentInClass = await this.enrollmentRepo.isEnrolled(studentId, classId)

    if (!isStudentInClass) {
      throw new StudentNotInClassError()
    }

    const classAssignments = await this.getClassAssignments(classId)
    const assignmentIds = classAssignments.map((assignment) => assignment.id)
    const latestSubmissionByAssignmentId =
      await this.submissionRepo.getLatestSubmissionsByStudentAndAssignmentIds(
        studentId,
        assignmentIds,
      )

    return classAssignments.map((assignment) => {
      const latestSubmission = latestSubmissionByAssignmentId.get(assignment.id)

      return {
        ...assignment,
        hasSubmitted: !!latestSubmission,
        submittedAt: latestSubmission?.submittedAt?.toISOString() ?? null,
        grade: latestSubmission?.grade ?? null,
      }
    })
  }

  /** Get all students in a class. */
  async getClassStudents(classId: number): Promise<EnrolledStudentDTO[]> {
    const existingClass = await this.classRepo.getClassById(classId)

    if (!existingClass) {
      throw new ClassNotFoundError(classId)
    }

    const students = await this.enrollmentRepo.getEnrolledStudentsWithInfo(classId)

    return students.map((studentRow) => ({
      id: studentRow.user.id,
      email: studentRow.user.email,
      firstName: studentRow.user.firstName,
      lastName: studentRow.user.lastName,
      avatarUrl: studentRow.user.avatarUrl ?? null,
    }))
  }

  /** Remove a student from a class. */
  async removeStudent(data: RemoveStudentServiceDTO): Promise<void> {
    const { classId, studentId, teacherId } = data

    const existingClass = await this.classRepo.getClassById(classId)

    if (!existingClass) {
      throw new ClassNotFoundError(classId)
    }

    if (existingClass.teacherId !== teacherId) {
      throw new NotClassOwnerError()
    }

    const isStudentInClass = await this.enrollmentRepo.isEnrolled(studentId, classId)

    if (!isStudentInClass) {
      throw new StudentNotInClassError()
    }

    const removed = await this.enrollmentRepo.unenrollStudent(studentId, classId)

    if (!removed) {
      throw new BadRequestError("Failed to remove student from class")
    }

    // Notify student of removal and teacher of unenrollment (fire-and-forget)
    const [teacher, student] = await Promise.all([
      this.userRepo.getUserById(teacherId),
      this.userRepo.getUserById(studentId),
    ])
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown"
    const studentName = student ? `${student.firstName} ${student.lastName}` : "Unknown"
    const studentEmail = student?.email ?? ""

    // Send REMOVED_FROM_CLASS to student
    const removedData = {
      classId,
      className: existingClass.className,
      instructorName: teacherName,
    }

    void Promise.allSettled([
      this.notificationService.createNotification(studentId, "REMOVED_FROM_CLASS", removedData),
      this.notificationService.sendEmailNotificationIfEnabled(studentId, "REMOVED_FROM_CLASS", removedData),
    ]).catch((error) => logger.error("Failed to send removal notification to student", { studentId, classId, error }))

    // Send STUDENT_UNENROLLED to teacher
    const unenrolledData = {
      classId,
      className: existingClass.className,
      studentName,
      studentEmail,
    }

    void Promise.allSettled([
      this.notificationService.createNotification(teacherId, "STUDENT_UNENROLLED", unenrolledData),
      this.notificationService.sendEmailNotificationIfEnabled(teacherId, "STUDENT_UNENROLLED", unenrolledData),
    ]).catch((error) => logger.error("Failed to send unenrollment notification to teacher", { teacherId, classId, error }))
  }
}

