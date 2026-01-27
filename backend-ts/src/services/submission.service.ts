import { inject, injectable } from "tsyringe"
import { SubmissionRepository } from "@/repositories/submission.repository.js"
import { AssignmentRepository } from "@/repositories/assignment.repository.js"
import { EnrollmentRepository } from "@/repositories/enrollment.repository.js"
import { TestResultRepository } from "@/repositories/testResult.repository.js"
import { StorageService } from "@/services/storage.service.js"
import { CodeTestService } from "@/services/codeTest.service.js"
import { LatePenaltyService } from "@/services/latePenalty.service.js"
import { toSubmissionDTO, type SubmissionDTO } from "@/shared/mappers.js"
import {
  AssignmentNotFoundError,
  AssignmentInactiveError,
  DeadlinePassedError,
  NotEnrolledError,
  ResubmissionNotAllowedError,
  InvalidFileTypeError,
  FileTooLargeError,
  UploadFailedError,
  SubmissionNotFoundError,
  SubmissionFileNotFoundError,
} from "@/shared/errors.js"

/**
 * Business logic for submission-related operations.
 * Uses domain errors for exceptional conditions.
 */
@injectable()
export class SubmissionService {
  constructor(
    @inject("SubmissionRepository")
    private submissionRepo: SubmissionRepository,
    @inject("AssignmentRepository")
    private assignmentRepo: AssignmentRepository,
    @inject("EnrollmentRepository")
    private enrollmentRepo: EnrollmentRepository,
    @inject("TestResultRepository")
    private testResultRepo: TestResultRepository,
    @inject("StorageService")
    private storageService: StorageService,
    @inject("CodeTestService")
    private codeTestService: CodeTestService,
    @inject("LatePenaltyService")
    private latePenaltyService: LatePenaltyService,
  ) {}

  /** Submit an assignment */
  async submitAssignment(
    assignmentId: number,
    studentId: number,
    file: { filename: string; data: Buffer; mimetype: string },
  ): Promise<SubmissionDTO> {
    // Validate assignment exists and is active
    const assignment = await this.assignmentRepo.getAssignmentById(assignmentId)

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId)
    }

    if (!assignment.isActive) {
      throw new AssignmentInactiveError()
    }

    // Check deadline and late penalty
    const now = new Date()
    let isLate = false
    let penaltyResult: import("./latePenalty.service.js").PenaltyResult | null =
      null

    if (assignment.deadline && now > assignment.deadline) {
      // Submission is late - check if late penalties are enabled
      if (assignment.latePenaltyEnabled && assignment.latePenaltyConfig) {
        penaltyResult = this.latePenaltyService.calculatePenalty(
          now,
          assignment.deadline,
          assignment.latePenaltyConfig,
        )

        // If penalty is 100%, reject the submission
        if (penaltyResult.penaltyPercent >= 100) {
          throw new DeadlinePassedError()
        }

        isLate = penaltyResult.isLate
      } else {
        // No late penalty configured - reject late submission
        throw new DeadlinePassedError()
      }
    }

    // Check if student is enrolled in the class
    const isEnrolled = await this.enrollmentRepo.isEnrolled(
      studentId,
      assignment.classId,
    )
    if (!isEnrolled) {
      throw new NotEnrolledError()
    }

    // Check for existing submissions
    const existingSubmissions = await this.submissionRepo.getSubmissionHistory(
      assignmentId,
      studentId,
    )

    // Store existing submissions to delete after successful new submission
    const submissionsToDelete =
      existingSubmissions.length > 0 ? existingSubmissions : []

    if (existingSubmissions.length > 0 && !assignment.allowResubmission) {
      throw new ResubmissionNotAllowedError()
    }

    // Validate file extension
    const extension = file.filename.split(".").pop()?.toLowerCase()
    const validExtensions: Record<string, string[]> = {
      python: ["py"],
      java: ["java"],
      c: ["c", "h"],
    }

    const allowedExtensions =
      validExtensions[assignment.programmingLanguage] ?? []
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new InvalidFileTypeError(allowedExtensions, extension ?? "unknown")
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.data.length > maxSize) {
      throw new FileTooLargeError(10)
    }

    // Always use submission number 1 (old submissions will be cleaned up after successful creation)
    const submissionNumber = 1

    // Upload file using StorageService
    const filePath = `submissions/${assignmentId}/${studentId}/${submissionNumber}_${file.filename}`

    try {
      await this.storageService.upload(
        "submissions",
        filePath,
        file.data,
        file.mimetype,
        true,
      )
    } catch (error) {
      console.error("Submission upload error:", error)
      throw new UploadFailedError(
        error instanceof Error ? error.message : "Unknown upload error",
      )
    }

    // Create submission record
    const submission = await this.submissionRepo.createSubmission({
      assignmentId,
      studentId,
      fileName: file.filename,
      filePath,
      fileSize: file.data.length,
      submissionNumber,
      isLate,
      penaltyApplied: penaltyResult?.penaltyPercent ?? 0,
    })

    // Run tests automatically
    try {
      await this.codeTestService.runTestsForSubmission(submission.id)
    } catch (error) {
      console.error("Automatic test execution failed:", error)
      // We don't fail the submission itself if tests fail to run, just log it
    }

    // Fetch updated submission to get grade from tests
    const updatedSubmission = await this.submissionRepo.getSubmissionById(
      submission.id,
    )

    // Apply late penalty if applicable and grade is available
    if (
      updatedSubmission &&
      updatedSubmission.grade !== null &&
      isLate &&
      penaltyResult &&
      penaltyResult.penaltyPercent > 0
    ) {
      const penalizedGrade = this.latePenaltyService.applyPenalty(
        updatedSubmission.grade,
        penaltyResult,
      )
      // Update grade with penalty applied
      await this.submissionRepo.updateGrade(submission.id, penalizedGrade)
      // Update in-memory object for DTO return
      updatedSubmission.grade = penalizedGrade
    }

    // Cleanup old submissions only after successful new submission creation
    for (const sub of submissionsToDelete) {
      try {
        // Delete test results
        await this.testResultRepo.deleteBySubmissionId(sub.id)

        // Delete file from storage
        if (sub.filePath) {
          try {
            await this.storageService.deleteFiles("submissions", [sub.filePath])
          } catch (err) {
            console.error(
              `Failed to delete old submission file: ${sub.filePath}`,
              err,
            )
          }
        }

        // Delete submission record
        await this.submissionRepo.delete(sub.id)
      } catch (err) {
        console.error(
          `Failed to cleanup submission ${sub.id} (file: ${sub.filePath || "none"}):`,
          err,
        )
      }
    }

    return toSubmissionDTO(updatedSubmission ?? submission)
  }

  /** Get submission history for a student-assignment pair */
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

  /** Get all submissions for an assignment */
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

  /** Get all submissions by a student */
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

  /** Get file download URL using StorageService */
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

  /** Get submission content for preview */
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
}
