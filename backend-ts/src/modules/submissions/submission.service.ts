import { inject, injectable } from "tsyringe"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { AssignmentRepository } from "@/modules/assignments/assignment.repository.js"
import { EnrollmentRepository } from "@/modules/enrollments/enrollment.repository.js"
import { TestResultRepository } from "@/modules/test-cases/test-result.repository.js"
import { StorageService } from "@/services/storage.service.js"
import { CodeTestService } from "@/modules/test-cases/code-test.service.js"
import {
  LatePenaltyService,
  type PenaltyResult,
} from "@/services/latePenalty.service.js"
import { toSubmissionDTO, type SubmissionDTO } from "@/shared/mappers.js"
import { type SubmissionFileDTO } from "@/modules/submissions/submission.dtos.js"
import type { Assignment, Submission } from "@/models/index.js"
import {
  ALLOWED_EXTENSIONS,
  type ProgrammingLanguage,
} from "@/shared/constants.js"
import {
  AssignmentNotFoundError,
  AssignmentInactiveError,
  DeadlinePassedError,
  NotEnrolledError,
  ResubmissionNotAllowedError,
  MaxAttemptsExceededError,
  InvalidFileTypeError,
  FileTooLargeError,
  UploadFailedError,
  SubmissionNotFoundError,
  SubmissionFileNotFoundError,
} from "@/shared/errors.js"
import { createLogger } from "@/shared/logger.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("SubmissionService")

/**
 * Business logic for submission-related operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class SubmissionService {
  constructor(
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.repositories.assignment)
    private assignmentRepo: AssignmentRepository,
    @inject(DI_TOKENS.repositories.enrollment)
    private enrollmentRepo: EnrollmentRepository,
    @inject(DI_TOKENS.repositories.testResult)
    private testResultRepo: TestResultRepository,
    @inject(DI_TOKENS.services.storage)
    private storageService: StorageService,
    @inject(DI_TOKENS.services.codeTest)
    private codeTestService: CodeTestService,
    @inject(DI_TOKENS.services.latePenalty)
    private latePenaltyService: LatePenaltyService,
  ) {}

  /**
   * Submit an assignment for a student, validating rules and running tests.
   *
   * @param assignmentId - The ID of the assignment being submitted.
   * @param studentId - The ID of the student submitting.
   * @param file - The submission file payload.
   * @returns The created submission as a DTO.
   */
  async submitAssignment(
    assignmentId: number,
    studentId: number,
    file: SubmissionFileDTO,
  ): Promise<SubmissionDTO> {
    const assignment = await this.validateAssignment(assignmentId)
    const penaltyResult = await this.checkDeadlineAndPenalty(assignment)
    await this.validateEnrollment(studentId, assignment.classId)

    const existingSubmissions = await this.checkExistingSubmissions(
      assignmentId,
      studentId,
      assignment.allowResubmission,
      assignment.maxAttempts,
    )

    this.validateFile(file, assignment.programmingLanguage)

    const submissionNumber = existingSubmissions.length + 1

    const filePath = await this.uploadFile(
      assignmentId,
      studentId,
      file,
      submissionNumber,
    )

    const submission = await this.createSubmission(
      assignmentId,
      studentId,
      file,
      filePath,
      penaltyResult,
      submissionNumber,
    )

    const testsPassed = await this.runTestsAndApplyPenalty(
      submission.id,
      penaltyResult,
    )

    if (testsPassed) {
      await this.cleanupOldSubmissions(existingSubmissions)
    }

    const updatedSubmission = await this.submissionRepo.getSubmissionById(
      submission.id,
    )

    return toSubmissionDTO(updatedSubmission ?? submission)
  }

  /**
   * Get submission history for a student-assignment pair.
   *
   * @param assignmentId - The ID of the assignment.
   * @param studentId - The ID of the student.
   * @returns Array of all submissions for this student-assignment pair.
   */
  async getSubmissionHistory(
    assignmentId: number,
    studentId: number,
  ): Promise<SubmissionDTO[]> {
    const submissions = await this.submissionRepo.getSubmissionHistory(
      assignmentId,
      studentId,
    )
    return submissions.map((s) => toSubmissionDTO(s))
  }

  /**
   * Get all submissions for an assignment.
   *
   * @param assignmentId - The ID of the assignment.
   * @param latestOnly - If true, returns only the latest submission per student. Defaults to true.
   * @returns Array of submissions with student information.
   */
  async getAssignmentSubmissions(
    assignmentId: number,
    latestOnly: boolean = true,
  ): Promise<SubmissionDTO[]> {
    const submissions = await this.submissionRepo.getSubmissionsWithStudentInfo(
      assignmentId,
      latestOnly,
    )

    return submissions.map((s) =>
      toSubmissionDTO(s.submission, {
        studentName: s.studentName,
      }),
    )
  }

  /**
   * Get all submissions by a student across all assignments.
   *
   * @param studentId - The ID of the student.
   * @param latestOnly - If true, returns only the latest submission per assignment. Defaults to true.
   * @returns Array of submissions for this student.
   */
  async getStudentSubmissions(
    studentId: number,
    latestOnly: boolean = true,
  ): Promise<SubmissionDTO[]> {
    const submissions = await this.submissionRepo.getSubmissionsByStudent(
      studentId,
      latestOnly,
    )
    return submissions.map((s) => toSubmissionDTO(s))
  }

  /**
   * Get a signed URL for downloading a submission file.
   *
   * @param filePath - The storage path of the file.
   * @param expiresIn - URL expiration time in seconds. Defaults to 3600 (1 hour).
   * @returns A signed URL for downloading the file.
   */
  async getFileDownloadUrl(
    filePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    return await this.storageService.getSignedUrl(
      "submissions",
      filePath,
      expiresIn,
    )
  }

  /**
   * Get submission file content for preview in the browser.
   *
   * @param submissionId - The ID of the submission.
   * @returns Object containing the file content and programming language.
   */
  async getSubmissionContent(
    submissionId: number,
  ): Promise<{ content: string; language: string }> {
    const submission = await this.submissionRepo.getSubmissionById(submissionId)
    if (!submission) {
      throw new SubmissionNotFoundError(submissionId)
    }

    // Get assignment to determine language
    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId,
    )
    if (!assignment) {
      throw new AssignmentNotFoundError(submission.assignmentId)
    }

    if (!submission.filePath) {
      throw new SubmissionFileNotFoundError(submissionId)
    }

    // Download content
    const content = await this.storageService.download(
      "submissions",
      submission.filePath,
    )
    return {
      content,
      language: assignment.programmingLanguage,
    }
  }

  /**
   * Get a signed URL for downloading a submission file by submission ID.
   *
   * @param submissionId - The ID of the submission.
   * @returns A signed URL for downloading the file with original filename.
   */
  async getSubmissionDownloadUrl(submissionId: number): Promise<string> {
    const submission = await this.submissionRepo.getSubmissionById(submissionId)
    if (!submission) {
      throw new SubmissionNotFoundError(submissionId)
    }

    if (!submission.filePath) {
      throw new SubmissionFileNotFoundError(submissionId)
    }

    return await this.storageService.getSignedUrl(
      "submissions",
      submission.filePath,
      3600,
      { download: submission.fileName },
    )
  }

  /**
   * Validate assignment exists and is active.
   */
  private async validateAssignment(assignmentId: number): Promise<Assignment> {
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    if (!assignment.isActive) {
      throw new AssignmentInactiveError()
    }

    return assignment
  }

  /**
   * Check deadline and calculate late penalty if applicable.
   */
  private async checkDeadlineAndPenalty(
    assignment: Assignment,
  ): Promise<PenaltyResult | null> {
    const now = new Date()

    if (!assignment.deadline || now <= assignment.deadline) {
      return null
    }

    if (assignment.allowLateSubmissions) {
      const latePenaltyConfiguration =
        assignment.latePenaltyConfig ?? this.latePenaltyService.getDefaultConfig()

      const penaltyResult = this.latePenaltyService.calculatePenalty(
        now,
        assignment.deadline,
        latePenaltyConfiguration,
      )

      if (penaltyResult.penaltyPercent >= 100) {
        throw new DeadlinePassedError()
      }

      return penaltyResult
    }

    throw new DeadlinePassedError()
  }

  /**
   * Validate student is enrolled in the class.
   */
  private async validateEnrollment(
    studentId: number,
    classId: number,
  ): Promise<void> {
    const isEnrolled = await this.enrollmentRepo.isEnrolled(studentId, classId)

    if (!isEnrolled) {
      throw new NotEnrolledError()
    }
  }

  /**
   * Check for existing submissions and validate resubmission rules.
   * Enforces both allowResubmission and maxAttempts constraints.
   */
  private async checkExistingSubmissions(
    assignmentId: number,
    studentId: number,
    allowResubmission: boolean,
    maxAttempts: number | null,
  ): Promise<Submission[]> {
    const existingSubmissions = await this.submissionRepo.getSubmissionHistory(
      assignmentId,
      studentId,
    )

    // Check if resubmission is allowed
    if (existingSubmissions.length > 0 && !allowResubmission) {
      throw new ResubmissionNotAllowedError()
    }

    // Check if max attempts has been reached
    if (maxAttempts != null && existingSubmissions.length >= maxAttempts) {
      throw new MaxAttemptsExceededError(maxAttempts)
    }

    return existingSubmissions
  }

  /**
   * Validate file extension and size.
   */
  private validateFile(
    file: SubmissionFileDTO,
    programmingLanguage: string,
  ): void {
    const extension = file.filename.split(".").pop()?.toLowerCase()
    const allowedExtensions =
      ALLOWED_EXTENSIONS[programmingLanguage as ProgrammingLanguage] ?? []

    if (!extension || !allowedExtensions.includes(extension)) {
      throw new InvalidFileTypeError(allowedExtensions, extension ?? "unknown")
    }

    const maxSize = 10 * 1024 * 1024

    if (file.data.length > maxSize) {
      throw new FileTooLargeError(10)
    }
  }

  /**
   * Upload file to storage.
   * Uses upsert:true to allow overwriting files at the same path.
   */
  private async uploadFile(
    assignmentId: number,
    studentId: number,
    file: SubmissionFileDTO,
    submissionNumber: number,
  ): Promise<string> {
    const filePath = `submissions/${assignmentId}/${studentId}/${submissionNumber}_${file.filename}`

    try {
      await this.storageService.upload(
        "submissions",
        filePath,
        file.data,
        file.mimetype,
        true,
      )
      return filePath
    } catch (error) {
      logger.error("Submission upload error:", error)
      throw new UploadFailedError(
        error instanceof Error ? error.message : "Unknown upload error",
      )
    }
  }

  /**
   * Create submission record in database.
   */
  private async createSubmission(
    assignmentId: number,
    studentId: number,
    file: SubmissionFileDTO,
    filePath: string,
    penaltyResult: PenaltyResult | null,
    submissionNumber: number,
  ): Promise<Submission> {
    return await this.submissionRepo.createSubmission({
      assignmentId,
      studentId,
      fileName: file.filename,
      filePath,
      fileSize: file.data.length,
      submissionNumber,
      isLate: penaltyResult?.isLate ?? false,
      penaltyApplied: penaltyResult?.penaltyPercent ?? 0,
    })
  }

  /**
   * Run tests and apply late penalty to grade if applicable.
   *
   * @returns True if tests executed successfully, false if test execution failed.
   */
  private async runTestsAndApplyPenalty(
    submissionId: number,
    penaltyResult: PenaltyResult | null,
  ): Promise<boolean> {
    try {
      await this.codeTestService.runTestsForSubmission(submissionId)
    } catch (error) {
      logger.error("Automatic test execution failed:", error)
      return false
    }

    if (!penaltyResult || penaltyResult.penaltyPercent === 0) {
      return true
    }

    const updatedSubmission =
      await this.submissionRepo.getSubmissionById(submissionId)

    if (updatedSubmission && updatedSubmission.grade !== null) {
      const penalizedGrade = this.latePenaltyService.applyPenalty(
        updatedSubmission.grade,
        penaltyResult,
      )
      await this.submissionRepo.updateGrade(submissionId, penalizedGrade)
    }

    return true
  }

  /**
   * Cleanup old submissions after successful new submission.
   * Deletes database records first, then attempts best-effort file cleanup.
   * This ensures the authoritative database record is removed even if file deletion fails.
   */
  private async cleanupOldSubmissions(
    submissions: Submission[],
  ): Promise<void> {
    for (const sub of submissions) {
      try {
        // Delete database records first (authoritative source of truth)
        await this.testResultRepo.deleteBySubmissionId(sub.id)
        await this.submissionRepo.delete(sub.id)

        // Best-effort file cleanup (non-critical)
        if (sub.filePath) {
          try {
            await this.storageService.deleteFiles("submissions", [sub.filePath])
          } catch (fileError) {
            // Log but don't fail - file cleanup is non-critical
            logger.error(
              `Failed to delete file for submission ${sub.id}: ${sub.filePath}`,
              fileError,
            )
          }
        }
      } catch (err) {
        logger.error(
          `Failed to cleanup submission ${sub.id} (file: ${sub.filePath || "none"}):`,
          err,
        )
      }
    }
  }
}





