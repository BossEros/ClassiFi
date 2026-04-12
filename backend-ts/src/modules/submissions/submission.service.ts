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
} from "@/modules/assignments/late-penalty.service.js"
import { SimilarityRepository } from "@/modules/plagiarism/similarity.repository.js"
import {
  toSubmissionDTO,
  type SubmissionDTO,
} from "@/modules/submissions/submission.mapper.js"
import { type SubmissionFileDTO } from "@/modules/submissions/submission.dtos.js"
import type { Assignment } from "@/modules/assignments/assignment.model.js"
import type { Submission } from "@/modules/submissions/submission.model.js"
import {
  ALLOWED_EXTENSIONS,
  type ProgrammingLanguage,
} from "@/shared/constants.js"
import {
  BadRequestError,
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
import type { NotificationService } from "@/modules/notifications/notification.service.js"
import type { PlagiarismAutoAnalysisService } from "@/modules/plagiarism/plagiarism-auto-analysis.service.js"
import { settings } from "@/shared/config.js"
import { withTransaction } from "@/shared/transaction.js"

const logger = createLogger("SubmissionService")
const MAX_TEACHER_NAME_LENGTH = 100
const MAX_FEEDBACK_LENGTH = 5000

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
    @inject(DI_TOKENS.services.notification)
    private notificationService: NotificationService,
    @inject(DI_TOKENS.services.plagiarismAutoAnalysis)
    private plagiarismAutoAnalysisService: PlagiarismAutoAnalysisService,
    @inject(DI_TOKENS.repositories.similarity)
    private similarityRepo: SimilarityRepository,
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
    // STEP 1: Verify the assignment exists and is currently active
    const assignment = await this.validateAssignment(assignmentId)

    // STEP 2: Check the deadline and compute any late-submission penalty
    const penaltyResult = await this.checkDeadlineAndPenalty(assignment)

    // STEP 3: Confirm the student is enrolled in the class that owns this assignment
    await this.validateEnrollment(studentId, assignment.classId)

    // STEP 4: Load existing submissions and enforce resubmission and attempt-limit rules
    const existingSubmissions = await this.checkExistingSubmissions(
      assignmentId,
      studentId,
      assignment.allowResubmission,
      assignment.maxAttempts,
    )

    // STEP 5: Validate the uploaded file's extension and size
    this.validateFile(file, assignment.programmingLanguage)

    // STEP 6: Upload the file to storage and record its path
    const submissionNumber = this.calculateNextSubmissionNumber(existingSubmissions)

    const filePath = await this.uploadFile(
      assignmentId,
      studentId,
      file,
      submissionNumber,
    )

    // STEP 7: Create the submission record in the database
    const submission = await this.createSubmission(
      assignmentId,
      studentId,
      file,
      filePath,
      penaltyResult,
      submissionNumber,
    )

    // STEP 8: Run automated test cases and apply any late-penalty deduction to the grade
    const testsPassed = await this.runTestsAndApplyPenalty(
      submission.id,
      penaltyResult,
      assignment.totalScore ?? 100,
    )

    // STEP 9: If tests passed, prune older submissions so storage stays tidy
    if (testsPassed) {
      await this.cleanupOldSubmissions(existingSubmissions)
    }

    const updatedSubmission = await this.submissionRepo.getSubmissionById(
      submission.id,
    )

    // STEP 10: Kick off background plagiarism analysis for the assignment
    await this.triggerAutomaticSimilarityAnalysis(assignmentId)

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

    const scoreMap = await this.similarityRepo.getMaxSimilarityScoresBySubmissionIds(
      submissions.map((s) => s.id),
    )

    return submissions.map((s) => toSubmissionDTO(s, { similarityScore: scoreMap.get(s.id) ?? null }))
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

    const scoreMap = await this.similarityRepo.getMaxSimilarityScoresBySubmissionIds(
      submissions.map((s) => s.submission.id),
    )

    return submissions.map((s) =>
      toSubmissionDTO(s.submission, {
        studentName: s.studentName,
        similarityScore: scoreMap.get(s.submission.id) ?? null,
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

    const scoreMap = await this.similarityRepo.getMaxSimilarityScoresBySubmissionIds(
      submissions.map((s) => s.id),
    )

    return submissions.map((s) => toSubmissionDTO(s, { similarityScore: scoreMap.get(s.id) ?? null }))
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
   * Save teacher feedback on a submission, notifying the student via IN_APP and EMAIL.
   * If feedback already exists it is overwritten (one feedback per submission).
   *
   * @param submissionId - The submission to attach feedback to.
   * @param teacherName - Full name of the teacher for the notification message.
   * @param feedback - The feedback text.
   * @returns The updated submission DTO.
   */
  async saveTeacherFeedback(
    submissionId: number,
    teacherName: string,
    feedback: string,
  ): Promise<SubmissionDTO> {
    const submission = await this.submissionRepo.getSubmissionById(submissionId)

    if (!submission) {
      throw new SubmissionNotFoundError(submissionId)
    }

    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId,
    )

    if (!assignment) {
      throw new AssignmentNotFoundError(submission.assignmentId)
    }

    const normalizedTeacherName = teacherName.trim()
    const normalizedFeedback = feedback.trim()

    if (normalizedTeacherName.length === 0) {
      throw new BadRequestError("Teacher name cannot be empty")
    }

    if (normalizedTeacherName.length > MAX_TEACHER_NAME_LENGTH) {
      throw new BadRequestError(
        `Teacher name cannot exceed ${MAX_TEACHER_NAME_LENGTH} characters`,
      )
    }

    if (normalizedFeedback.length === 0) {
      throw new BadRequestError("Feedback cannot be empty")
    }

    if (normalizedFeedback.length > MAX_FEEDBACK_LENGTH) {
      throw new BadRequestError(
        `Feedback cannot exceed ${MAX_FEEDBACK_LENGTH} characters`,
      )
    }

    const submissionUrl = `${settings.frontendUrl}/dashboard/assignments/${assignment.id}`

    const updated = await withTransaction(async (transactionContext) => {
      const transactionSubmissionRepo =
        this.submissionRepo.withContext(transactionContext)
      const transactionNotificationService =
        this.notificationService.withContext(transactionContext)

      const updatedSubmission = await transactionSubmissionRepo.saveTeacherFeedback(
        submissionId,
        normalizedFeedback,
      )

      if (!updatedSubmission) {
        return undefined
      }

      await transactionNotificationService.createNotification(
        submission.studentId,
        "SUBMISSION_FEEDBACK_GIVEN",
        {
          submissionId,
          assignmentId: assignment.id,
          assignmentTitle: assignment.assignmentName,
          teacherName: normalizedTeacherName,
          submissionUrl,
        },
      )

      return updatedSubmission
    })

    if (!updated) {
      throw new SubmissionNotFoundError(submissionId)
    }

    void this.notificationService.sendEmailNotificationIfEnabled(
      submission.studentId,
      "SUBMISSION_FEEDBACK_GIVEN",
      {
        submissionId,
        assignmentId: assignment.id,
        assignmentTitle: assignment.assignmentName,
        teacherName: normalizedTeacherName,
        submissionUrl,
      },
    ).catch((error) => {
      logger.error("Failed to send submission feedback notification email", {
        submissionId,
        studentId: submission.studentId,
        error,
      })
    })

    const scoreMap = await this.similarityRepo.getMaxSimilarityScoresBySubmissionIds([updated.id])

    return toSubmissionDTO(updated, { similarityScore: scoreMap.get(updated.id) ?? null })
  }

  /**
   * Validate assignment exists and is active.
   */
  private async validateAssignment(assignmentId: number): Promise<Assignment> {
    // STEP 1: Fetch the assignment record — null means the ID never existed or was deleted
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    // STEP 2: Reject submissions to archived or draft assignments —
    // teachers must explicitly mark an assignment active before students can submit
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

    // STEP 1: If there's no deadline, or it hasn't passed yet, no penalty applies
    if (!assignment.deadline || now <= assignment.deadline) {
      return null
    }

    // STEP 2: Deadline has passed — check whether the teacher allows late submissions
    if (assignment.allowLateSubmissions) {
      // Fall back to the platform default penalty config if the teacher didn't set one
      const latePenaltyConfiguration =
        assignment.latePenaltyConfig ??
        this.latePenaltyService.getDefaultConfig()

      const penaltyResult = this.latePenaltyService.calculatePenalty(
        now,
        assignment.deadline,
        latePenaltyConfiguration,
      )

      // STEP 3: A 100% penalty means the window has effectively closed even with late allowed
      if (penaltyResult.penaltyPercent >= 100) {
        throw new DeadlinePassedError()
      }

      return penaltyResult
    }

    // Late submissions are disabled outright — hard reject
    throw new DeadlinePassedError()
  }

  /**
   * Validate student is enrolled in the class.
   */
  private async validateEnrollment(
    studentId: number,
    classId: number,
  ): Promise<void> {
    // A student can only submit to assignments that belong to a class they're enrolled in.
    // This prevents submitting to assignments in classes they can see but don't belong to.
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
    // STEP 1: Pull the full submission history so we know how many attempts the student has made
    const existingSubmissions = await this.submissionRepo.getSubmissionHistory(
      assignmentId,
      studentId,
    )

    // STEP 2: If the teacher disabled resubmissions, the first attempt is the only allowed one
    if (existingSubmissions.length > 0 && !allowResubmission) {
      throw new ResubmissionNotAllowedError()
    }

    // STEP 3: If the teacher set a cap, reject once the student has hit it
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
    // STEP 1: Extract the file extension and compare it against the language's allowed list
    // (e.g. Python only accepts .py, Java only accepts .java)
    const extension = file.filename.split(".").pop()?.toLowerCase()
    const allowedExtensions =
      ALLOWED_EXTENSIONS[programmingLanguage as ProgrammingLanguage] ?? []

    if (!extension || !allowedExtensions.includes(extension)) {
      throw new InvalidFileTypeError(allowedExtensions, extension ?? "unknown")
    }

    // STEP 2: Reject files over 10 MB — the code executor has a tight memory budget
    const maxSize = 10 * 1024 * 1024

    if (file.data.length > maxSize) {
      throw new FileTooLargeError(10)
    }
  }

  /**
   * Calculate the next submission number from the highest stored attempt.
   * This preserves monotonic numbering even when older submissions are deleted.
   */
  private calculateNextSubmissionNumber(
    existingSubmissions: Submission[],
  ): number {
    if (existingSubmissions.length === 0) return 1

    const highestSubmissionNumber = Math.max(
      ...existingSubmissions.map((submission) => submission.submissionNumber),
    )

    return highestSubmissionNumber + 1
  }

  /**
   * Upload file to storage.
   * Reuses the shared storage helper to keep submission paths consistent.
   */
  private async uploadFile(
    assignmentId: number,
    studentId: number,
    file: SubmissionFileDTO,
    submissionNumber: number,
  ): Promise<string> {
    try {
      // Upload to Supabase Storage under a deterministic path built from the IDs and attempt number
      // so files are easy to locate and clean up later (e.g. submissions/{assignmentId}/{studentId}/{attempt}/filename)
      return await this.storageService.uploadSubmission(
        assignmentId,
        studentId,
        submissionNumber,
        file.filename,
        file.data,
        file.mimetype,
      )
    } catch (error) {
      // Translate storage errors into a domain error so the controller gets a clean 500 message
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
    // Flatten the penalty result into the two scalar columns the DB stores:
    // isLate (boolean flag for display) and penaltyApplied (% that will be deducted from the grade).
    // If there's no penalty, both default to safe zero-values.
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
    totalScore: number,
  ): Promise<boolean> {
    // STEP 1: Send the submission to the code executor (Judge0).
    // runTestsForSubmission writes the grade and individual test results to the DB.
    // We return false on failure rather than throwing — a test-runner crash is non-fatal;
    // the submission was already saved and the student can still see their file.
    try {
      await this.codeTestService.runTestsForSubmission(submissionId)
    } catch (error) {
      logger.error("Automatic test execution failed:", error)
      return false
    }

    // STEP 2: If there's no late penalty (or it's 0%), nothing to deduct — we're done
    if (!penaltyResult || penaltyResult.penaltyPercent === 0) {
      return true
    }

    // STEP 3: Re-fetch the submission to get the grade that runTestsForSubmission just wrote,
    // then deduct the late penalty percentage and persist the adjusted grade
    const updatedSubmission = await this.submissionRepo.getSubmissionById(submissionId)

    if (updatedSubmission && updatedSubmission.grade !== null) {
      const penalizedGrade = this.latePenaltyService.applyPenalty(
        updatedSubmission.grade,
        penaltyResult,
        totalScore,
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
        // STEP 1: Remove the DB records first — the DB is the authoritative source of truth.
        // Deleting test results before the submission satisfies the foreign-key constraint.
        await this.testResultRepo.deleteBySubmissionId(sub.id)
        await this.submissionRepo.delete(sub.id)

        // STEP 2: Best-effort file cleanup from Supabase Storage.
        // File deletion is non-critical — if it fails, the DB record is already gone
        // so the orphaned file won't be visible or accessible to any user.
        if (sub.filePath) {
          try {
            await this.storageService.deleteFiles("submissions", [sub.filePath])
          } catch (fileError) {
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

  /**
   * Schedules non-blocking automatic similarity analysis after a successful submission.
   */
  private async triggerAutomaticSimilarityAnalysis(
    assignmentId: number,
  ): Promise<void> {
    // The plagiarism service decides internally whether a new run is warranted
    // (e.g. minimum submission threshold, cooldown window).
    // Errors are swallowed here — a plagiarism scheduling failure must never roll back
    // a student's successful submission.
    try {
      await this.plagiarismAutoAnalysisService.scheduleFromSubmission(
        assignmentId,
      )
    } catch (error) {
      logger.error("Failed to schedule automatic similarity analysis", {
        assignmentId,
        error,
      })
    }
  }
}
