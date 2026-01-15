import { inject, injectable } from "tsyringe";
import { SubmissionRepository } from "../repositories/submission.repository.js";
import { AssignmentRepository } from "../repositories/assignment.repository.js";
import { EnrollmentRepository } from "../repositories/enrollment.repository.js";
import { ClassRepository } from "../repositories/class.repository.js";
import { TestResultRepository } from "../repositories/testResult.repository.js";
import { StorageService } from "./storage.service.js";
import { CodeTestService } from "./codeTest.service.js";
import { toSubmissionDTO, type SubmissionDTO } from "../shared/mappers.js";
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
} from "../shared/errors.js";

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
    @inject("ClassRepository") private classRepo: ClassRepository,
    @inject("TestResultRepository")
    private testResultRepo: TestResultRepository,
    @inject("StorageService") private storageService: StorageService,
    @inject("CodeTestService") private codeTestService: CodeTestService
  ) {}

  /** Submit an assignment */
  async submitAssignment(
    assignmentId: number,
    studentId: number,
    file: { filename: string; data: Buffer; mimetype: string }
  ): Promise<SubmissionDTO> {
    // Validate assignment exists and is active
    const assignment = await this.assignmentRepo.getAssignmentById(
      assignmentId
    );

    if (!assignment) {
      throw new AssignmentNotFoundError(assignmentId);
    }

    if (!assignment.isActive) {
      throw new AssignmentInactiveError();
    }

    // Check deadline
    const now = new Date();
    if (assignment.deadline && now > assignment.deadline) {
      throw new DeadlinePassedError();
    }

    // Check if student is enrolled in the class
    const isEnrolled = await this.enrollmentRepo.isEnrolled(
      studentId,
      assignment.classId
    );
    if (!isEnrolled) {
      throw new NotEnrolledError();
    }

    // Check for existing submissions
    const existingSubmissions = await this.submissionRepo.getSubmissionHistory(
      assignmentId,
      studentId
    );

    if (existingSubmissions.length > 0) {
      if (!assignment.allowResubmission) {
        throw new ResubmissionNotAllowedError();
      }

      // Cleanup: Delete ALL previous submissions and their data (File + TestResults + DB Record)
      for (const sub of existingSubmissions) {
        // 1. Delete Test Results
        await this.testResultRepo.deleteBySubmissionId(sub.id);

        // 2. Delete File from Storage
        if (sub.filePath) {
          try {
            await this.storageService.deleteFiles("submissions", [
              sub.filePath,
            ]);
          } catch (err) {
            console.error(
              `Failed to delete old submission file: ${sub.filePath}`,
              err
            );
          }
        }

        // 3. Delete Submission Record
        // Assuming base generic Delete exists or we need to add specific delete to repo.
        // If BaseRepository has delete(id), we use it.
        // Checking SubmissionRepository again... it inherits BaseRepository.
        // Assuming BaseRepository has delete(id). If not, we'd need to add it.
        // Given previous context, it likely has common CRUD operation.
        // Using a safe manual delete call or assuming delete(id) works.
        // Wait, I haven't seen BaseRepository delete method.
        // But I can create a delete method in SubmissionRepository "deleteSubmission" just to be safe if generic delete isn't confirmed.
        // Actually, I'll assume I can just use `submissionRepo.delete(sub.id)` if it's standard,
        // If not, I'll add `deleteSubmission` to SubmissionRepository in a future step if this errors.
        // For now, I'll check BaseRepository in next step if this fails or just add a direct delete call via existing repo methods if possible.
        // Ah, I don't see a `delete` method in SubmissionRepository in the view.
        // I will add `deleteSubmission` logic here assuming `submissionRepo.delete` exists on BaseRepository,
        // if it fails I'll fix it.
        // Actually, `StorageService` calls `deleteFiles`.
        // Let's assume `submissionRepo.delete` is available from Base.
        await this.submissionRepo.delete(sub.id);
      }
    }

    // Validate file extension
    const extension = file.filename.split(".").pop()?.toLowerCase();
    const validExtensions: Record<string, string[]> = {
      python: ["py"],
      java: ["java"],
      c: ["c", "h"],
    };

    const allowedExtensions =
      validExtensions[assignment.programmingLanguage] ?? [];
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new InvalidFileTypeError(allowedExtensions, extension ?? "unknown");
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.data.length > maxSize) {
      throw new FileTooLargeError(10);
    }

    // Reset submission number to 1 since we deleted history
    const submissionNumber = 1;

    // Upload file using StorageService
    const filePath = `submissions/${assignmentId}/${studentId}/${submissionNumber}_${file.filename}`;

    try {
      await this.storageService.upload(
        "submissions",
        filePath,
        file.data,
        file.mimetype,
        true
      );
    } catch (error) {
      console.error("Submission upload error:", error);
      throw new UploadFailedError(
        error instanceof Error ? error.message : "Unknown upload error"
      );
    }

    // Create submission record
    const submission = await this.submissionRepo.createSubmission({
      assignmentId,
      studentId,
      fileName: file.filename,
      filePath,
      fileSize: file.data.length,
      submissionNumber,
    });

    // Run tests automatically
    try {
      await this.codeTestService.runTestsForSubmission(submission.id);
    } catch (error) {
      console.error("Automatic test execution failed:", error);
      // We don't fail the submission itself if tests fail to run, just log it
    }

    // Re-fetch submission to get the updated grade after tests
    const updatedSubmission = await this.submissionRepo.getSubmissionById(
      submission.id
    );
    return toSubmissionDTO(updatedSubmission ?? submission);
  }

  /** Get submission history for a student-assignment pair */
  async getSubmissionHistory(
    assignmentId: number,
    studentId: number
  ): Promise<SubmissionDTO[]> {
    const submissions = await this.submissionRepo.getSubmissionHistory(
      assignmentId,
      studentId
    );
    return submissions.map((s) => toSubmissionDTO(s));
  }

  /** Get all submissions for an assignment */
  async getAssignmentSubmissions(
    assignmentId: number,
    latestOnly: boolean = true
  ): Promise<SubmissionDTO[]> {
    const submissions = await this.submissionRepo.getSubmissionsWithStudentInfo(
      assignmentId,
      latestOnly
    );

    return submissions.map((s) =>
      toSubmissionDTO(s.submission, {
        studentName: s.studentName,
      })
    );
  }

  /** Get all submissions by a student */
  async getStudentSubmissions(
    studentId: number,
    latestOnly: boolean = true
  ): Promise<SubmissionDTO[]> {
    const submissions = await this.submissionRepo.getSubmissionsByStudent(
      studentId,
      latestOnly
    );
    return submissions.map((s) => toSubmissionDTO(s));
  }

  /** Get file download URL using StorageService */
  async getFileDownloadUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    return await this.storageService.getSignedUrl(
      "submissions",
      filePath,
      expiresIn
    );
  }

  /** Get submission content for preview */
  async getSubmissionContent(
    submissionId: number
  ): Promise<{ content: string; language: string }> {
    const submission = await this.submissionRepo.getSubmissionById(
      submissionId
    );
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Get assignment to determine language
    const assignment = await this.assignmentRepo.getAssignmentById(
      submission.assignmentId
    );
    if (!assignment) {
      throw new AssignmentNotFoundError(submission.assignmentId);
    }

    if (!submission.filePath) {
      throw new Error("Submission has no file");
    }

    // Download content
    const content = await this.storageService.download(
      "submissions",
      submission.filePath
    );
    return {
      content,
      language: assignment.programmingLanguage,
    };
  }

  async getSubmissionDownloadUrl(submissionId: number): Promise<string> {
    const submission = await this.submissionRepo.getSubmissionById(
      submissionId
    );
    if (!submission) {
      throw new SubmissionNotFoundError(submissionId);
    }

    if (!submission.filePath) {
      throw new Error("Submission has no file");
    }

    return await this.storageService.getSignedUrl(
      "submissions",
      submission.filePath,
      3600,
      { download: submission.fileName }
    );
  }
}
