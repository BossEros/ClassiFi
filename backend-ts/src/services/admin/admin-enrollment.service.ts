import { inject, injectable } from "tsyringe"
import { ClassRepository } from "../../repositories/class.repository.js"
import { UserRepository } from "../../repositories/user.repository.js"
import { EnrollmentRepository } from "../../repositories/enrollment.repository.js"
import { toUserDTO, type UserDTO } from "../../shared/mappers.js"
import { UserNotFoundError, ClassNotFoundError } from "../../shared/errors.js"

/**
 * Admin service for class enrollment management.
 * Follows SRP - handles only admin enrollment-related concerns.
 * Uses repositories for all database access (DIP).
 */
@injectable()
export class AdminEnrollmentService {
  constructor(
    @inject("ClassRepository") private classRepo: ClassRepository,
    @inject("UserRepository") private userRepo: UserRepository,
    @inject("EnrollmentRepository")
    private enrollmentRepo: EnrollmentRepository,
  ) {}

  /**
   * Get all students enrolled in a class.
   * Delegates to EnrollmentRepository.
   */
  async getClassStudents(
    classId: number,
  ): Promise<Array<UserDTO & { enrolledAt: string }>> {
    const classExists = await this.classRepo.getClassById(classId)
    if (!classExists) {
      throw new ClassNotFoundError(classId)
    }

    const enrolledStudents =
      await this.enrollmentRepo.getEnrolledStudentsWithInfo(classId)

    return enrolledStudents.map((row) => ({
      ...toUserDTO(row.user as any),
      enrolledAt: row.enrolledAt?.toISOString() ?? new Date().toISOString(),
    }))
  }

  /**
   * Add a student to a class (admin-initiated enrollment).
   */
  async addStudentToClass(classId: number, studentId: number): Promise<void> {
    const classExists = await this.classRepo.getClassById(classId)
    if (!classExists) {
      throw new ClassNotFoundError(classId)
    }

    const student = await this.userRepo.getUserById(studentId)
    if (!student) {
      throw new UserNotFoundError(studentId)
    }

    if (student.role !== "student") {
      throw new Error("Only students can be enrolled in classes")
    }

    // Check if already enrolled
    const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId)
    if (isEnrolled) {
      throw new Error("Student is already enrolled in this class")
    }

    await this.enrollmentRepo.enrollStudent(studentId, classId)
  }

  /**
   * Remove a student from a class (admin-initiated unenrollment).
   */
  async removeStudentFromClass(
    classId: number,
    studentId: number,
  ): Promise<void> {
    const classExists = await this.classRepo.getClassById(classId)
    if (!classExists) {
      throw new ClassNotFoundError(classId)
    }

    const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId)
    if (!isEnrolled) {
      throw new Error("Student is not enrolled in this class")
    }

    await this.enrollmentRepo.unenrollStudent(studentId, classId)
  }
}
