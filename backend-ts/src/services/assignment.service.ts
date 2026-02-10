import { inject, injectable } from "tsyringe"
import { AssignmentRepository } from "../repositories/assignment.repository.js"
import { TestCaseRepository } from "../repositories/testCase.repository.js"
import { ClassRepository } from "../repositories/class.repository.js"
import { EnrollmentRepository } from "../repositories/enrollment.repository.js"
import { NotificationService } from "./notification/notification.service.js"
import { toAssignmentDTO, type AssignmentDTO } from "../shared/mappers.js"
import { requireClassOwnership } from "../shared/guards.js"
import {
  AssignmentNotFoundError,
  InvalidAssignmentDataError,
} from "../shared/errors.js"
import type {
  UpdateAssignmentServiceDTO,
  CreateAssignmentServiceDTO,
} from "./service-dtos.js"
import { settings } from "../shared/config.js"

/**
 * Business logic for assignment-related operations.
 * Follows SRP - handles only assignment concerns.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class AssignmentService {
  constructor(
    @inject("AssignmentRepository")
    private assignmentRepo: AssignmentRepository,
    @inject("ClassRepository") private classRepo: ClassRepository,
    @inject("TestCaseRepository") private testCaseRepo: TestCaseRepository,
    @inject("EnrollmentRepository")
    private enrollmentRepo: EnrollmentRepository,
    @inject("NotificationService")
    private notificationService: NotificationService,
  ) {}

  /**
   * Create an assignment for a class.
   * Validates class ownership and sends notifications to enrolled students.
   */
  async createAssignment(
    data: CreateAssignmentServiceDTO,
  ): Promise<AssignmentDTO> {
    const {
      classId,
      teacherId,
      assignmentName,
      description,
      programmingLanguage,
      deadline,
      allowResubmission,
      maxAttempts,
      templateCode,
      totalScore,
      scheduledDate,
    } = data

    // Verify class exists and teacher owns it
    await requireClassOwnership(this.classRepo, classId, teacherId)

    const assignment = await this.assignmentRepo.createAssignment({
      classId,
      assignmentName,
      description,
      programmingLanguage,
      deadline,
      allowResubmission,
      maxAttempts,
      templateCode,
      totalScore,
      scheduledDate,
    })

    // Notify enrolled students asynchronously (don't block assignment creation)
    this.notifyStudentsOfNewAssignment(assignment).catch((error) => {
      // TODO: Replace with structured logger (e.g., pino, winston) for better observability
      console.error("Failed to send assignment notifications:", error)
    })

    return toAssignmentDTO(assignment)
  }

  /**
   * Notify all enrolled students about a new assignment.
   * Runs asynchronously to avoid blocking the main flow.
   */
  private async notifyStudentsOfNewAssignment(
    assignment: Awaited<
      ReturnType<typeof this.assignmentRepo.createAssignment>
    >,
  ): Promise<void> {
    const classData = await this.classRepo.getClassById(assignment.classId)
    const enrolledStudents =
      await this.enrollmentRepo.getEnrolledStudentsWithInfo(assignment.classId)

    const notificationPromises = enrolledStudents.map((enrollment) =>
      this.notificationService.createNotification(
        enrollment.user.id,
        "ASSIGNMENT_CREATED",
        {
          assignmentId: assignment.id,
          assignmentTitle: assignment.assignmentName,
          className: classData?.className || "Unknown Class",
          classId: assignment.classId,
          dueDate: assignment.deadline
            ? new Date(assignment.deadline).toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "No deadline",
          assignmentUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
        },
      ),
    )

    await Promise.all(notificationPromises)
  }

  /**
   * Get all assignments for a class.
   */
  async getClassAssignments(classId: number): Promise<AssignmentDTO[]> {
    const assignments =
      await this.assignmentRepo.getAssignmentsByClassId(classId)

    return assignments.map((a) => toAssignmentDTO(a))
  }

  /**
   * Get assignment details by ID.
   * Includes class name in the response.
   */
  async getAssignmentDetails(assignmentId: number): Promise<AssignmentDTO> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    const classData = await this.classRepo.getClassById(assignment.classId)
    const testCases = await this.testCaseRepo.getByAssignmentId(assignmentId)

    return toAssignmentDTO(assignment, {
      className: classData?.className,
      testCases: testCases.map((tc) => ({
        id: tc.id,
        name: tc.name,
        isHidden: tc.isHidden,
        // Only include input/expectedOutput for non-hidden test cases
        input: tc.isHidden ? undefined : tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
      })),
    })
  }

  /**
   * Update an assignment.
   * Validates class ownership and business rules.
   */
  async updateAssignment(
    data: UpdateAssignmentServiceDTO,
  ): Promise<AssignmentDTO> {
    const { assignmentId, teacherId, ...updateData } = data

    const existingAssignment =
      await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!existingAssignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    // Verify teacher owns the class
    await requireClassOwnership(
      this.classRepo,
      existingAssignment.classId,
      teacherId,
    )

    // Validate business rule: deadline must be after scheduled date
    // Handle partial updates by comparing against existing values
    const finalDeadline = updateData.deadline ?? existingAssignment.deadline
    const finalScheduledDate =
      updateData.scheduledDate ?? existingAssignment.scheduledDate

    if (
      finalDeadline &&
      finalScheduledDate &&
      finalDeadline < finalScheduledDate
    ) {
      throw new InvalidAssignmentDataError(
        "Deadline must be after scheduled date",
      )
    }

    const updatedAssignment = await this.assignmentRepo.updateAssignment(
      assignmentId,
      updateData,
    )

    if (!updatedAssignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    return toAssignmentDTO(updatedAssignment)
  }

  /**
   * Delete an assignment.
   * Validates class ownership.
   */
  async deleteAssignment(
    assignmentId: number,
    teacherId: number,
  ): Promise<void> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    // Verify teacher owns the class
    await requireClassOwnership(this.classRepo, assignment.classId, teacherId)

    await this.assignmentRepo.deleteAssignment(assignmentId)
  }

  /**
   * Get assignment by ID (without authorization check).
   * Used internally or for cases where auth is handled elsewhere.
   */
  async getAssignmentById(assignmentId: number): Promise<AssignmentDTO | null> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    return assignment ? toAssignmentDTO(assignment) : null
  }

  /**
   * Send deadline reminder notifications to students who haven't submitted.
   * Only sends to students who are enrolled but have no submissions.
   *
   * @param assignmentId - The assignment ID
   * @param teacherId - The teacher ID (for authorization)
   * @returns Object with count of reminders sent
   */
  async sendReminderToNonSubmitters(
    assignmentId: number,
    teacherId: number,
  ): Promise<{ remindersSent: number }> {
    // Get assignment and verify it exists
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    // Verify teacher owns the class
    await requireClassOwnership(this.classRepo, assignment.classId, teacherId)

    // Get all enrolled students
    const enrolledStudents =
      await this.enrollmentRepo.getEnrolledStudentsWithInfo(assignment.classId)

    // Get all students who have submitted (latest submissions only)
    const { SubmissionRepository } =
      await import("../repositories/submission.repository.js")
    const submissionRepo = new SubmissionRepository()
    const submissions = await submissionRepo.getSubmissionsByAssignment(
      assignmentId,
      true,
    )
    const submittedStudentIds = new Set(submissions.map((sub) => sub.studentId))

    // Filter to students who haven't submitted
    const nonSubmitters = enrolledStudents.filter(
      (enrollment) => !submittedStudentIds.has(enrollment.user.id),
    )

    // Send notifications to non-submitters
    const notificationPromises = nonSubmitters.map((enrollment) =>
      this.notificationService.createNotification(
        enrollment.user.id,
        "DEADLINE_REMINDER",
        {
          assignmentId: assignment.id,
          assignmentTitle: assignment.assignmentName,
          dueDate: assignment.deadline
            ? new Date(assignment.deadline).toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "No deadline",
          assignmentUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
        },
      ),
    )

    await Promise.all(notificationPromises)

    return { remindersSent: nonSubmitters.length }
  }
}
