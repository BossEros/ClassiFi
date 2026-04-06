import { inject, injectable } from "tsyringe"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { TestCaseRepository } from "@/modules/test-cases/test-case.repository.js"
import { ClassRepository } from "@/modules/classes/class.repository.js"
import { EnrollmentRepository } from "@/modules/enrollments/enrollment.repository.js"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { ModuleRepository } from "@/modules/modules/module.repository.js"
import { NotificationService } from "@/modules/notifications/notification.service.js"
import { SimilarityPenaltyService } from "@/modules/plagiarism/similarity-penalty.service.js"
import { StorageService } from "@/services/storage.service.js"
import {
  toAssignmentDTO,
  type AssignmentDTO,
} from "@/modules/assignments/assignment.mapper.js"
import { requireClassOwnership } from "@/modules/classes/class.guard.js"
import {
  AssignmentNotFoundError,
  InvalidAssignmentDataError,
  BadRequestError,
} from "@/shared/errors.js"
import type {
  UpdateAssignmentServiceDTO,
  CreateAssignmentServiceDTO,
} from "@/modules/assignments/assignment.dtos.js"
import { settings } from "@/shared/config.js"
import { formatAssignmentDueDate } from "@/modules/assignments/assignment-deadline.util.js"
import { createLogger } from "@/shared/logger.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Business logic for assignment-related operations.
 * Follows SRP - handles only assignment concerns.
 * Uses domain errors for exceptional conditions.
 */
const logger = createLogger("AssignmentService")

@injectable()
export class AssignmentService {
  constructor(
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.class) private classRepo: ClassRepository,
    @inject(DI_TOKENS.repositories.testCase)
    private testCaseRepo: TestCaseRepository,
    @inject(DI_TOKENS.repositories.enrollment)
    private enrollmentRepo: EnrollmentRepository,
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.module)
    private moduleRepo: ModuleRepository,
    @inject(DI_TOKENS.services.storage)
    private storageService: StorageService,
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
    @inject(DI_TOKENS.services.similarityPenalty)
    private similarityPenaltyService: SimilarityPenaltyService,
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
      moduleId,
      assignmentName,
      instructions,
      instructionsImageUrl,
      programmingLanguage,
      deadline,
      allowResubmission,
      maxAttempts,
      templateCode,
      totalScore,
      scheduledDate,
      allowLateSubmissions,
      latePenaltyConfig,
      enableSimilarityPenalty,
      similarityPenaltyConfig,
    } = data

    // STEP 1: Verify the class exists and the requesting teacher owns it
    await requireClassOwnership(this.classRepo, classId, teacherId)

    // STEP 2: Verify the selected module belongs to this class
    await this.validateModuleBelongsToClass(moduleId, classId)

    // STEP 3: Normalize text fields and persist the assignment to the database
    const normalizedInstructions = instructions.trim()
    const normalizedInstructionsImageUrl = this.normalizeNullableString(instructionsImageUrl)

    const assignment = await this.assignmentRepo.createAssignment({
      classId,
      moduleId,
      assignmentName,
      instructions: normalizedInstructions,
      instructionsImageUrl: normalizedInstructionsImageUrl,
      programmingLanguage,
      deadline,
      allowResubmission,
      maxAttempts,
      templateCode,
      totalScore,
      scheduledDate,
      allowLateSubmissions,
      latePenaltyConfig,
      enableSimilarityPenalty: enableSimilarityPenalty ?? false,
      similarityPenaltyConfig: enableSimilarityPenalty ? (similarityPenaltyConfig ?? null) : null,
    })

    // STEP 4: Notify all enrolled students about the new assignment (fire-and-forget)
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
      notificationTargets.map(async (target) => {
        await this.notificationService.createNotification(
          target.recipientUserId,
          "ASSIGNMENT_CREATED",
          target.notificationData,
        )
        await this.notificationService.sendEmailNotificationIfEnabled(
          target.recipientUserId,
          "ASSIGNMENT_CREATED",
          target.notificationData,
        )
      }),
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

    // STEP 1: Verify the assignment exists and the requesting teacher owns its class
    const existingAssignment =
      await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!existingAssignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    await requireClassOwnership(
      this.classRepo,
      existingAssignment.classId,
      teacherId,
    )

    // STEP 2: If the module is being changed, verify the new module belongs to this class
    if (
      updateData.moduleId !== undefined &&
      updateData.moduleId !== existingAssignment.moduleId
    ) {
      await this.validateModuleBelongsToClass(
        updateData.moduleId,
        existingAssignment.classId,
      )
    }

    // STEP 3: Validate business rules — deadline must be after the scheduled date
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

    // STEP 4: Normalize text fields and persist the updates to the database
    const normalizedInstructions =
      updateData.instructions !== undefined
        ? updateData.instructions.trim()
        : undefined
    const normalizedInstructionsImageUrl =
      updateData.instructionsImageUrl !== undefined
        ? this.normalizeNullableString(updateData.instructionsImageUrl)
        : undefined

    const previousInstructionsImageUrl = existingAssignment.instructionsImageUrl

    const updatedAssignment = await this.assignmentRepo.updateAssignment(
      assignmentId,
      {
        ...updateData,
        instructions: normalizedInstructions,
        instructionsImageUrl: normalizedInstructionsImageUrl,
      },
    )

    if (!updatedAssignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    // STEP 5: Delete the old instructions image from storage if it was replaced
    const nextInstructionsImageUrl = updatedAssignment.instructionsImageUrl
    if (
      previousInstructionsImageUrl &&
      previousInstructionsImageUrl !== nextInstructionsImageUrl
    ) {
      await this.deleteInstructionsImageSafely(previousInstructionsImageUrl)
    }

    // STEP 6: Re-sync grade penalties if the similarity penalty setting changed
    if (updateData.enableSimilarityPenalty !== undefined) {
      await this.similarityPenaltyService.syncAssignmentPenaltyState(
        assignmentId,
      )
    }

    // STEP 7: Notify enrolled students about the update (fire-and-forget)
    this.sendAssignmentUpdatedNotifications(updatedAssignment).catch(
      (error) => logger.error("Failed to send assignment update notifications", { assignmentId, error }),
    )

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
    // STEP 1: Verify the assignment exists and the requesting teacher owns its class
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    await requireClassOwnership(this.classRepo, assignment.classId, teacherId)

    // STEP 2: Delete the instructions image from storage if one exists (best-effort)
    if (assignment.instructionsImageUrl) {
      await this.deleteInstructionsImageSafely(assignment.instructionsImageUrl)
    }

    // STEP 3: Delete the assignment record from the database (cascades to test cases and submissions)
    await this.assignmentRepo.deleteAssignment(assignmentId)
  }

  /**
   * Validates that the given module belongs to the expected class.
   *
   * @param moduleId - The module ID to validate.
   * @param classId - The class ID the assignment belongs to.
   * @throws BadRequestError if the module does not exist or belongs to a different class.
   */
  private async validateModuleBelongsToClass(
    moduleId: number,
    classId: number,
  ): Promise<void> {
    const module = await this.moduleRepo.getModuleById(moduleId)

    if (!module) {
      throw new BadRequestError(`Module not found: ${moduleId}`)
    }

    if (module.classId !== classId) {
      throw new BadRequestError("Module does not belong to the specified class")
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
   * Best-effort cleanup for assignment instructions image files.
   */
  private async deleteInstructionsImageSafely(imageUrl: string): Promise<void> {
    try {
      await this.storageService.deleteAssignmentInstructionsImage(imageUrl)
    } catch (error) {
      logger.error("Failed to delete assignment instructions image", {
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
    // STEP 1: Verify the assignment exists and the requesting teacher owns its class
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    await requireClassOwnership(this.classRepo, assignment.classId, teacherId)

    // STEP 2: Enforce the 24-hour cooldown to prevent notification spam
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

    // STEP 3: Identify enrolled students who have not yet submitted
    const enrolledStudents =
      await this.enrollmentRepo.getEnrolledStudentsWithInfo(assignment.classId)

    const submissions = await this.submissionRepo.getSubmissionsByAssignment(
      assignmentId,
      true,
    )
    const submittedStudentIds = new Set(submissions.map((sub) => sub.studentId))

    const nonSubmitters = enrolledStudents.filter(
      (enrollment) => !submittedStudentIds.has(enrollment.user.id),
    )

    // STEP 4: Send deadline reminder notifications concurrently to all non-submitters
    const notificationPromises = nonSubmitters.map((enrollment) =>
      Promise.all([
        this.notificationService.createNotification(
          enrollment.user.id,
          "DEADLINE_REMINDER",
          {
            assignmentId: assignment.id,
            assignmentTitle: assignment.assignmentName,
            dueDate: formatAssignmentDueDate(assignment.deadline),
            assignmentUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
          },
        ),
        this.notificationService.sendEmailNotificationIfEnabled(
          enrollment.user.id,
          "DEADLINE_REMINDER",
          {
            assignmentId: assignment.id,
            assignmentTitle: assignment.assignmentName,
            dueDate: formatAssignmentDueDate(assignment.deadline),
            assignmentUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
          },
        ),
      ])
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

    if (failedResults.length > 0) {
      failedResults.forEach(({ userId, error }) => {
        logger.error(
          `Failed to send deadline reminder for assignment ${assignment.id} to user ${userId}:`,
          error,
        )
      })
    }

    // STEP 5: Update the last reminder timestamp and return the count of successful reminders
    if (successCount > 0) {
      await this.assignmentRepo.updateLastReminderSentAt(assignmentId)
    }

    return { remindersSent: successCount }
  }

  /**
   * Send ASSIGNMENT_UPDATED notifications to all enrolled students.
   * Runs as a background operation; errors are logged but do not propagate.
   */
  private async sendAssignmentUpdatedNotifications(
    assignment: { id: number; classId: number; assignmentName: string; deadline: Date | null },
  ): Promise<void> {
    const [classData, enrolledStudents] = await Promise.all([
      this.classRepo.getClassById(assignment.classId),
      this.enrollmentRepo.getEnrolledStudentsWithInfo(assignment.classId),
    ])

    const className = classData?.className || "Unknown Class"

    const notificationTargets = enrolledStudents.map((enrollment) => ({
      recipientUserId: enrollment.user.id,
      notificationData: {
        assignmentId: assignment.id,
        assignmentTitle: assignment.assignmentName,
        className,
        classId: assignment.classId,
        dueDate: formatAssignmentDueDate(assignment.deadline),
        assignmentUrl: `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`,
      },
    }))

    const results = await Promise.allSettled(
      notificationTargets.map(async (target) => {
        await this.notificationService.createNotification(target.recipientUserId, "ASSIGNMENT_UPDATED", target.notificationData)
        await this.notificationService.sendEmailNotificationIfEnabled(target.recipientUserId, "ASSIGNMENT_UPDATED", target.notificationData)
      }),
    )

    const failedCount = results.filter((r) => r.status === "rejected").length

    if (failedCount > 0) {
      logger.error("Failed to send some assignment update notifications", {
        assignmentId: assignment.id,
        totalTargets: notificationTargets.length,
        failedCount,
      })
    }
  }
}
