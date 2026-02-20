import { inject, injectable } from "tsyringe"
import { SubmissionRepository } from "@/modules/submissions/submission.repository.js"
import { StorageService } from "@/services/storage.service.js"
import { File } from "@/lib/plagiarism/index.js"
import { PLAGIARISM_CONFIG } from "@/modules/plagiarism/plagiarism.mapper.js"
import {
  InsufficientFilesError,
  InsufficientDownloadedFilesError,
  FileDownloadError,
} from "@/shared/errors.js"
import { createLogger } from "@/shared/logger.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const logger = createLogger("PlagiarismSubmissionFileService")

@injectable()
export class PlagiarismSubmissionFileService {
  constructor(
    @inject(DI_TOKENS.repositories.submission)
    private submissionRepo: SubmissionRepository,
    @inject(DI_TOKENS.services.storage) private storageService: StorageService,
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
        logger.warn(
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
      logger.error("Failed to download submission files:", error)
      throw new FileDownloadError(0, "Failed to download file content")
    }
  }
}


