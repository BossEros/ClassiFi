import { inject, injectable } from "tsyringe"
import { AssignmentRepository } from "../repositories/assignment.repository.js"
import { TestCaseRepository } from "../repositories/testCase.repository.js"
import { ClassRepository } from "../repositories/class.repository.js"
import { EnrollmentRepository } from "../repositories/enrollment.repository.js"
import { SubmissionRepository } from "../repositories/submission.repository.js"
import { NotificationService } from "./notification/notification.service.js"
import { StorageService } from "./storage.service.js"
import { toAssignmentDTO, type AssignmentDTO } from "../shared/mappers.js"
import { requireClassOwnership } from "../shared/guards.js"
import {
  AssignmentNotFoundError,
  InvalidAssignmentDataError,
  BadRequestError,
} from "../shared/errors.js"
import type {
  UpdateAssignmentServiceDTO,
  CreateAssignmentServiceDTO,
} from "./service-dtos.js"
import { settings } from "../shared/config.js"
import { formatAssignmentDueDate } from "../shared/utils.js"
import { createLogger } from "../shared/logger.js"

/**
 * Business logic for assignment-related operations.
 * Follows SRP - handles only assignment concerns.
 * Uses domain errors for exceptional conditions.
 */
const logger = createLogger("AssignmentService")

@injectable()
export class AssignmentService {
  constructor(
    @inject("AssignmentRepository")
    private assignmentRepo: AssignmentRepository,
    @inject("ClassRepository") private classRepo: ClassRepository,
    @inject("TestCaseRepository") private testCaseRepo: TestCaseRepository,
    @inject("EnrollmentRepository")
    private enrollmentRepo: EnrollmentRepository,
    @inject("SubmissionRepository")
    private submissionRepo: SubmissionRepository,
    @inject("StorageService")
    private storageService: StorageService,
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
      descriptionImageUrl,
      descriptionImageAlt,
      programmingLanguage,
      deadline,
      allowResubmission,
      maxAttempts,
      templateCode,
      totalScore,
      scheduledDate,
      latePenaltyEnabled,
      latePenaltyConfig,
    } = data

    // Verify class exists and teacher owns it
    await requireClassOwnership(this.classRepo, classId, teacherId)

    const normalizedDescription = description.trim()
    const normalizedDescriptionImageUrl = this.normalizeNullableString(
      descriptionImageUrl,
    )
    const normalizedDescriptionImageAlt = this.normalizeNullableString(
      descriptionImageAlt,
    )

    this.validateDescriptionContent(
      normalizedDescription,
      normalizedDescriptionImageUrl,
    )

    const assignment = await this.assignmentRepo.createAssignment({
      classId,
      assignmentName,
      description: normalizedDescription,
      descriptionImageUrl: normalizedDescriptionImageUrl,
      descriptionImageAlt: normalizedDescriptionImageAlt,
      programmingLanguage,
      deadline,
      allowResubmission,
      maxAttempts,
      templateCode,
      totalScore,
      scheduledDate,
      latePenaltyEnabled,
      latePenaltyConfig,
    })

    // Notify enrolled students asynchronously (don't block assignment creation)
    this.notifyStudentsOfNewAssignment(assignment).catch((error) => {
      logger.error("Failed to send assignment notifications:", error)
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

    const notificationTargets = enrolledStudents.map((enrollment) => ({
      recipientUserId: enrollment.user.id,
      notificationData: {
        assignmentId: assignment.id,
        assignmentTitle: assignment.assignmentName,
        className: classData?.className || "Unknown Class",
        classId: assignment.classId,
        dueDate: formatAssignmentDueDate(assignment.deadline),
        assignmentUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
      },
    }))

    const settledNotificationResults = await Promise.allSettled(
      notificationTargets.map((target) =>
        this.notificationService.createNotification(
          target.recipientUserId,
          "ASSIGNMENT_CREATED",
          target.notificationData,
        ),
      ),
    )

    const failedRecipientUserIds: number[] = []

    settledNotificationResults.forEach((settledResult, index) => {
      if (settledResult.status === "fulfilled") {
        return
      }

      const failedTarget = notificationTargets[index]
      failedRecipientUserIds.push(failedTarget.recipientUserId)

      logger.error("Failed to send assignment notification", {
          assignmentId: assignment.id,
          recipientUserId: failedTarget.recipientUserId,
          notificationType: "ASSIGNMENT_CREATED",
          notificationData: failedTarget.notificationData,
          reason: settledResult.reason,
      })
    })

    if (failedRecipientUserIds.length > 0) {
      throw new Error(
        `Failed to send assignment notifications for assignment ${assignment.id}. Failed recipients: ${failedRecipientUserIds.join(", ")}`,
      )
    }
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
    const finalDeadline =
      updateData.deadline === undefined
        ? existingAssignment.deadline
        : updateData.deadline
    const finalScheduledDate =
      updateData.scheduledDate === undefined
        ? existingAssignment.scheduledDate
        : updateData.scheduledDate

    if (
      finalDeadline &&
      finalScheduledDate &&
      finalDeadline < finalScheduledDate
    ) {
      throw new InvalidAssignmentDataError(
        "Deadline must be after scheduled date",
      )
    }

    const normalizedDescription =
      updateData.description !== undefined
        ? updateData.description.trim()
        : undefined
    const normalizedDescriptionImageUrl =
      updateData.descriptionImageUrl !== undefined
        ? this.normalizeNullableString(updateData.descriptionImageUrl)
        : undefined
    const normalizedDescriptionImageAlt =
      updateData.descriptionImageAlt !== undefined
        ? this.normalizeNullableString(updateData.descriptionImageAlt)
        : undefined

    const finalDescription = (
      normalizedDescription ?? existingAssignment.description
    ).trim()
    const finalDescriptionImageUrl =
      normalizedDescriptionImageUrl !== undefined
        ? normalizedDescriptionImageUrl
        : existingAssignment.descriptionImageUrl

    this.validateDescriptionContent(finalDescription, finalDescriptionImageUrl)

    const previousDescriptionImageUrl = existingAssignment.descriptionImageUrl

    const updatedAssignment = await this.assignmentRepo.updateAssignment(
      assignmentId,
      {
        ...updateData,
        description: normalizedDescription,
        descriptionImageUrl: normalizedDescriptionImageUrl,
        descriptionImageAlt: normalizedDescriptionImageAlt,
      },
    )

    if (!updatedAssignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    const nextDescriptionImageUrl = updatedAssignment.descriptionImageUrl
    if (
      previousDescriptionImageUrl &&
      previousDescriptionImageUrl !== nextDescriptionImageUrl
    ) {
      await this.deleteDescriptionImageSafely(previousDescriptionImageUrl)
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

    if (assignment.descriptionImageUrl) {
      await this.deleteDescriptionImageSafely(assignment.descriptionImageUrl)
    }

    await this.assignmentRepo.deleteAssignment(assignmentId)
  }

  /**
   * Ensures coursework has at least one description surface.
   */
  private validateDescriptionContent(
    description: string,
    descriptionImageUrl: string | null | undefined,
  ): void {
    const hasTextDescription = description.trim().length > 0
    const hasImageDescription = !!descriptionImageUrl?.trim()

    if (!hasTextDescription && !hasImageDescription) {
      throw new InvalidAssignmentDataError(
        "Either description text or description image is required",
      )
    }
  }

  /**
   * Normalizes optional text values by trimming and converting blanks to null.
   */
  private normalizeNullableString(
    value: string | null | undefined,
  ): string | null {
    if (value === undefined || value === null) {
      return null
    }

    const trimmedValue = value.trim()
    return trimmedValue.length > 0 ? trimmedValue : null
  }

  /**
   * Best-effort cleanup for coursework description image files.
   */
  private async deleteDescriptionImageSafely(imageUrl: string): Promise<void> {
    try {
      await this.storageService.deleteAssignmentDescriptionImage(imageUrl)
    } catch (error) {
      logger.error("Failed to delete assignment description image", {
        imageUrl,
        error,
      })
    }
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
   * Enforces a 24-hour cooldown to prevent spam.
   *
   * @param assignmentId - The assignment ID
   * @param teacherId - The teacher ID (for authorization)
   * @returns Object with count of reminders sent
   * @throws BadRequestError if reminder was sent within the last 24 hours
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

    // Check cooldown: prevent sending reminders more than once per 24 hours
    if (assignment.lastReminderSentAt) {
      const hoursSinceLastReminder =
        (Date.now() - assignment.lastReminderSentAt.getTime()) /
        (1000 * 60 * 60)

      if (hoursSinceLastReminder < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastReminder)
        throw new BadRequestError(
          `Reminder was already sent ${Math.floor(hoursSinceLastReminder)} hours ago. Please wait ${hoursRemaining} more hour(s) before sending another reminder.`,
        )
      }
    }

    // Get all enrolled students
    const enrolledStudents =
      await this.enrollmentRepo.getEnrolledStudentsWithInfo(assignment.classId)

    // Get all students who have submitted (latest submissions only)
    const submissions = await this.submissionRepo.getSubmissionsByAssignment(
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
      this.notificationService
        .createNotification(enrollment.user.id, "DEADLINE_REMINDER", {
          assignmentId: assignment.id,
          assignmentTitle: assignment.assignmentName,
          dueDate: formatAssignmentDueDate(assignment.deadline),
          assignmentUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
        })
        .then(() => ({
          status: "fulfilled" as const,
          userId: enrollment.user.id,
        }))
        .catch((error) => ({
          status: "rejected" as const,
          userId: enrollment.user.id,
          error,
        })),
    )

    const results = await Promise.all(notificationPromises)

    // Count successful and failed notifications
    const successCount = results.filter((r) => r.status === "fulfilled").length
    const failedResults = results.filter(
      (r): r is { status: "rejected"; userId: number; error: unknown } =>
        r.status === "rejected",
    )

    // Log errors for failed notifications
    if (failedResults.length > 0) {
      failedResults.forEach(({ userId, error }) => {
        logger.error(
          `Failed to send deadline reminder for assignment ${assignment.id} to user ${userId}:`,
          error,
        )
      })
    }

    // Update the last reminder sent timestamp only if at least one notification succeeded
    if (successCount > 0) {
      await this.assignmentRepo.updateLastReminderSentAt(assignmentId)
    }

    return { remindersSent: successCount }
  }
}






