import { inject, injectable } from "tsyringe"
import { ClassRepository } from "../repositories/class.repository.js"
import { AssignmentRepository } from "../repositories/assignment.repository.js"
import { EnrollmentRepository } from "../repositories/enrollment.repository.js"
import { UserRepository } from "../repositories/user.repository.js"
import { SubmissionRepository } from "../repositories/submission.repository.js"
import { StorageService } from "./storage.service.js"
import type { ClassSchedule } from "../models/index.js"
import {
  toClassDTO,
  toAssignmentDTO,
  type ClassDTO,
  type AssignmentDTO,
} from "../shared/mappers.js"
import { generateUniqueClassCode } from "../shared/utils.js"
import {
  ClassNotFoundError,
  NotClassOwnerError,
  InvalidRoleError,
  StudentNotInClassError,
  BadRequestError,
} from "../shared/errors.js"
import { createLogger } from "../shared/logger.js"
import type {
  CreateClassServiceDTO,
  RemoveStudentServiceDTO,
  UpdateClassServiceDTO,
  EnrolledStudentDTO,
} from "./service-dtos.js"

const logger = createLogger("ClassService")

@injectable()
export class ClassService {
  constructor(
    @inject("ClassRepository") private classRepo: ClassRepository,
    @inject("AssignmentRepository")
    private assignmentRepo: AssignmentRepository,
    @inject("EnrollmentRepository")
    private enrollmentRepo: EnrollmentRepository,
    @inject("UserRepository") private userRepo: UserRepository,
    @inject("SubmissionRepository")
    private submissionRepo: SubmissionRepository,
    @inject("StorageService") private storageService: StorageService,
  ) {}

  /** Generate a unique class code using shared utility */
  async generateClassCode(): Promise<string> {
    return await generateUniqueClassCode(this.classRepo)
  }

  /** Create a new class */
  async createClass(data: CreateClassServiceDTO): Promise<ClassDTO> {
    // Verify teacher exists
    const teacher = await this.userRepo.getUserById(data.teacherId)

    if (!teacher || teacher.role !== "teacher") {
      throw new InvalidRoleError("teacher")
    }

    // Create the class
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

    // Optional authorization check
    if (teacherId && classData.teacherId !== teacherId) {
      throw new NotClassOwnerError()
    }

    const studentCount = await this.classRepo.getStudentCount(classId)

    // Fetch instructor name
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
    return classesWithCounts.map((c) =>
      toClassDTO(c, { studentCount: c.studentCount }),
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
      yearLevel,
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

    // Build updates object and filter out undefined values
    const updates: Partial<{
      className: string
      description: string | null
      isActive: boolean
      yearLevel: number
      semester: number
      academicYear: string
      schedule: ClassSchedule
    }> = {}

    if (className !== undefined) updates.className = className
    if (description !== undefined) updates.description = description
    if (isActive !== undefined) updates.isActive = isActive
    if (yearLevel !== undefined) updates.yearLevel = yearLevel
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
    // Get ALL classes (active and inactive)
    const teacherClasses = await this.classRepo.getClassesWithStudentCounts(
      teacherId,
      false,
    )

    // Delete each class with file cleanup
    for (const cls of teacherClasses) {
      try {
        await this.performClassDeletion(cls.id)
      } catch (error) {
        logger.error(
          `Failed to delete class ${cls.id} for teacher ${teacherId}:`,
          error,
        )
        // Continue with other classes - don't block user deletion
      }
    }
  }

  /**
   * Shared helper to safely delete a class and its associated files.
   */
  private async performClassDeletion(classId: number): Promise<void> {
    // 1. Clean up submission files using StorageService
    try {
      const submissions =
        await this.submissionRepo.getSubmissionsByClass(classId)

      if (submissions.length > 0) {
        const filePaths = submissions.map((s) => s.filePath)
        await this.storageService.deleteSubmissionFiles(filePaths)
      }
    } catch (error) {
      logger.error("Error cleaning up class submission files:", error)
      // Continue with deletion anyway
    }

    // 2. Delete class from database (cascades to assignments, submissions, enrollments)
    await this.classRepo.deleteClass(classId)
  }

  /** Get all assignments for a class (delegates to AssignmentRepository) */
  async getClassAssignments(classId: number): Promise<AssignmentDTO[]> {
    const assignments =
      await this.assignmentRepo.getAssignmentsByClassId(classId)

    return assignments.map((a) => toAssignmentDTO(a))
  }

  /**
   * Get all assignments for a class with student-specific data.
   * Includes submission status, grade, and submission timestamp.
   *
   * @param classId - The unique identifier of the class.
   * @param studentId - The unique identifier of the student.
   * @returns An array of assignments with student-specific submission data.
   * @throws {BadRequestError} If classId or studentId is invalid.
   * @throws {StudentNotInClassError} If the student is not enrolled in the class.
   */
  async getClassAssignmentsForStudent(
    classId: number,
    studentId: number,
  ): Promise<AssignmentDTO[]> {
    // Validate required inputs
    if (!classId || !Number.isInteger(classId) || classId <= 0) {
      throw new BadRequestError("Invalid class ID")
    }

    if (!studentId || !Number.isInteger(studentId) || studentId <= 0) {
      throw new BadRequestError("Invalid student ID")
    }

    // Check if student is enrolled in the class
    const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId)

    if (!isEnrolled) {
      throw new StudentNotInClassError()
    }

    const assignments =
      await this.assignmentRepo.getAssignmentsByClassId(classId)

    // Fetch submission and grade data for each assignment
    const assignmentsWithData = await Promise.all(
      assignments.map(async (assignment) => {
        // Get latest submission
        const submission = await this.submissionRepo.getLatestSubmission(
          assignment.id,
          studentId,
        )

        // Get grade from submission
        const grade = submission?.grade ?? null
        const submittedAt = submission?.submittedAt?.toISOString() ?? null
        const hasSubmitted = !!submission

        return toAssignmentDTO(assignment, {
          hasSubmitted,
          submittedAt,
          grade,
          maxGrade: assignment.totalScore ?? 100,
        })
      }),
    )

    return assignmentsWithData
  }

  /** Get all students enrolled in a class */
  async getClassStudents(classId: number): Promise<EnrolledStudentDTO[]> {
    const studentsWithInfo =
      await this.enrollmentRepo.getEnrolledStudentsWithInfo(classId)

    return studentsWithInfo.map((s) => ({
      id: s.user.id,
      email: s.user.email,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      avatarUrl: s.user.avatarUrl ?? null,
    }))
  }

  /** Remove a student from a class */
  async removeStudent(data: RemoveStudentServiceDTO): Promise<void> {
    const { classId, studentId, teacherId } = data

    const classData = await this.classRepo.getClassById(classId)

    if (!classData) {
      throw new ClassNotFoundError(classId)
    }

    if (classData.teacherId !== teacherId) {
      throw new NotClassOwnerError()
    }

    const removed = await this.enrollmentRepo.unenrollStudent(
      studentId,
      classId,
    )

    if (!removed) {
      throw new StudentNotInClassError()
    }
  }
}





