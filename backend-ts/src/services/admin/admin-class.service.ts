import { inject, injectable } from "tsyringe"
import { generateUniqueClassCode } from "../../shared/utils.js"
import { ClassRepository } from "../../repositories/class.repository.js"
import { UserRepository } from "../../repositories/user.repository.js"
import { SubmissionRepository } from "../../repositories/submission.repository.js"
import { ClassService } from "../class.service.js"
import { toClassDTO, type ClassDTO } from "../../shared/mappers.js"
import {
  UserNotFoundError,
  ClassNotFoundError,
  InvalidRoleError,
} from "../../shared/errors.js"
import type {
  ClassFilterOptions,
  PaginatedResult,
  CreateClassData,
  UpdateClassData,
} from "./admin.types.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Admin service for class oversight operations.
 * Follows SRP - handles only admin class-related concerns.
 */
@injectable()
export class AdminClassService {
  constructor(
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.user) private userRepo: UserRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.services.class) private classService: ClassService,
  ) {}

  /**
   * Get all classes with pagination and filters.
   * Delegates to ClassRepository for clean separation.
   */
  async getAllClasses(
    options: ClassFilterOptions,
  ): Promise<PaginatedResult<ClassDTO & { teacherName: string }>> {
    const {
      page,
      limit,
      search,
      teacherId,
      status,
      yearLevel,
      semester,
      academicYear,
    } = options

    // Convert 'all' status to undefined for repository
    const result = await this.classRepo.getAllClassesFiltered({
      page,
      limit,
      search,
      teacherId,
      status: status === "all" ? undefined : status,
      yearLevel,
      semester,
      academicYear,
    })

    return {
      ...result,
      data: result.data.map((row) => ({
        ...toClassDTO(row, { studentCount: row.studentCount }),
        teacherName: row.teacherName || "Unknown",
      })),
    }
  }

  /**
   * Get a single class by ID with full details.
   * Delegates to ClassRepository for clean separation.
   */
  async getClassById(
    classId: number,
  ): Promise<ClassDTO & { teacherName: string }> {
    const result = await this.classRepo.getClassWithTeacher(classId)

    if (!result) {
      throw new ClassNotFoundError(classId)
    }

    const studentCount = await this.classRepo.getStudentCount(classId)

    return {
      ...toClassDTO(result, { studentCount }),
      teacherName: result.teacherName || "Unknown",
    }
  }

  /**
   * Create a class (admin can assign any teacher).
   */
  async createClass(data: CreateClassData): Promise<ClassDTO> {
    // Verify teacher exists and is a teacher
    const teacher = await this.userRepo.getUserById(data.teacherId)
    if (!teacher) {
      throw new UserNotFoundError(data.teacherId)
    }
    if (teacher.role !== "teacher") {
      throw new InvalidRoleError("teacher")
    }

    // Generate unique class code using shared utility
    const classCode = await generateUniqueClassCode(this.classRepo)

    const newClass = await this.classRepo.createClass({
      teacherId: data.teacherId,
      className: data.className,
      classCode: classCode!,
      yearLevel: data.yearLevel,
      semester: data.semester,
      academicYear: data.academicYear,
      schedule: data.schedule,
      description: data.description,
    })

    return toClassDTO(newClass, { studentCount: 0 })
  }

  /**
   * Update a class (admin can update any field including teacher).
   */
  async updateClass(classId: number, data: UpdateClassData): Promise<ClassDTO> {
    const existingClass = await this.classRepo.getClassById(classId)
    if (!existingClass) {
      throw new ClassNotFoundError(classId)
    }

    // If changing teacher, verify new teacher is valid
    if (data.teacherId && data.teacherId !== existingClass.teacherId) {
      const newTeacher = await this.userRepo.getUserById(data.teacherId)
      if (!newTeacher) {
        throw new UserNotFoundError(data.teacherId)
      }
      if (newTeacher.role !== "teacher") {
        throw new InvalidRoleError("teacher")
      }
    }

    // Update the class via repository
    const updateData: Partial<UpdateClassData> = {}
    if (data.className !== undefined) updateData.className = data.className
    if (data.description !== undefined)
      updateData.description = data.description
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.yearLevel !== undefined) updateData.yearLevel = data.yearLevel
    if (data.semester !== undefined) updateData.semester = data.semester
    if (data.academicYear !== undefined)
      updateData.academicYear = data.academicYear
    if (data.schedule !== undefined) updateData.schedule = data.schedule
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId

    const updated = await this.classRepo.updateClass(classId, updateData)

    if (!updated) {
      throw new ClassNotFoundError(classId)
    }

    const studentCount = await this.classRepo.getStudentCount(classId)
    return toClassDTO(updated, { studentCount })
  }

  /**
   * Delete a class (hard delete).
   */
  async deleteClass(classId: number): Promise<void> {
    // Use ClassService to force delete class (handles file cleanup)
    await this.classService.forceDeleteClass(classId)
  }

  /**
   * Reassign a class to a new teacher.
   * Returns the updated class with full details including teacher name.
   */
  async reassignClassTeacher(
    classId: number,
    newTeacherId: number,
  ): Promise<ClassDTO & { teacherName: string }> {
    await this.updateClass(classId, { teacherId: newTeacherId })
    return this.getClassById(classId)
  }

  /**
   * Archive a class (soft delete).
   * Returns the updated class with full details including teacher name.
   */
  async archiveClass(
    classId: number,
  ): Promise<ClassDTO & { teacherName: string }> {
    await this.updateClass(classId, { isActive: false })
    return this.getClassById(classId)
  }

  /**
   * Get all assignments for a class.
   */
  async getClassAssignments(classId: number): Promise<
    Array<{
      id: number
      title: string
      instructions: string | null
      deadline: string | null
      createdAt: string
      submissionCount: number
    }>
  > {
    const classExists = await this.classRepo.getClassById(classId)
    if (!classExists) {
      throw new ClassNotFoundError(classId)
    }

    const assignments = await this.classService.getClassAssignments(classId)

    // Get submission counts for each assignment
    const result = await Promise.all(
      assignments.map(async (assignment) => {
        const submissions =
          await this.submissionRepo.getSubmissionsByAssignment(
            assignment.id,
            true,
          )
        return {
          id: assignment.id,
          title: assignment.assignmentName,
          instructions: assignment.instructions,
          deadline: assignment.deadline || null,
          createdAt: assignment.createdAt || new Date().toISOString(),
          submissionCount: submissions.length,
        }
      }),
    )

    return result
  }
}