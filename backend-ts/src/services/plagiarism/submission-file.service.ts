import { inject, injectable } from "tsyringe"
import { SubmissionRepository } from "../../repositories/submission.repository.js"
import { StorageService } from "../storage.service.js"
import { File } from "../../lib/plagiarism/index.js"
import { PLAGIARISM_CONFIG } from "../../shared/mappers.js"
import {
  InsufficientFilesError,
  InsufficientDownloadedFilesError,
  FileDownloadError,
} from "../../shared/errors.js"

@injectable()
export class SubmissionFileService {
  constructor(
    @inject("SubmissionRepository")
    private submissionRepo: SubmissionRepository,
    @inject("StorageService") private storageService: StorageService,
  ) {}

  /** Fetch and download all submission files for an assignment */
  async fetchSubmissionFiles(assignmentId: number): Promise<File[]> {
    const submissionsWithInfo =
      await this.submissionRepo.getSubmissionsWithStudentInfo(
        assignmentId,
        true, // latestOnly
      )

    if (submissionsWithInfo.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
      throw new InsufficientFilesError(
        PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED,
        submissionsWithInfo.length,
      )
    }

    const files: File[] = []

    for (const item of submissionsWithInfo) {
      const { submission, studentName } = item

      try {
        const content = await this.storageService.download(
          "submissions",
          submission.filePath,
        )

        files.push(
          new File(submission.fileName, content, {
            studentId: submission.studentId.toString(),
            studentName: studentName,
            submissionId: submission.id.toString(),
          }),
        )
      } catch (error) {
        // TODO: Replace with structured logger (e.g., pino, winston) for better observability
        console.warn(
          `Failed to download file for submission ${submission.id}:`,
          error,
        )
        continue
      }
    }

    if (files.length < PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED) {
      throw new InsufficientDownloadedFilesError(
        PLAGIARISM_CONFIG.MINIMUM_FILES_REQUIRED,
        files.length,
      )
    }

    return files
  }

  /** Download two submission files and return their content */
  async downloadSubmissionFiles(
    filePath1: string,
    filePath2: string,
  ): Promise<[string, string]> {
    try {
      const [leftContent, rightContent] = await Promise.all([
        this.storageService.download("submissions", filePath1),
        this.storageService.download("submissions", filePath2),
      ])

      return [leftContent, rightContent]
    } catch (error) {
      // TODO: Replace with structured logger (e.g., pino, winston) for better observability
      console.error("Failed to download submission files:", error)
      throw new FileDownloadError(0, "Failed to download file content")
    }
  }
}
