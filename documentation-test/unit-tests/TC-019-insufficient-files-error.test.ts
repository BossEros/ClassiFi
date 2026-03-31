/**
 * TC-019: Insufficient Files Error
 *
 * Module: Plagiarism Detection
 * Unit: Analyze Files
 * Date Tested: 3/28/26
 * Description: Verify error handling when fewer than 2 files are provided.
 * Expected Result: User sees "At least 2 files are required" message.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PlagiarismService, type AnalyzeRequest } from "../../backend-ts/src/modules/plagiarism/plagiarism.service.js"
import { InsufficientFilesError } from "../../backend-ts/src/shared/errors.js"

vi.mock("../../backend-ts/src/modules/assignments/assignment.repository.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: {
    plagiarismStructuralWeight: 0.7,
    plagiarismSemanticWeight: 0.3,
    plagiarismHybridThreshold: 0.5,
    semanticSimilarityMaxConcurrentRequests: 4,
  },
}))
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-persistence.service.js")
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-submission-file.service.js")
vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism-detector.factory.js")

describe("TC-019: Insufficient Files Error", () => {
  let plagiarismService: PlagiarismService

  beforeEach(() => {
    ;(PlagiarismService as any).prototype.legacyReportsStore = new Map()
    plagiarismService = new PlagiarismService(
      { getAssignmentById: vi.fn() } as any,
      { create: vi.fn() } as any,
      { fetchSubmissionFiles: vi.fn(), downloadSubmissionFiles: vi.fn() } as any,
      { getReusableAssignmentReport: vi.fn().mockResolvedValue(null), persistReport: vi.fn(), getReport: vi.fn(), getResultData: vi.fn(), deleteReport: vi.fn() } as any,
      { getSemanticScore: vi.fn(), healthCheck: vi.fn() } as any,
    )
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should throw InsufficientFilesError when only one file is provided", async () => {
    const request: AnalyzeRequest = {
      files: [{ path: "file1.py", content: 'print("hello")' }],
      language: "python",
    }

    const analyzePromise = plagiarismService.analyzeFiles(request)

    await expect(analyzePromise).rejects.toThrow(InsufficientFilesError)
    await expect(analyzePromise).rejects.toThrow("At least 2 files are required")
  })

  it("should throw InsufficientFilesError when files array is empty", async () => {
    const request: AnalyzeRequest = { files: [], language: "python" }

    const analyzePromise = plagiarismService.analyzeFiles(request)

    await expect(analyzePromise).rejects.toThrow(InsufficientFilesError)
    await expect(analyzePromise).rejects.toThrow("At least 2 files are required")
  })
})
